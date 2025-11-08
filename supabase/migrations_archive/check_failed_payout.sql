-- Check the pool that failed
SELECT * FROM rain_pools WHERE id = '2a90f71a-7d50-4cca-88ff-4e66e314011d';

-- Check all winners for this pool
SELECT 
  id,
  wallet_address,
  reward_sol,
  payout_tx_sig,
  created_at
FROM rain_pool_winners
WHERE pool_id = '2a90f71a-7d50-4cca-88ff-4e66e314011d'
ORDER BY created_at;

-- Count unique wallets
SELECT 
  wallet_address,
  COUNT(*) as win_count,
  SUM(reward_sol) as total_reward,
  MAX(payout_tx_sig) as tx_sig
FROM rain_pool_winners
WHERE pool_id = '2a90f71a-7d50-4cca-88ff-4e66e314011d'
GROUP BY wallet_address;
