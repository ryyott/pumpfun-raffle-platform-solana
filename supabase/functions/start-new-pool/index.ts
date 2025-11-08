import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAINDR0P_TOKEN_MINT = Deno.env.get('RAINDR0P_TOKEN_MINT')!

serve(async (req) => {
  console.log('start-new-pool function called:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { durationMinutes = 30, maxParticipants } = await req.json() // 30 minutes for production

    // Step 1: Claim creator fees first to fund the pool
    console.log('🎯 Claiming creator fees to fund pool...')
    const claimResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/claim-creator-fee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        mint: RAINDR0P_TOKEN_MINT
      })
    })

    let poolPrizeSol = 0.0000 // Fallback to 0 if no fees available

    if (claimResponse.ok) {
      const claimData = await claimResponse.json()
      if (claimData.success && claimData.claim) {
        // Use deployer amount (50% that goes to pool funding)
        poolPrizeSol = claimData.claim.deployerSOL || 0.0000
        console.log(`✅ Creator fees claimed! Pool prize: ${poolPrizeSol} SOL`)
      } else {
        console.log('⚠️ No fees to claim, using fallback amount:', poolPrizeSol)
      }
    } else {
      console.log('⚠️ Claim failed, using fallback amount:', poolPrizeSol)
    }

    console.log('Received params:', { durationMinutes, poolPrize: poolPrizeSol, maxParticipants })

    // Check for existing open pools and close any expired ones
    console.log('Checking for existing pools...')
    const { data: existingPools, error: checkError } = await supabaseClient
      .from('rain_pools')
      .select('*')
      .eq('status', 'open')

    if (checkError) {
      console.log('No existing pools found (expected):', checkError.message)
    }

    if (existingPools && existingPools.length > 0) {
      const currentTime = Date.now()

      // Check if any pools are still active (not expired)
      for (const pool of existingPools) {
        const poolEndTime = new Date(pool.ends_at).getTime()

        if (poolEndTime > currentTime) {
          // Pool is still active, return it
          console.log('Found active pool, returning it:', pool.id)
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Pool already exists',
              pool: pool
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Pool has expired but still marked as 'open'
          // DO NOT close it here - let close-and-draw handle it properly with winner selection
          console.log('⚠️ Found expired pool still marked as open:', pool.id)
          console.log('   Skipping - close-and-draw should handle this with winner selection')
          // Continue to create new pool since this one is expired
        }
      }
    }

    // Calculate pool end time
    const now = new Date()
    const endsAt = new Date(now.getTime() + (durationMinutes * 60 * 1000))
    console.log('Creating pool ending at:', endsAt.toISOString())

    // Create new pool with dynamic prize from creator fees
    console.log('Inserting into rain_pools...')
    const poolData = {
      status: 'open',
      total_prize_sol: poolPrizeSol,
      max_participants: maxParticipants || null,
      mint: RAINDR0P_TOKEN_MINT,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }

    // Only set creator_rewards_updated_at if we actually claimed fees (prize > 0)
    if (poolPrizeSol > 0) {
      poolData.creator_rewards_updated_at = now.toISOString()
    }

    const { data: newPool, error: poolError } = await supabaseClient
      .from('rain_pools')
      .insert(poolData)
      .select('*')
      .single()

    if (poolError) {
      console.error('Pool creation error:', poolError)
      return new Response(
        JSON.stringify({ error: 'Failed to create new pool' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clear any existing current_open_pool records first
    const { error: deleteError } = await supabaseClient
      .from('current_open_pool')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (deleteError) {
      console.error('Error clearing current_open_pool:', deleteError)
    }

    // Add reference to current_open_pool table with all required fields
    const { error: currentPoolError } = await supabaseClient
      .from('current_open_pool')
      .insert({
        id: newPool.id,
        total_prize_sol: newPool.total_prize_sol,
        status: newPool.status,
        max_participants: newPool.max_participants,
        starts_at: newPool.starts_at,
        ends_at: newPool.ends_at,
        created_at: newPool.created_at,
        updated_at: newPool.updated_at
      })

    if (currentPoolError) {
      console.error('Current pool creation error:', currentPoolError)
    } else {
      console.log('Successfully added pool to current_open_pool')
    }

    // Fetch initial market cap for the new pool and WAIT for it
    let marketCapData = null
    try {
      console.log('Fetching initial market cap and token price...')
      const marketCapResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/market-cap?mint=${RAINDR0P_TOKEN_MINT}&write=true`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        }
      })

      if (marketCapResponse.ok) {
        marketCapData = await marketCapResponse.json()
        console.log('✅ Market cap and token price updated:', marketCapData)
      } else {
        console.log('⚠️ Market cap fetch failed:', marketCapResponse.status)
      }
    } catch (marketCapError) {
      console.error('⚠️ Market cap fetch error:', marketCapError)
      // Don't fail pool creation if market cap fetch fails
    }

    // Fetch updated pool data with token_price_usd
    const { data: updatedPool } = await supabaseClient
      .from('rain_pools')
      .select('*')
      .eq('id', newPool.id)
      .single()

    // Schedule automatic pool closure (this would ideally be done with a cron job or scheduled function)
    // For now, we'll rely on the frontend timer to call close-and-draw

    return new Response(
      JSON.stringify({
        success: true,
        message: 'New pool started successfully',
        pool: updatedPool || newPool, // Use updated pool with token_price_usd if available
        durationMs: durationMinutes * 60 * 1000,
        endsAt: endsAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Start new pool error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})