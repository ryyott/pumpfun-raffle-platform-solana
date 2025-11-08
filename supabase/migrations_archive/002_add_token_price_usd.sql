-- Add token_price_usd column to rain_pools table
ALTER TABLE rain_pools ADD COLUMN IF NOT EXISTS token_price_usd DECIMAL(20, 10);

-- Add comment
COMMENT ON COLUMN rain_pools.token_price_usd IS 'Current USD price per token from Moralis API';
