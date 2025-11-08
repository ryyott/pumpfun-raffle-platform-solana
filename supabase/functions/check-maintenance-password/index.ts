import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
}

const MAX_ATTEMPTS = 3
const LOCKOUT_MINUTES = 15

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { password } = await req.json()

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract IP address from request
    // Try different headers as different proxies use different ones
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               req.headers.get('x-real-ip') ||
               req.headers.get('cf-connecting-ip') || // Cloudflare
               'unknown'

    if (ip === 'unknown') {
      console.warn('Could not determine IP address')
      return new Response(
        JSON.stringify({ error: 'Unable to verify request origin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Password attempt from IP: ${ip}`)

    // Check for existing attempts record
    const { data: attemptRecord, error: lookupError } = await supabaseClient
      .from('maintenance_attempts')
      .select('*')
      .eq('ip_address', ip)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Error looking up attempts:', lookupError)
      throw lookupError
    }

    // Check if IP is currently locked
    if (attemptRecord?.locked_until) {
      const lockedUntil = new Date(attemptRecord.locked_until)
      const now = new Date()

      if (lockedUntil > now) {
        const minutesRemaining = Math.ceil((lockedUntil.getTime() - now.getTime()) / (1000 * 60))
        console.log(`IP ${ip} is locked for ${minutesRemaining} more minutes`)

        return new Response(
          JSON.stringify({
            valid: false,
            locked: true,
            retryAfter: minutesRemaining,
            message: `Too many attempts. Try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Lock expired, reset the record
        await supabaseClient
          .from('maintenance_attempts')
          .update({
            attempt_count: 0,
            locked_until: null
          })
          .eq('ip_address', ip)
      }
    }

    // Get the correct password from environment
    const correctPassword = Deno.env.get('MAINTENANCE_PASSWORD')

    if (!correctPassword) {
      console.error('MAINTENANCE_PASSWORD environment variable not set!')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if password is correct
    if (password === correctPassword) {
      console.log(`✅ Correct password from IP: ${ip}`)

      // Delete the attempts record on success
      if (attemptRecord) {
        await supabaseClient
          .from('maintenance_attempts')
          .delete()
          .eq('ip_address', ip)
      }

      // Generate a simple session token (just a random string for sessionStorage)
      const sessionToken = crypto.randomUUID()

      return new Response(
        JSON.stringify({
          valid: true,
          token: sessionToken,
          message: 'Access granted'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Password is incorrect - increment attempts
    console.log(`❌ Incorrect password from IP: ${ip}`)

    const newAttemptCount = (attemptRecord?.attempt_count || 0) + 1
    const shouldLock = newAttemptCount >= MAX_ATTEMPTS
    const lockedUntil = shouldLock
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      : null

    if (attemptRecord) {
      // Update existing record
      await supabaseClient
        .from('maintenance_attempts')
        .update({
          attempt_count: newAttemptCount,
          locked_until: lockedUntil
        })
        .eq('ip_address', ip)
    } else {
      // Create new record
      await supabaseClient
        .from('maintenance_attempts')
        .insert({
          ip_address: ip,
          attempt_count: newAttemptCount,
          locked_until: lockedUntil
        })
    }

    if (shouldLock) {
      console.log(`🔒 IP ${ip} locked for ${LOCKOUT_MINUTES} minutes`)
      return new Response(
        JSON.stringify({
          valid: false,
          locked: true,
          retryAfter: LOCKOUT_MINUTES,
          message: `Too many incorrect attempts. Try again in ${LOCKOUT_MINUTES} minutes.`
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const attemptsLeft = MAX_ATTEMPTS - newAttemptCount

    return new Response(
      JSON.stringify({
        valid: false,
        locked: false,
        attemptsLeft,
        message: `Incorrect password. ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining.`
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in check-maintenance-password:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        valid: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
