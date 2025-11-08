-- ============================================
-- Check how many open pools exist
-- ============================================

SELECT
  id,
  status,
  created_at,
  end_time,
  total_prize_sol
FROM rain_pools
WHERE status = 'open'
ORDER BY created_at DESC;

-- Count by status
SELECT
  status,
  COUNT(*) as count
FROM rain_pools
GROUP BY status
ORDER BY status;
