import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate Twitter/X URL format
function isValidTweetUrl(url: string): { valid: boolean; tweetId?: string } {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Accept both twitter.com and x.com
    if (!['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'].includes(hostname)) {
      return { valid: false }
    }

    // Extract tweet ID from URL pattern: /username/status/1234567890
    const pathMatch = urlObj.pathname.match(/\/status\/(\d+)/)
    if (!pathMatch || !pathMatch[1]) {
      return { valid: false }
    }

    const tweetId = pathMatch[1]

    // Tweet IDs should be numeric and reasonable length (Twitter snowflake IDs are ~19 digits)
    if (tweetId.length < 10 || tweetId.length > 25) {
      return { valid: false }
    }

    return { valid: true, tweetId }
  } catch {
    return { valid: false }
  }
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

    const { walletAddress, poolId, tweetUrl } = await req.json()

    console.log('Twitter bonus claim request:', { walletAddress, poolId, tweetUrl })

    // Validate inputs
    if (!walletAddress || !poolId || !tweetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: walletAddress, poolId, tweetUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate tweet URL format
    const urlValidation = isValidTweetUrl(tweetUrl)
    if (!urlValidation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid tweet URL. Please provide a valid Twitter/X tweet link.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Tweet URL validated:', { tweetId: urlValidation.tweetId })

    // Check if pool exists and is open
    const { data: pool, error: poolError } = await supabaseClient
      .from('rain_pools')
      .select('*')
      .eq('id', poolId)
      .eq('status', 'open')
      .single()

    if (poolError || !pool) {
      console.error('Pool lookup error:', poolError)
      return new Response(
        JSON.stringify({ error: 'Pool not found or not open' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get participant record
    const { data: participant, error: participantError } = await supabaseClient
      .from('rain_pool_participants')
      .select('*')
      .eq('pool_id', poolId)
      .eq('wallet_address', walletAddress)
      .single()

    if (participantError || !participant) {
      console.error('Participant lookup error:', participantError)
      return new Response(
        JSON.stringify({ error: 'User has not joined this pool yet' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already claimed Twitter bonus for this pool
    if (participant.twitter_bonus_claimed) {
      return new Response(
        JSON.stringify({
          error: 'Twitter bonus already claimed for this pool',
          alreadyClaimed: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the claim is happening within reasonable time (within 30 minutes of joining)
    const joinedAt = new Date(participant.joined_at).getTime()
    const now = Date.now()
    const timeSinceJoin = now - joinedAt
    const MAX_CLAIM_TIME = 30 * 60 * 1000 // 30 minutes

    if (timeSinceJoin > MAX_CLAIM_TIME) {
      return new Response(
        JSON.stringify({
          error: 'Twitter bonus must be claimed within 30 minutes of joining the pool',
          tooLate: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Time validation passed:', {
      joinedAt: new Date(joinedAt).toISOString(),
      timeSinceJoin: `${Math.floor(timeSinceJoin / 1000 / 60)} minutes`
    })

    // Check if this tweet URL has already been used by another user (prevent sharing same tweet)
    const { data: existingTweet } = await supabaseClient
      .from('rain_pool_participants')
      .select('wallet_address')
      .eq('twitter_bonus_tweet_url', tweetUrl)
      .neq('wallet_address', walletAddress)
      .single()

    if (existingTweet) {
      return new Response(
        JSON.stringify({
          error: 'This tweet URL has already been used by another user',
          duplicate: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Award the bonus ticket!
    const { data: updatedParticipant, error: updateError } = await supabaseClient
      .from('rain_pool_participants')
      .update({
        twitter_bonus_claimed: true,
        twitter_bonus_timestamp: new Date().toISOString(),
        twitter_bonus_tweet_url: tweetUrl,
        twitter_bonus_tickets: 1
      })
      .eq('id', participant.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to award Twitter bonus' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Twitter bonus awarded successfully:', {
      wallet: walletAddress,
      poolId,
      oldTickets: participant.total_tickets,
      newTickets: updatedParticipant.total_tickets
    })

    // Calculate new win chance
    // Get total tickets in the pool
    const { data: allParticipants } = await supabaseClient
      .from('rain_pool_participants')
      .select('total_tickets')
      .eq('pool_id', poolId)

    const totalPoolTickets = (allParticipants || []).reduce((sum, p) => sum + (p.total_tickets || 0), 0)
    const userTickets = updatedParticipant.total_tickets
    const winChance = totalPoolTickets > 0 ? ((userTickets / totalPoolTickets) * 100).toFixed(2) : '0.00'

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Twitter bonus claimed successfully! +1 ticket added 🎉',
        participant: updatedParticipant,
        tickets: {
          free: updatedParticipant.free_tickets,
          burn: updatedParticipant.burn_boost_tickets,
          twitter: updatedParticipant.twitter_bonus_tickets,
          total: updatedParticipant.total_tickets
        },
        winChance: parseFloat(winChance),
        tweetId: urlValidation.tweetId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Claim Twitter bonus error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
