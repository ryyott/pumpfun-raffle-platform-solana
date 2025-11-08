import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('🎯 Cron job triggered: Claiming creator fees...')

    // Call the claim-creator-fee function
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

    const result = await claimResponse.json()

    if (claimResponse.ok && result.success) {
      console.log(`✅ Successfully claimed ${result.claim.totalSOL} SOL`)
      console.log(`   Deployer: ${result.claim.deployerSOL} SOL`)
      console.log(`   Dev: ${result.claim.devSOL} SOL`)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Creator fees claimed successfully',
          result
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.log('⚠️ Claim failed or no fees available:', result.error || result.message)

      return new Response(
        JSON.stringify({
          success: false,
          message: result.error || result.message || 'No fees to claim'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('❌ Cron job error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
