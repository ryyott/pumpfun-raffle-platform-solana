import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tier thresholds based on USD value
const TIER_THRESHOLDS = [
  { min: 10, max: 49, tickets: 1, tier: 1 },
  { min: 50, max: 99, tickets: 2, tier: 2 },
  { min: 100, max: 499, tickets: 3, tier: 3 },
  { min: 500, max: Infinity, tickets: 5, tier: 4 },
]

// Calculate burn boost tickets based on USD amount
function calculateBurnBoostTickets(burnAmountUsd: number): number {
  if (burnAmountUsd <= 0) return 0

  // Formula: floor((burn_usd / 2) * (1 + log10(burn_usd)))
  // This creates better rates for larger burns
  const baseTickets = burnAmountUsd / 2
  const multiplier = 1 + Math.log10(burnAmountUsd)
  const tickets = Math.floor(baseTickets * multiplier)

  return Math.max(1, tickets) // Minimum 1 ticket for any burn
}

// Determine tier based on holdings USD value
function determineTier(holdingsUsd: number): { tickets: number; tier: number } {
  for (const threshold of TIER_THRESHOLDS) {
    if (holdingsUsd >= threshold.min && holdingsUsd <= threshold.max) {
      return { tickets: threshold.tickets, tier: threshold.tier }
    }
  }
  return { tickets: 0, tier: 0 } // Below minimum threshold
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { walletAddress, mintAddress, burnAmountUsd = 0 } = await req.json()

    console.log('Calculate tickets request:', { walletAddress, mintAddress, burnAmountUsd })

    if (!walletAddress || !mintAddress) {
      return new Response(
        JSON.stringify({ error: 'walletAddress and mintAddress are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get token balance from Helius
    const heliusUrl = Deno.env.get('HELIUS_RPC_URL')
    if (!heliusUrl) {
      console.error('HELIUS_RPC_URL not configured')
      return new Response(
        JSON.stringify({ error: 'RPC configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching token balance from Helius...')
    const balanceResponse = await fetch(heliusUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'calculate-tickets',
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { mint: mintAddress },
          { encoding: 'jsonParsed' }
        ]
      })
    })

    const balanceData = await balanceResponse.json()

    let tokenBalance = 0
    if (balanceData.result && balanceData.result.value && balanceData.result.value.length > 0) {
      tokenBalance = balanceData.result.value[0].account.data.parsed.info.tokenAmount.uiAmount
    }

    console.log('Token balance:', tokenBalance)

    // Get token price from Moralis API (same as market-cap function)
    console.log('Fetching token price from Moralis...')
    let tokenPriceUsd = 0

    try {
      const moralisKey = Deno.env.get('MORALIS_KEY')
      if (!moralisKey) {
        console.error('MORALIS_KEY not configured')
        return new Response(
          JSON.stringify({ error: 'Price API not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const moralisUrl = `https://solana-gateway.moralis.io/token/mainnet/${mintAddress}/price`
      console.log('Fetching price from Moralis:', moralisUrl)

      const priceResponse = await fetch(moralisUrl, {
        headers: {
          'X-API-Key': moralisKey
        }
      })

      if (!priceResponse.ok) {
        console.error('Moralis price fetch failed:', priceResponse.status)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch token price. Please try again later.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const priceData = await priceResponse.json()
      tokenPriceUsd = priceData.usdPrice
      console.log('✅ Token price USD from Moralis:', tokenPriceUsd)

      if (!tokenPriceUsd || tokenPriceUsd <= 0) {
        console.error('❌ Invalid token price received:', tokenPriceUsd)
        return new Response(
          JSON.stringify({ error: 'Invalid token price. Please try again later.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (priceError) {
      console.error('Error fetching price from Moralis:', priceError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch token price. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate holdings in USD
    const holdingsUsd = tokenBalance * tokenPriceUsd
    console.log('Holdings USD:', holdingsUsd)

    // Determine tier and free tickets
    const { tickets: freeTickets, tier } = determineTier(holdingsUsd)

    // Calculate burn boost tickets if requested
    const burnBoostTickets = calculateBurnBoostTickets(burnAmountUsd)

    // Calculate how many tokens would need to be burned
    const burnAmountTokens = burnAmountUsd > 0 && tokenPriceUsd > 0
      ? burnAmountUsd / tokenPriceUsd
      : 0

    const totalTickets = freeTickets + burnBoostTickets

    console.log('Calculation result:', {
      freeTickets,
      burnBoostTickets,
      totalTickets,
      tier,
      holdingsUsd
    })

    return new Response(
      JSON.stringify({
        freeTickets,
        burnBoostTickets,
        totalTickets,
        holdingsUsd: parseFloat(holdingsUsd.toFixed(2)),
        tier,
        tokenBalance,
        tokenPriceUsd,
        burnAmountTokens: parseFloat(burnAmountTokens.toFixed(9)),
        eligible: freeTickets > 0 // Must have at least $10 worth to be eligible
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Calculate tickets error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
