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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { action, poolId, winnerCount = 3 } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required (close-current, start-new, or full-cycle)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result = {}

    // Handle different lifecycle actions
    switch (action) {
      case 'close-current':
        result = await closeCurrentPool(supabaseClient, poolId, winnerCount)
        break
        
      case 'start-new':
        result = await startNewPool(supabaseClient)
        break
        
      case 'full-cycle':
        // Close current pool and immediately start new one
        const closeResult = await closeCurrentPool(supabaseClient, poolId, winnerCount)
        if (closeResult.success) {
          const startResult = await startNewPool(supabaseClient)
          result = {
            success: startResult.success,
            message: 'Pool cycle completed',
            closedPool: closeResult,
            newPool: startResult
          }
        } else {
          result = closeResult
        }
        break
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Pool lifecycle management error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function closeCurrentPool(supabaseClient: any, poolId?: string, winnerCount = 3) {
  try {
    // Get current open pool if poolId not provided
    let pool
    if (poolId) {
      const { data, error } = await supabaseClient
        .from('rain_pools')
        .select('*')
        .eq('id', poolId)
        .single()
      if (error) throw error
      pool = data
    } else {
      const { data, error } = await supabaseClient
        .from('rain_pools')
        .select('*')
        .eq('status', 'open')
        .single()
      if (error || !data) {
        return { success: false, error: 'No open pool found' }
      }
      pool = data
    }

    // Call close-and-draw function to select winners
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const closeResponse = await fetch(`${SUPABASE_URL}/functions/v1/close-and-draw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ poolId: pool.id })
    })

    const closeResult = await closeResponse.json()

    if (!closeResult.success) {
      throw new Error(closeResult.error || 'Failed to close pool and draw winners')
    }

    // Call payout-winners function to send SOL
    const payoutResponse = await fetch(`${SUPABASE_URL}/functions/v1/payout-winners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ poolId: pool.id })
    })

    const payoutResult = await payoutResponse.json()

    if (!payoutResult.success) {
      console.error('Payout failed:', payoutResult)
      // Don't fail the entire operation if payouts fail - they can be retried
      return {
        success: true,
        message: 'Pool closed but payouts failed',
        closeResult,
        payoutResult,
        payoutError: payoutResult.error
      }
    }

    return {
      success: true,
      message: 'Pool closed, winners drawn, and payouts completed',
      closeResult,
      payoutResult
    }

  } catch (error) {
    console.error('Close pool error:', error)
    return { success: false, error: error.message }
  }
}

async function startNewPool(supabaseClient: any) {
  try {
    // Check if there's already an open pool
    const { data: existingPool } = await supabaseClient
      .from('rain_pools')
      .select('*')
      .eq('status', 'open')
      .single()

    if (existingPool) {
      return {
        success: true,
        message: 'Pool already exists',
        pool: existingPool,
        isExisting: true
      }
    }

    // Create new pool with 2-minute duration for testing
    const FIXED_PRIZE_SOL = 0.0022 // ~50 cents USD (promotional fixed amount)
    const now = new Date()
    const endsAt = new Date(now.getTime() + (2 * 60 * 1000)) // 2 minutes for testing

    const { data: newPool, error: poolError } = await supabaseClient
      .from('rain_pools')
      .insert({
        status: 'open',
        total_prize_sol: FIXED_PRIZE_SOL,
        max_participants: null,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select('*')
      .single()

    if (poolError) {
      throw new Error('Failed to create new pool')
    }

    return {
      success: true,
      message: 'New pool started',
      pool: newPool,
      durationMs: 2 * 60 * 1000,
      endsAt: endsAt.toISOString()
    }

  } catch (error) {
    console.error('Start new pool error:', error)
    return { success: false, error: error.message }
  }
}