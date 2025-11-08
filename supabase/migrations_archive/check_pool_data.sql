-- Check the recent pool that had issues
SELECT 
  rp.id as pool_id,
  rp.status,
  rp.total_prize_sol,
  COUNT(rpw.id) as total_winners,
  COUNT(rpw.payout_tx_sig) FILTER (WHERE rpw.payout_tx_sig IS NOT NULL) as paid_winners,
  COUNT(rpw.payout_tx_sig) FILTER (WHERE rpw.payout_tx_sig IS NULL) as unpaid_winners
FROM rain_pools rp
LEFT JOIN rain_pool_winners rpw ON rpw.pool_id = rp.id
WHERE rp.id = '0e4d29f0-e42f-4d62-b63a-5fc443e7f064'
GROUP BY rp.id, rp.status, rp.total_prize_sol;

-- Check individual winners
SELECT 
  wallet_address,
  reward_sol,
  payout_tx_sig,
  created_at
FROM rain_pool_winners
WHERE pool_id = '0e4d29f0-e42f-4d62-b63a-5fc443e7f064'
ORDER BY created_at;
