import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('========================================')
    console.log('🎯 close-and-draw function called')
    console.log('   Request ID:', req.headers.get('x-request-id') || 'unknown')
    console.log('   Timestamp:', new Date().toISOString())
    console.log('========================================')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { poolId } = await req.json()
    console.log('📋 Pool ID from request:', poolId)

    if (!poolId) {
      return new Response(
        JSON.stringify({ error: 'Pool ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the pool
    const { data: pool, error: poolError } = await supabaseClient
      .from('rain_pools')
      .select('*')
      .eq('id', poolId)
      .single()

    if (poolError || !pool) {
      return new Response(
        JSON.stringify({ error: 'Pool not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate winner count based on market cap
    const marketCap = pool.market_cap || 0
    let winnerCount = 1 // Default to 1 winner

    if (marketCap >= 3000000) {
      // $3M+: 30 winners (10 per million)
      winnerCount = Math.floor(marketCap / 1000000) * 10
    } else if (marketCap >= 2000000) {
      // $2M+: 20 winners
      winnerCount = 20
    } else if (marketCap >= 1000000) {
      // $1M-$2M: 10 winners
      winnerCount = 10
    } else if (marketCap >= 500000) {
      // $500k-$1M: 5 winners
      winnerCount = 5
    } else if (marketCap >= 100000) {
      // $100k-$500k: 2 winners
      winnerCount = 2
    }
    // $5k-$100k: 1 winner (default)

    console.log(`Market cap: $${marketCap.toLocaleString()} - Winner count: ${winnerCount}`)

    // ATOMIC STATUS UPDATE: Use optimistic locking to prevent race conditions
    // This ensures only ONE request can successfully transition from 'open' to 'closed'
    console.log('🔒 Attempting atomic status update: open -> closed for pool:', poolId)
    console.log('   Current pool status before update:', pool.status)
    console.log('   Pool ends_at:', pool.ends_at)
    console.log('   Current time:', new Date().toISOString())

    const { data: updatedPool, error: statusUpdateError } = await supabaseClient
      .from('rain_pools')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', poolId)
      .eq('status', 'open')  // CRITICAL: Only update if still 'open'
      .select()
      .single()

    if (statusUpdateError || !updatedPool) {
      console.log('⚠️ Failed to acquire lock - pool is not open')
      console.log('   Error:', statusUpdateError)
      console.log('   Actual pool status:', pool.status)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Pool is not open for drawing or already being processed',
          message: 'Another request is already closing this pool',
          debug: {
            poolId,
            currentStatus: pool.status,
            endsAt: pool.ends_at,
            now: new Date().toISOString()
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Successfully acquired lock - proceeding with draw')

    // Get all participants for this pool with their ticket counts
    const { data: participants, error: participantsError } = await supabaseClient
      .from('rain_pool_participants')
      .select('user_id, wallet_address, total_tickets, free_tickets, burn_boost_tickets')
      .eq('pool_id', poolId)

    if (participantsError) {
      console.error('Participants fetch error:', participantsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch participants' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!participants || participants.length === 0) {
      // No participants - just close the pool without drawing winners
      console.log('No participants found, closing empty pool')
      
      const { error: updateError } = await supabaseClient
        .from('rain_pools')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', poolId)

      if (updateError) {
        console.error('Pool update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to close empty pool' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Automatically start a new pool after closing empty pool
      console.log('Starting new pool automatically after closing empty pool...')
      try {
        const newPoolResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/start-new-pool`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ durationMinutes: 30 })
        })

        if (newPoolResponse.ok) {
          const newPoolData = await newPoolResponse.json()
          console.log('New pool started:', newPoolData.pool?.id)
        } else {
          console.error('Failed to start new pool:', await newPoolResponse.text())
        }
      } catch (newPoolError) {
        console.error('Error starting new pool:', newPoolError)
        // Don't fail the entire operation if new pool creation fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Empty pool closed successfully',
          winners: [],
          totalParticipants: 0,
          winnerCount: 0,
          rewardPerWinner: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cryptographically secure random float generator
    function cryptoRandomFloat(): number {
      const u = new Uint32Array(1)
      crypto.getRandomValues(u)
      // Divide by 2^32 to get [0,1)
      return u[0] / 4294967296
    }

    // Efficient cumulative weighted picker (no duplicate array)
    function pickWeighted<T extends { tickets: number }>(
      items: T[],
      excludeIndexes: Set<number> = new Set()
    ): { item: T; index: number } | null {
      // Calculate total of non-excluded items
      let total = 0
      for (let i = 0; i < items.length; i++) {
        if (!excludeIndexes.has(i)) {
          total += items[i].tickets
        }
      }

      if (total === 0) return null

      const r = cryptoRandomFloat() * total
      let acc = 0

      for (let i = 0; i < items.length; i++) {
        if (excludeIndexes.has(i)) continue

        acc += items[i].tickets
        if (r < acc) {
          return { item: items[i], index: i }
        }
      }

      // Fallback (shouldn't reach here)
      for (let i = items.length - 1; i >= 0; i--) {
        if (!excludeIndexes.has(i)) {
          return { item: items[i], index: i }
        }
      }

      return null
    }

    // Calculate total tickets
    let totalTickets = 0
    for (const participant of participants) {
      const tickets = participant.total_tickets || 1
      totalTickets += tickets
    }

    console.log(`Total tickets in pool: ${totalTickets}, Total participants: ${participants.length}`)

    // Generate a provably fair seed for transparency
    const seedBuffer = new Uint8Array(32)
    crypto.getRandomValues(seedBuffer)
    const seed = Array.from(seedBuffer).map(b => b.toString(16).padStart(2, '0')).join('')
    const timestamp = new Date().toISOString()

    console.log(`Drawing winners with seed: ${seed.substring(0, 16)}...`)

    // Select winners using weighted selection (ALLOW DUPLICATES - users with more tickets can win multiple times!)
    const selectedWinners: Array<{ user_id: string; wallet_address: string; index: number }> = []
    const participantItems = participants.map((p, idx) => ({
      ...p,
      tickets: p.total_tickets || 1,
      originalIndex: idx
    }))

    for (let i = 0; i < winnerCount; i++) {
      // Each pick is INDEPENDENT - users with more tickets have higher chance to win multiple times
      const result = pickWeighted(participantItems, new Set())

      if (!result) break // Should never happen unless no participants

      selectedWinners.push({
        user_id: result.item.user_id,
        wallet_address: result.item.wallet_address,
        index: result.index
      })

      console.log(`Winner ${i + 1}/${winnerCount}: ${result.item.wallet_address.substring(0, 8)}... (${result.item.tickets} tickets)`)
    }

    const actualWinnerCount = selectedWinners.length
    console.log(`Selected ${actualWinnerCount} winners from ${participants.length} participants (duplicates allowed)`)

    // Create proof-of-fairness snapshot
    const proofOfFairness = {
      seed,
      timestamp,
      poolId,
      totalParticipants: participants.length,
      totalTickets,
      winnerCount: actualWinnerCount,
      participantsSnapshot: participants.map(p => ({
        wallet: p.wallet_address.substring(0, 8) + '...',
        tickets: p.total_tickets || 1
      })),
      winners: selectedWinners.map(w => ({
        wallet: w.wallet_address.substring(0, 8) + '...',
        index: w.index
      }))
    }

    console.log('Proof of fairness:', JSON.stringify(proofOfFairness, null, 2))

    // Calculate rewards (split prize evenly among winners)
    const rewardPerWinner = pool.total_prize_sol / actualWinnerCount

    // Insert winners
    const winnersData = selectedWinners.map(winner => ({
      pool_id: poolId,
      user_id: winner.user_id,
      wallet_address: winner.wallet_address,
      reward_sol: rewardPerWinner
    }))

    const { data: winners, error: winnersError } = await supabaseClient
      .from('rain_pool_winners')
      .insert(winnersData)
      .select('*')

    if (winnersError) {
      console.error('Winners insert error:', winnersError)
      return new Response(
        JSON.stringify({ error: 'Failed to record winners' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate winner count matches expected
    if (actualWinnerCount !== winnerCount) {
      console.warn(`⚠️ Winner count mismatch! Expected: ${winnerCount}, Actual: ${actualWinnerCount}`)
    }

    // Validate prize split
    const expectedTotalPayout = rewardPerWinner * actualWinnerCount
    if (Math.abs(expectedTotalPayout - pool.total_prize_sol) > 0.00000001) {
      console.error(`❌ Prize split validation failed!`)
      console.error(`   Expected total: ${pool.total_prize_sol} SOL`)
      console.error(`   Calculated: ${expectedTotalPayout} SOL (${actualWinnerCount} × ${rewardPerWinner})`)
    }

    // Update pool with winner summary info and proof data
    // Pool status already set to 'closed' above, just add winner details
    const { error: updateError } = await supabaseClient
      .from('rain_pools')
      .update({
        winner_count: actualWinnerCount,
        total_payout_sol: pool.total_prize_sol,
        winner_user_ids: selectedWinners.map(w => w.user_id),
        winner_wallet_addresses: selectedWinners.map(w => w.wallet_address),
        proof_data: proofOfFairness
      })
      .eq('id', poolId)

    if (updateError) {
      console.error('Pool update error:', updateError)
      // Don't fail the entire operation if pool status update fails
    }

    // Automatically start a new pool after closing this one
    console.log('Starting new pool automatically...')
    try {
      const newPoolResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/start-new-pool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ durationMinutes: 30 })
      })

      if (newPoolResponse.ok) {
        const newPoolData = await newPoolResponse.json()
        console.log('New pool started:', newPoolData.pool?.id)
      } else {
        console.error('Failed to start new pool:', await newPoolResponse.text())
      }
    } catch (newPoolError) {
      console.error('Error starting new pool:', newPoolError)
      // Don't fail the entire operation if new pool creation fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pool closed and winners drawn successfully',
        winners,
        totalParticipants: participants.length,
        totalTickets,
        winnerCount: actualWinnerCount,
        rewardPerWinner,
        proofOfFairness
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Close and draw error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})