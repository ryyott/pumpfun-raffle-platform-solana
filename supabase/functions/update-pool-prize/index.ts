import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAINDR0P_TOKEN_MINT = Deno.env.get('RAINDR0P_TOKEN_MINT')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('🔄 Updating pool prize with latest creator fees...')

    // Step 1: Claim creator fees
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

    let newPrizeSol = 0
    let claimData = null

    if (claimResponse.ok) {
      claimData = await claimResponse.json()
      if (claimData.success && claimData.claim) {
        // Use deployer amount (50% that goes to pool funding)
        newPrizeSol = claimData.claim.deployerSOL || 0
        console.log(`✅ Claimed ${newPrizeSol} SOL for pool prize`)
      } else {
        console.log('⚠️ No fees to claim')
      }
    } else {
      const errorText = await claimResponse.text()
      console.log('⚠️ Claim failed:', errorText)
    }

    // Step 2: Get current open pool
    const { data: currentPool, error: poolError } = await supabaseClient
      .from('rain_pools')
      .select('*')
      .eq('status', 'open')
      .single()

    if (poolError || !currentPool) {
      console.log('No open pool found')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No open pool to update',
          claimed: newPrizeSol > 0,
          claimedAmount: newPrizeSol
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Update pool with new prize if fees were claimed
    if (newPrizeSol > 0) {
      const { error: updateError } = await supabaseClient
        .from('rain_pools')
        .update({
          total_prize_sol: newPrizeSol,
          creator_rewards_giveaway_sol: newPrizeSol,
          creator_rewards_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPool.id)

      if (updateError) {
        console.error('Failed to update pool:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update pool prize' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`✅ Updated pool ${currentPool.id} with prize: ${newPrizeSol} SOL`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: newPrizeSol > 0 ? 'Pool prize updated successfully' : 'No fees available to claim',
        poolId: currentPool.id,
        previousPrize: currentPool.total_prize_sol,
        newPrize: newPrizeSol > 0 ? newPrizeSol : currentPool.total_prize_sol,
        claimData: claimData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Update pool prize error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
