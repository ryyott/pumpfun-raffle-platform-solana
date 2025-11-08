// Cron-triggered function to update market cap
// Called by pg_cron every 6 minutes (no auth required from cron)
// This function then calls market-cap with proper auth

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const MINT_ADDRESS = Deno.env.get('RAINDR0P_TOKEN_MINT')!

serve(async (req) => {
  try {
    console.log('🔄 Cron-triggered market cap update started')

    // Call the market-cap function (we have access to env vars here)
    const marketCapUrl = `${SUPABASE_URL}/functions/v1/market-cap?mint=${MINT_ADDRESS}&write=true`

    const response = await fetch(marketCapUrl, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`
      }
    })

    const result = await response.json()

    if (result.error) {
      console.error('❌ Market cap update failed:', result.error)
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Market cap updated:', {
      marketCap: result.marketCapUsd,
      poolId: result.updatedPoolId
    })

    return new Response(
      JSON.stringify({
        success: true,
        marketCapUsd: result.marketCapUsd,
        updatedPoolId: result.updatedPoolId,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Cron market cap update error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
