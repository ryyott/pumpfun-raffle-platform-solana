import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL
} from 'https://esm.sh/@solana/web3.js@1.87.6'
import bs58 from 'https://esm.sh/bs58@5.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RPC_URL = Deno.env.get('RPC_URL') || 'https://api.mainnet-beta.solana.com'
const connection = new Connection(RPC_URL, 'confirmed')

function getPayoutWallet() {
  const privateKey = Deno.env.get('PAYOUT_WALLET_PRIVATE_KEY')
  if (!privateKey) throw new Error('PAYOUT_WALLET_PRIVATE_KEY not set')

  const secretKey = bs58.decode(privateKey)
  return Keypair.fromSecretKey(secretKey)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { poolId } = await req.json()

    if (!poolId) {
      return new Response(
        JSON.stringify({ error: 'Pool ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: winners, error: winnersError } = await supabaseClient
      .from('rain_pool_winners')
      .select('*')
      .eq('pool_id', poolId)
      .is('payout_tx_sig', null)

    if (winnersError) {
      console.error('Winners fetch error:', winnersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch winners' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!winners || winners.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No unpaid winners found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payoutWallet = getPayoutWallet()
    console.log(`Payout wallet: ${payoutWallet.publicKey.toString()}`)

    const balance = await connection.getBalance(payoutWallet.publicKey)
    const balanceSOL = balance / LAMPORTS_PER_SOL
    const totalPayoutSOL = winners.reduce((sum, w) => sum + w.reward_sol, 0)

    // Calculate required balance: total payout + buffer for transaction fees
    // Each transaction needs ~0.000005 SOL, so buffer = winners.length * 0.00001 (conservative)
    const feeBuffer = winners.length * 0.00001
    const requiredBalance = totalPayoutSOL + feeBuffer

    console.log(`Payout wallet balance: ${balanceSOL} SOL, Total payout needed: ${totalPayoutSOL} SOL, Fee buffer: ${feeBuffer} SOL (${winners.length} txs)`)

    if (balanceSOL < requiredBalance) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient balance in payout wallet',
          balance: balanceSOL,
          required: requiredBalance,
          totalPayout: totalPayoutSOL,
          feeBuffer: feeBuffer,
          transactionCount: winners.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send individual transaction for each winner record
    const payoutResults = []

    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i]

      try {
        const toPublicKey = new PublicKey(winner.wallet_address)
        let lamports = Math.floor(winner.reward_sol * LAMPORTS_PER_SOL)

        // Check recipient balance to ensure rent-exemption
        const recipientBalance = await connection.getBalance(toPublicKey)
        const RENT_EXEMPT_MINIMUM = 890880 // ~0.00089 SOL minimum for rent exemption

        // If recipient would be below rent-exempt minimum after payout, add extra
        if (recipientBalance + lamports < RENT_EXEMPT_MINIMUM) {
          const rentDeficit = RENT_EXEMPT_MINIMUM - recipientBalance
          const originalLamports = lamports
          lamports = rentDeficit + 100000 // Add a bit extra (0.0001 SOL buffer)
          console.log(`⚠️ Recipient needs rent: adding ${(lamports - originalLamports) / LAMPORTS_PER_SOL} SOL (total: ${lamports / LAMPORTS_PER_SOL} SOL)`)
        }

        console.log(`Sending ${(lamports / LAMPORTS_PER_SOL).toFixed(6)} SOL (${lamports} lamports) to ${winner.wallet_address} (Winner ${i + 1}/${winners.length}, ID: ${winner.id})`)

        // Add delay between transactions to avoid RPC rate limits (except for first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: payoutWallet.publicKey,
            toPubkey: toPublicKey,
            lamports
          })
        )

        // Get recent blockhash with retry logic
        let blockhash
        let retries = 3
        while (retries > 0) {
          try {
            const result = await connection.getLatestBlockhash()
            blockhash = result.blockhash
            break
          } catch (e) {
            retries--
            if (retries === 0) throw e
            console.log(`Blockhash fetch failed, retrying... (${retries} attempts left)`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        transaction.recentBlockhash = blockhash
        transaction.feePayer = payoutWallet.publicKey

        // Sign and send transaction
        transaction.sign(payoutWallet)
        const txSig = await connection.sendRawTransaction(transaction.serialize())

        console.log(`Transaction sent: ${txSig}`)

        // Wait for confirmation
        await new Promise(resolve => setTimeout(resolve, 1000))

        console.log(`Transaction confirmed: ${txSig}`)

        // Update THIS winner record with its transaction signature
        const { error: updateError } = await supabaseClient
          .from('rain_pool_winners')
          .update({ payout_tx_sig: txSig })
          .eq('id', winner.id)

        if (updateError) {
          console.error(`Failed to update winner ${winner.id}:`, updateError)
          payoutResults.push({
            winnerId: winner.id,
            walletAddress: winner.wallet_address,
            amount: winner.reward_sol,
            success: false,
            error: updateError.message
          })
        } else {
          payoutResults.push({
            winnerId: winner.id,
            walletAddress: winner.wallet_address,
            amount: winner.reward_sol,
            success: true,
            txSig
          })
        }
      } catch (error) {
        console.error(`❌ Payout failed for winner ${winner.id}:`, error)

        // Get current balance to debug
        const currentBalance = await connection.getBalance(payoutWallet.publicKey)
        const currentBalanceSOL = currentBalance / LAMPORTS_PER_SOL

        console.error(`Error details:`, {
          name: error.name,
          message: error.message,
          stack: error.stack,
          walletAddress: winner.wallet_address,
          amount: winner.reward_sol,
          lamports: Math.floor(winner.reward_sol * LAMPORTS_PER_SOL),
          currentWalletBalance: currentBalanceSOL,
          errorLogs: error.logs || null
        })
        payoutResults.push({
          winnerId: winner.id,
          walletAddress: winner.wallet_address,
          amount: winner.reward_sol,
          success: false,
          error: `${error.name}: ${error.message}`,
          currentBalance: currentBalanceSOL
        })
      }
    }

    const successfulPayouts = payoutResults.filter(p => p.success)
    const failedPayouts = payoutResults.filter(p => !p.success)

    if (failedPayouts.length === 0) {
      await supabaseClient
        .from('rain_pools')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', poolId)
    }

    // Return success only if ALL payouts succeeded
    const allPayoutsSucceeded = failedPayouts.length === 0
    const statusCode = allPayoutsSucceeded ? 200 : 400

    // Log detailed error information
    if (failedPayouts.length > 0) {
      console.error(`⚠️ ${failedPayouts.length} payout(s) failed:`)
      failedPayouts.forEach(fp => {
        console.error(`  - ${fp.walletAddress}: ${fp.error}`)
      })
    }

    return new Response(
      JSON.stringify({
        success: allPayoutsSucceeded,
        error: allPayoutsSucceeded ? null : `${failedPayouts.length} payout(s) failed`,
        failedPayoutDetails: failedPayouts.map(fp => ({
          winnerId: fp.winnerId,
          wallet: fp.walletAddress,
          error: fp.error,
          amount: fp.amount
        })),
        message: `Processed ${payoutResults.length} winner payouts`,
        totalPayouts: payoutResults.length,
        successfulPayouts: successfulPayouts.length,
        failedPayouts: failedPayouts.length,
        results: payoutResults,
        poolCompleted: allPayoutsSucceeded
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payout winners error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
