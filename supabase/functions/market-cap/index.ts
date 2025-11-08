import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RPC_URL      = Deno.env.get("RPC_URL")!;
const MORALIS_KEY  = Deno.env.get("MORALIS_KEY")!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { 
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${SERVICE_ROLE}` } }
});

async function fetchMoralisUsdPrice(mint: string): Promise<number> {
  const url = `https://solana-gateway.moralis.io/token/mainnet/${mint}/price`;
  const r = await fetch(url, { headers: { "X-API-Key": MORALIS_KEY }});
  const j = await r.json();
  return j.usdPrice as number;
}

async function getTokenSupply(mint: string): Promise<number> {
  const payload = { jsonrpc: "2.0", id: 1, method: "getTokenSupply", params: [mint] };
  const r = await fetch(RPC_URL, { 
    method: "POST", 
    headers: { "content-type": "application/json" }, 
    body: JSON.stringify(payload) 
  });
  const j = await r.json();
  const res = j?.result?.value;
  return Number(res.amount) / 10 ** res.decimals;
}

async function updateOpenPool(marketCapUsd: number, tokenPriceUsd: number) {
  const { data: pool } = await sb.from("rain_pools")
    .select("id")
    .eq("status", "open")
    .order("ends_at", { ascending: false })
    .limit(1)
    .single();

  if (!pool) throw new Error("No open pool found");

  await sb.from("rain_pools")
    .update({
      market_cap: marketCapUsd,
      token_price_usd: tokenPriceUsd,
      market_cap_updated_at: new Date().toISOString()
    })
    .eq("id", pool.id);

  return pool.id;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    console.log('Environment check:', {
      SUPABASE_URL: !!SUPABASE_URL,
      SERVICE_ROLE: !!SERVICE_ROLE,
      RPC_URL: !!RPC_URL,
      MORALIS_KEY: !!MORALIS_KEY
    });
    
    const url = new URL(req.url);
    const mint = url.searchParams.get("mint")!;
    const write = (url.searchParams.get("write") ?? "true") !== "false";

    const [usdPrice, supply] = await Promise.all([
      fetchMoralisUsdPrice(mint),
      getTokenSupply(mint),
    ]);

    const marketCapUsd = usdPrice * supply;
    let updatedPoolId: string | null = null;

    if (write) updatedPoolId = await updateOpenPool(marketCapUsd, usdPrice);

    return new Response(JSON.stringify({ 
      mint, 
      supply, 
      usdPrice, 
      marketCapUsd, 
      updatedPoolId 
    }), {
      headers: { 
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 502,
      headers: { 
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});