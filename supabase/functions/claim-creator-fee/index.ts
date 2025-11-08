import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  VersionedTransaction
} from 'https://esm.sh/@solana/web3.js@1.87.6'
import bs58 from 'https://esm.sh/bs58@5.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RPC_URL = Deno.env.get('RPC_URL') || 'https://api.mainnet-beta.solana.com'
const connection = new Connection(RPC_URL, 'confirmed')

// Wallet addresses
const DEPLOYER_WALLET_ADDRESS = Deno.env.get('DEPLOYER_WALLET_ADDRESS') // Funds RainPool giveaways
const DEV_WALLET_ADDRESS = Deno.env.get('DEV_WALLET_ADDRESS') // Operations/marketing
const PUMPPORTAL_API_KEY = Deno.env.get('CREATOR_WALLET_PUMPPORTAL_API_KEY')

// PumpPortal API endpoints
const PUMPPORTAL_LOCAL_API = 'https://pumpportal.fun/api/trade-local'

/**
 * Get payout wallet keypair for signing split transactions
 */
function getPayoutWallet() {
  const privateKey = Deno.env.get('PAYOUT_WALLET_PRIVATE_KEY')
  if (!privateKey) throw new Error('PAYOUT_WALLET_PRIVATE_KEY not set')
  const secretKey = bs58.decode(privateKey)
  return Keypair.fromSecretKey(secretKey)
}

/**
 * Get creator wallet keypair
 */
function getCreatorWallet() {
  if (!PUMPPORTAL_API_KEY) throw new Error('CREATOR_WALLET_PUMPPORTAL_API_KEY not set')
  const secretKey = bs58.decode(PUMPPORTAL_API_KEY)
  return Keypair.fromSecretKey(secretKey)
}

/**
 * Claim creator fees from PumpPortal using Local API
 * This builds the transaction locally and we sign it, avoiding API key issues
 */
async function claimCreatorFees(mint: string): Promise<{ success: boolean; txSig?: string; lamports?: number; error?: string }> {
  try {
    const creatorWallet = getCreatorWallet()
    console.log('📡 Calling PumpPortal Local API to build claim transaction...')
    console.log(`Creator wallet: ${creatorWallet.publicKey.toString()}`)

    // Use PumpPortal's trade-local API which builds the transaction for us to sign
    const response = await fetch(PUMPPORTAL_LOCAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: creatorWallet.publicKey.toString(),
        action: 'collectCreatorFee',
        mint: mint,
        priorityFee: 0.000005,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ PumpPortal API error:', errorText)
      return { success: false, error: `PumpPortal API error: ${response.status} - ${errorText}` }
    }

    // Response is the raw transaction bytes
    const data = await response.arrayBuffer()
    console.log(`✅ Got transaction (${data.byteLength} bytes)`)

    // Deserialize and sign the transaction
    const tx = VersionedTransaction.deserialize(new Uint8Array(data))
    tx.sign([creatorWallet])

    console.log('📤 Sending signed transaction...')
    const signature = await connection.sendTransaction(tx)
    console.log(`✅ Transaction sent: ${signature}`)

    // Wait for confirmation with retry - be more lenient
    console.log('⏳ Waiting for transaction confirmation...')
    let txInfo = null
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000))
      txInfo = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      })
      if (txInfo) {
        console.log(`✅ Transaction confirmed after ${(i + 1) * 3} seconds`)
        break
      }
      console.log(`⏳ Attempt ${i + 1}/10: Transaction not yet confirmed...`)
    }

    if (!txInfo) {
      console.warn('⚠️ Could not confirm transaction, but it may still have succeeded')
      // If we can't find the transaction, assume it succeeded and get balance change
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Just proceed without parsing the transaction - we'll calculate from balance
      return {
        success: false,
        error: 'Transaction sent but confirmation timed out - check Solscan manually'
      }
    }

    // Parse transaction to extract lamports collected
    const preBalances = txInfo.meta?.preBalances || []
    const postBalances = txInfo.meta?.postBalances || []

    // Find the creator wallet's balance change
    const creatorPubkey = creatorWallet.publicKey.toString()
    const accountKeys = txInfo.transaction.message.staticAccountKeys || []
    const creatorIndex = accountKeys.findIndex(key => key.toString() === creatorPubkey)

    let lamportsCollected = 0
    if (creatorIndex >= 0) {
      lamportsCollected = (postBalances[creatorIndex] || 0) - (preBalances[creatorIndex] || 0)
    } else {
      // Fallback: assume first account is creator
      lamportsCollected = (postBalances[0] || 0) - (preBalances[0] || 0)
    }

    if (lamportsCollected <= 0) {
      console.warn('⚠️ No positive balance change detected in transaction')
      return { success: false, error: 'No lamports collected from transaction' }
    }

    console.log(`💰 Collected ${lamportsCollected} lamports (${lamportsCollected / LAMPORTS_PER_SOL} SOL)`)

    return {
      success: true,
      txSig: signature,
      lamports: lamportsCollected,
    }
  } catch (error) {
    console.error('❌ Error claiming creator fees:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Split collected fees 50/50 between Deployer and Dev wallets
 * Sends from CREATOR wallet (where fees were claimed) to destination wallets
 */
async function splitFees(totalLamports: number): Promise<{
  success: boolean
  deployerTxSig?: string
  devTxSig?: string
  deployerLamports?: number
  devLamports?: number
  error?: string
}> {
  try {
    const creatorWallet = getCreatorWallet()
    console.log(`💳 Creator wallet (source): ${creatorWallet.publicKey.toString()}`)

    if (!DEPLOYER_WALLET_ADDRESS || !DEV_WALLET_ADDRESS) {
      throw new Error('DEPLOYER_WALLET_ADDRESS or DEV_WALLET_ADDRESS not configured')
    }

    const deployerPubkey = new PublicKey(DEPLOYER_WALLET_ADDRESS)
    const devPubkey = new PublicKey(DEV_WALLET_ADDRESS)

    // Check creator wallet has enough balance to send the claimed amount
    const balance = await connection.getBalance(creatorWallet.publicKey)
    const RENT_EXEMPT_MINIMUM = 890880 // ~0.00089 SOL minimum to keep account rent-exempt
    const TX_FEE_BUFFER = 15000 // ~0.000015 SOL per transaction (we do 2 txs) - increased buffer

    console.log(`💰 Creator wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`)
    console.log(`💰 Claimed amount to split: ${totalLamports / LAMPORTS_PER_SOL} SOL`)

    // Calculate how much we can actually send while keeping rent-exempt reserve
    // After both transfers, we need to have at least RENT_EXEMPT_MINIMUM + (TX_FEE_BUFFER * 2) left
    const totalReserved = RENT_EXEMPT_MINIMUM + (TX_FEE_BUFFER * 2)
    const maxCanSend = balance - totalReserved

    console.log(`💰 Can send max: ${maxCanSend / LAMPORTS_PER_SOL} SOL (keeping ${totalReserved / LAMPORTS_PER_SOL} SOL reserved)`)

    if (maxCanSend < totalLamports) {
      return {
        success: false,
        error: `Insufficient balance: have ${balance / LAMPORTS_PER_SOL} SOL, can send ${maxCanSend / LAMPORTS_PER_SOL} SOL, need ${totalLamports / LAMPORTS_PER_SOL} SOL`,
      }
    }

    // Calculate 50/50 split of CLAIMED amount only (not wallet balance!)
    const halfLamports = Math.floor(totalLamports / 2)
    const deployerLamports = halfLamports
    const devLamports = totalLamports - halfLamports // Remainder goes to dev

    console.log(`💸 Split: Deployer ${deployerLamports / LAMPORTS_PER_SOL} SOL, Dev ${devLamports / LAMPORTS_PER_SOL} SOL`)

    // Send to Deployer Wallet (50%)
    console.log(`📤 Sending ${deployerLamports / LAMPORTS_PER_SOL} SOL to Deployer Wallet...`)
    const deployerTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: creatorWallet.publicKey,
        toPubkey: deployerPubkey,
        lamports: deployerLamports,
      })
    )

    const { blockhash } = await connection.getLatestBlockhash()
    deployerTx.recentBlockhash = blockhash
    deployerTx.feePayer = creatorWallet.publicKey
    deployerTx.sign(creatorWallet)

    const deployerTxSig = await connection.sendRawTransaction(deployerTx.serialize())
    console.log(`✅ Deployer transfer sent: ${deployerTxSig}`)

    // Wait a moment before second transaction
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Send to Dev Wallet (50%)
    console.log(`📤 Sending ${devLamports / LAMPORTS_PER_SOL} SOL to Dev Wallet...`)
    const devTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: creatorWallet.publicKey,
        toPubkey: devPubkey,
        lamports: devLamports,
      })
    )

    const { blockhash: blockhash2 } = await connection.getLatestBlockhash()
    devTx.recentBlockhash = blockhash2
    devTx.feePayer = creatorWallet.publicKey
    devTx.sign(creatorWallet)

    const devTxSig = await connection.sendRawTransaction(devTx.serialize())
    console.log(`✅ Dev transfer sent: ${devTxSig}`)

    // Wait for confirmations
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      success: true,
      deployerTxSig,
      devTxSig,
      deployerLamports,
      devLamports,
    }
  } catch (error) {
    console.error('❌ Error splitting fees:', error)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  console.log('claim-creator-fee function called:', req.method)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if creator fees are enabled in system settings
    const { data: setting } = await supabaseClient
      .from('system_settings')
      .select('value')
      .eq('key', 'creator_fees_enabled')
      .single()

    if (setting?.value !== 'true') {
      console.log('⚠️ Creator fees are disabled in system settings')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Creator fee claims are currently disabled in system settings'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { mint, poolId } = await req.json()

    if (!mint) {
      return new Response(
        JSON.stringify({ error: 'Mint address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate environment variables
    if (!PUMPPORTAL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'CREATOR_WALLET_PUMPPORTAL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🎯 Starting creator fee claim for mint: ${mint}`)

    // Step 1: Claim creator fees from PumpPortal
    const claimResult = await claimCreatorFees(mint)

    if (!claimResult.success) {
      return new Response(
        JSON.stringify({ error: claimResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { txSig: claimTxSig, lamports: totalLamports } = claimResult

    // Check for duplicate claim (idempotency)
    const { data: existingClaim } = await supabaseClient
      .from('creator_fee_claims')
      .select('*')
      .eq('tx_sig_claim', claimTxSig)
      .single()

    if (existingClaim) {
      console.log('⚠️ Claim already processed (idempotent check)')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Claim already processed',
          claim: existingClaim,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Wait a moment for balances to update on-chain
    console.log('⏳ Waiting for balance to update...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 2: Split fees 50/50
    const splitResult = await splitFees(totalLamports!)

    if (!splitResult.success) {
      // Log failed claim to database
      await supabaseClient.from('creator_fee_claims').insert({
        pool_id: poolId || null,
        tx_sig_claim: claimTxSig,
        total_lamports: totalLamports,
        deployer_lamports: 0,
        dev_lamports: 0,
        tx_sig_deployer: '',
        tx_sig_dev: '',
        status: 'failed',
        error_message: splitResult.error,
      })

      return new Response(
        JSON.stringify({ error: splitResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Save to database
    const { data: claim, error: dbError } = await supabaseClient
      .from('creator_fee_claims')
      .insert({
        pool_id: poolId || null,
        tx_sig_claim: claimTxSig,
        total_lamports: totalLamports,
        deployer_lamports: splitResult.deployerLamports,
        dev_lamports: splitResult.devLamports,
        tx_sig_deployer: splitResult.deployerTxSig,
        tx_sig_dev: splitResult.devTxSig,
        status: 'completed',
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save claim to database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 4: Update current open rain_pool with new prize
    const deployerSOL = splitResult.deployerLamports! / LAMPORTS_PER_SOL

    // If poolId was provided, use it; otherwise find current open pool
    let targetPoolId = poolId

    if (!targetPoolId) {
      const { data: currentPool } = await supabaseClient
        .from('rain_pools')
        .select('id')
        .eq('status', 'open')
        .single()

      targetPoolId = currentPool?.id
    }

    if (targetPoolId) {
      // First, get current pool prize to add to it
      const { data: currentPoolData } = await supabaseClient
        .from('rain_pools')
        .select('total_prize_sol, creator_rewards_giveaway_sol')
        .eq('id', targetPoolId)
        .single()

      const currentPrize = currentPoolData?.total_prize_sol || 0
      const currentGiveaway = currentPoolData?.creator_rewards_giveaway_sol || 0

      // ADD the new deployer amount to existing prize (accumulate)
      const newTotalPrize = currentPrize + deployerSOL
      const newGiveaway = currentGiveaway + deployerSOL

      await supabaseClient
        .from('rain_pools')
        .update({
          total_prize_sol: newTotalPrize,
          creator_rewards_giveaway_sol: newGiveaway,
          creator_rewards_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetPoolId)

      console.log(`✅ Updated pool ${targetPoolId}: added ${deployerSOL} SOL, new total: ${newTotalPrize} SOL`)

      // Also update the pool_id in the claim record
      if (!poolId) {
        await supabaseClient
          .from('creator_fee_claims')
          .update({ pool_id: targetPoolId })
          .eq('id', claim.id)
      }
    } else {
      console.log('⚠️ No open pool found to update')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Creator fees claimed and split successfully',
        claim: {
          claimTxSig,
          totalSOL: totalLamports! / LAMPORTS_PER_SOL,
          deployerSOL: splitResult.deployerLamports! / LAMPORTS_PER_SOL,
          devSOL: splitResult.devLamports! / LAMPORTS_PER_SOL,
          deployerTxSig: splitResult.deployerTxSig,
          devTxSig: splitResult.devTxSig,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Claim creator fee error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
