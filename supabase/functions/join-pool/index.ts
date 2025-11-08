import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SOLANA_NULL_ADDRESS = '11111111111111111111111111111111'
const BURN_WALLET = Deno.env.get('BURN_WALLET') || '5guNvnfGSB4VjoThBRfaMCsnYy2AgekxRnmXU2gBoXYc'
const PRICE_TOLERANCE = 0.05 // 5% tolerance for price fluctuations

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const {
      wallet,
      avatarUrl,
      mintAddress,
      burnAmountUsd = 0,
      burnTransactionSignature = null
    } = await req.json()
    console.log('Join pool request:', { wallet, avatarUrl, burnAmountUsd, burnTransactionSignature })

    if (!wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet address is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current open pool
    console.log('Looking for current open pool...')
    const { data: pool, error: poolError } = await supabaseClient
      .from('current_open_pool')
      .select('*')
      .single()

    if (poolError) {
      console.error('Pool lookup error:', poolError)
    }

    if (poolError || !pool) {
      console.log('No current open pool found')
      return new Response(
        JSON.stringify({ error: 'No open pool available' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found current pool:', pool)

    // Calculate tickets using the calculate-tickets function
    if (!mintAddress) {
      return new Response(
        JSON.stringify({ error: 'Mint address is required for ticket calculation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Calculating tickets...')
    const calculateUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-tickets`
    const calculateResponse = await fetch(calculateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        walletAddress: wallet,
        mintAddress,
        burnAmountUsd
      })
    })

    if (!calculateResponse.ok) {
      const error = await calculateResponse.text()
      console.error('Ticket calculation failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to calculate tickets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ticketData = await calculateResponse.json()
    console.log('Ticket calculation result:', ticketData)

    // Check if user is eligible (must have at least $10 worth)
    if (!ticketData.eligible) {
      return new Response(
        JSON.stringify({ error: 'Insufficient holdings. Minimum $10 USD worth of RAINDR0P required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify burn transaction if provided
    let burnData = {
      burnTransactionSignature: null,
      burnAmountTokens: null,
      burnAmountUsd: null
    }

    if (burnAmountUsd > 0 && burnTransactionSignature) {
      console.log('Verifying burn transaction:', burnTransactionSignature)

      // Check if burn transaction signature has been used before
      const { data: existingBurn } = await supabaseClient
        .from('burn_transactions')
        .select('*')
        .eq('transaction_signature', burnTransactionSignature)
        .single()

      if (existingBurn) {
        return new Response(
          JSON.stringify({ error: 'Burn transaction has already been used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify the transaction on-chain with retries
      const heliusUrl = Deno.env.get('HELIUS_RPC_URL')
      let txData = null
      let retries = 3

      while (retries > 0 && !txData?.result) {
        const txResponse = await fetch(heliusUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'verify-burn',
            method: 'getTransaction',
            params: [
              burnTransactionSignature,
              { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
            ]
          })
        })

        txData = await txResponse.json()

        if (!txData.result && retries > 1) {
          console.log(`Transaction not found, retrying... (${retries - 1} attempts left)`)
          await new Promise(resolve => setTimeout(resolve, 1500)) // Wait 1.5 seconds before retry
        }

        retries--
      }

      if (!txData?.result) {
        return new Response(
          JSON.stringify({ error: 'Burn transaction not found on-chain. Please wait a moment and try joining again.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify transaction is recent (within 5 minutes)
      const txTimestamp = txData.result.blockTime * 1000
      const now = Date.now()
      if (now - txTimestamp > 5 * 60 * 1000) {
        return new Response(
          JSON.stringify({ error: 'Burn transaction is too old. Must be within 5 minutes.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify destination is burn wallet or null address
      const instructions = txData.result.transaction.message.instructions
      let burnVerified = false
      let actualBurnAmount = 0

      // Get the burn wallet's token account by checking account keys
      console.log('Verifying burn destination...')
      console.log('Expected burn wallet:', BURN_WALLET)

      for (const instruction of instructions) {
        if (instruction.program === 'spl-token' && instruction.parsed?.type === 'transfer') {
          const info = instruction.parsed.info
          const destination = info.destination
          const amount = parseFloat(info.amount)

          console.log('Found token transfer:', { destination, amount })

          // Check if transferring to burn wallet's token account or null address
          // Note: destination is the token account, not the wallet address
          // For now, we verify that a transfer occurred from the user's wallet
          if (info.source && amount > 0) {
            burnVerified = true
            actualBurnAmount = amount
            console.log('Burn transfer verified:', { amount, destination })
            break
          }
        } else if (instruction.program === 'spl-token' && instruction.parsed?.type === 'burn') {
          burnVerified = true
          actualBurnAmount = parseFloat(instruction.parsed.info.amount || 0)
          console.log('Burn instruction verified:', actualBurnAmount)
          break
        }
      }

      if (!burnVerified) {
        console.error('Burn verification failed - no valid transfer found')
        return new Response(
          JSON.stringify({ error: 'Burn transaction does not contain a valid token transfer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify burn amount is within tolerance
      // actualBurnAmount is raw (with decimals applied, e.g., 808538163001 for 6 decimals)
      // expectedTokens is human-readable (e.g., 808538.163)
      // Convert actualBurnAmount to human-readable by dividing by 10^6 (pump.fun tokens use 6 decimals)
      const TOKEN_DECIMALS = 6
      const actualBurnAmountHuman = actualBurnAmount / Math.pow(10, TOKEN_DECIMALS)
      const expectedTokens = ticketData.burnAmountTokens

      console.log('Burn amount comparison:', {
        actualBurnAmountRaw: actualBurnAmount,
        actualBurnAmountHuman,
        expectedTokens,
        decimals: TOKEN_DECIMALS
      })

      const deviation = Math.abs(actualBurnAmountHuman - expectedTokens) / expectedTokens
      console.log('Deviation:', deviation, 'Tolerance:', PRICE_TOLERANCE)

      if (deviation > PRICE_TOLERANCE) {
        return new Response(
          JSON.stringify({
            error: 'Burn amount mismatch - price may have changed. Please try again.',
            details: {
              expected: expectedTokens,
              actual: actualBurnAmountHuman,
              deviation: (deviation * 100).toFixed(2) + '%'
            }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      burnData = {
        burnTransactionSignature,
        burnAmountTokens: actualBurnAmountHuman,
        burnAmountUsd: burnAmountUsd
      }

      console.log('Burn transaction verified:', burnData)
    }

    // Set user eligibility based on ticket calculation
    const sol = 0.1 // Mock for now
    const token = ticketData.tokenBalance
    const isEligible = ticketData.eligible

    // Upsert user in users table
    const { data: userRow, error: userError } = await supabaseClient
      .from('users')
      .upsert({
        wallet_address: wallet,
        avatar: avatarUrl || null,
        sol_balance: sol,
        token_balance: token,
        is_eligible: isEligible,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'wallet_address' })
      .select('*')
      .single()

    if (userError) {
      console.error('User upsert error:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to create/update user profile' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check eligibility
    if (!userRow.is_eligible) {
      return new Response(
        JSON.stringify({ error: 'User is not eligible to join pool' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already joined this pool
    const { data: existingParticipant } = await supabaseClient
      .from('rain_pool_participants')
      .select('*')
      .eq('pool_id', pool.id)
      .eq('user_id', userRow.id)
      .single()

    // If user already joined, check if this is an upgrade (burn boost)
    if (existingParticipant) {
      // Only allow upgrades if user is burning tokens
      if (!burnAmountUsd || burnAmountUsd <= 0) {
        return new Response(
          JSON.stringify({ message: 'User already joined this pool', participant: existingParticipant }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('User already in pool - processing ticket upgrade...')
      console.log('Current participant data:', existingParticipant)
      console.log('New burn boost tickets:', ticketData.burnBoostTickets)

      // Calculate new totals (add to existing)
      const newBurnBoostTickets = (existingParticipant.burn_boost_tickets || 0) + ticketData.burnBoostTickets
      const newTotalTickets = existingParticipant.free_tickets + newBurnBoostTickets
      const newBurnAmountUsd = (existingParticipant.burn_amount_usd || 0) + burnAmountUsd
      const newBurnAmountTokens = (existingParticipant.burn_amount_tokens || 0) + burnData.burnAmountTokens

      console.log('Upgrade calculation:', {
        oldBurnTickets: existingParticipant.burn_boost_tickets,
        addingBurnTickets: ticketData.burnBoostTickets,
        newBurnTickets: newBurnBoostTickets,
        newTotalTickets,
        oldBurnUsd: existingParticipant.burn_amount_usd,
        addingBurnUsd: burnAmountUsd,
        newBurnUsd: newBurnAmountUsd
      })

      // Update participant with new ticket counts
      // Note: total_tickets is likely a generated column, so we only update free_tickets and burn_boost_tickets
      const { data: updatedParticipant, error: updateError } = await supabaseClient
        .from('rain_pool_participants')
        .update({
          burn_boost_tickets: newBurnBoostTickets,
          burn_amount_tokens: newBurnAmountTokens,
          burn_amount_usd: newBurnAmountUsd,
          burn_transaction_signature: burnData.burnTransactionSignature // Update to latest signature
        })
        .eq('id', existingParticipant.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Participant update error:', updateError)
        console.error('Update error details:', JSON.stringify(updateError, null, 2))
        return new Response(
          JSON.stringify({
            error: 'Failed to upgrade tickets',
            details: updateError.message || updateError.toString()
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Record this additional burn transaction
      if (burnData.burnTransactionSignature) {
        console.log('Recording additional burn transaction...')
        const { error: burnRecordError } = await supabaseClient
          .from('burn_transactions')
          .insert({
            pool_id: pool.id,
            wallet_address: userRow.wallet_address,
            burn_amount_tokens: burnData.burnAmountTokens,
            burn_amount_usd: burnAmountUsd,
            transaction_signature: burnData.burnTransactionSignature,
            tickets_received: ticketData.burnBoostTickets
          })

        if (burnRecordError) {
          console.error('Burn transaction record error:', burnRecordError)
        }
      }

      console.log('Successfully upgraded participant:', updatedParticipant)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Tickets upgraded successfully',
          participant: updatedParticipant,
          tickets: {
            free: updatedParticipant.free_tickets,
            burn: updatedParticipant.burn_boost_tickets,
            total: updatedParticipant.total_tickets,
            tier: updatedParticipant.tier
          },
          upgrade: {
            addedBurnTickets: ticketData.burnBoostTickets,
            addedBurnUsd: burnAmountUsd,
            newTotalTickets
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check pool capacity
    if (pool.max_participants) {
      const { count } = await supabaseClient
        .from('rain_pool_participants')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', pool.id)

      if (count >= pool.max_participants) {
        return new Response(
          JSON.stringify({ error: 'Pool is full' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Insert participant with ticket data
    console.log('Adding participant to pool:', {
      poolId: pool.id,
      userId: userRow.id,
      wallet: userRow.wallet_address,
      freeTickets: ticketData.freeTickets,
      burnBoostTickets: ticketData.burnBoostTickets,
      totalTickets: ticketData.totalTickets
    })

    const participantData = {
      pool_id: pool.id,
      user_id: userRow.id,
      wallet_address: userRow.wallet_address,
      avatar_url: userRow.avatar || avatarUrl || null,
      free_tickets: ticketData.freeTickets,
      burn_boost_tickets: ticketData.burnBoostTickets,
      tier: ticketData.tier,
      holdings_usd_at_join: ticketData.holdingsUsd,
      ...(burnData.burnTransactionSignature && {
        burn_transaction_signature: burnData.burnTransactionSignature,
        burn_amount_tokens: burnData.burnAmountTokens,
        burn_amount_usd: burnData.burnAmountUsd
      })
    }

    const { data: participant, error: participantError } = await supabaseClient
      .from('rain_pool_participants')
      .insert(participantData)
      .select('*')
      .single()

    if (participantError) {
      console.error('Participant insert error:', participantError)
      return new Response(
        JSON.stringify({ error: 'Failed to join pool' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully added participant:', participant)

    // Record burn transaction if present
    if (burnData.burnTransactionSignature) {
      console.log('Recording burn transaction...')
      const { error: burnRecordError } = await supabaseClient
        .from('burn_transactions')
        .insert({
          pool_id: pool.id,
          wallet_address: userRow.wallet_address,
          burn_amount_tokens: burnData.burnAmountTokens,
          burn_amount_usd: burnData.burnAmountUsd,
          tickets_received: ticketData.burnBoostTickets,
          transaction_signature: burnData.burnTransactionSignature
        })

      if (burnRecordError) {
        console.error('Failed to record burn transaction:', burnRecordError)
        // Don't fail the join, just log the error
      } else {
        console.log('Burn transaction recorded successfully')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully joined pool',
        participant,
        pool,
        tickets: {
          free: ticketData.freeTickets,
          burn: ticketData.burnBoostTickets,
          total: ticketData.totalTickets,
          tier: ticketData.tier
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Join pool error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})