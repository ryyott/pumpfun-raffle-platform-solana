-- ============================================
-- MIGRATION 010: Force Close Duplicates Then Add Constraint
-- ============================================
-- This migration forcefully closes ALL open pools, then creates
-- a new one if needed, then applies the UNIQUE constraint.
-- ============================================

DO $$
DECLARE
  open_pool_count INT;
  most_recent_pool_id UUID;
  most_recent_pool_end_time TIMESTAMPTZ;
BEGIN
  -- Check how many open pools exist
  SELECT COUNT(*) INTO open_pool_count
  FROM rain_pools
  WHERE status = 'open';

  RAISE NOTICE 'Found % open pool(s)', open_pool_count;

  IF open_pool_count > 1 THEN
    RAISE NOTICE 'Closing all open pools to resolve duplicates...';

    -- Close ALL open pools
    UPDATE rain_pools
    SET status = 'closed', updated_at = NOW()
    WHERE status = 'open';

    RAISE NOTICE 'All open pools have been closed';

    -- Get the most recent closed pool to check if it should still be open
    SELECT id, end_time INTO most_recent_pool_id, most_recent_pool_end_time
    FROM rain_pools
    WHERE status = 'closed'
    ORDER BY created_at DESC
    LIMIT 1;

    -- If the most recent pool's end_time is in the future, reopen it
    IF most_recent_pool_end_time > NOW() THEN
      RAISE NOTICE 'Reopening most recent pool (ID: %) as it has not expired yet', most_recent_pool_id;

      UPDATE rain_pools
      SET status = 'open', updated_at = NOW()
      WHERE id = most_recent_pool_id;
    ELSE
      RAISE NOTICE 'Most recent pool has expired, leaving all pools closed';
    END IF;
  ELSIF open_pool_count = 1 THEN
    RAISE NOTICE 'Only one open pool found, proceeding with migration';
  ELSE
    RAISE NOTICE 'No open pools found, proceeding with migration';
  END IF;
END $$;

-- Step 1: Add 'closing' as a valid status (intermediate state)
COMMENT ON COLUMN rain_pools.status IS
'Pool status: open (accepting participants), closing (being drawn), closed (completed)';

-- Step 2: Drop existing index if it exists (in case of partial failure)
DROP INDEX IF EXISTS idx_one_open_pool;

-- Step 3: Create unique partial index to prevent multiple open pools
-- This ensures only ONE pool can have status='open' at any time
CREATE UNIQUE INDEX idx_one_open_pool
ON rain_pools (status)
WHERE status = 'open';

COMMENT ON INDEX idx_one_open_pool IS
'Ensures only one pool can be open at a time, preventing race conditions from multiple close-and-draw calls';

-- Step 4: Add check constraint for valid status values
-- Allows: 'open', 'closing', 'closed'
ALTER TABLE rain_pools
DROP CONSTRAINT IF EXISTS rain_pools_status_check;

ALTER TABLE rain_pools
ADD CONSTRAINT rain_pools_status_check
CHECK (status IN ('open', 'closing', 'closed'));

-- Step 5: Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_pools_status
ON rain_pools (status);

-- Step 6: Add index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_pools_created_at
ON rain_pools (created_at DESC);

-- Success message
DO $$
DECLARE
  final_open_count INT;
BEGIN
  SELECT COUNT(*) INTO final_open_count
  FROM rain_pools
  WHERE status = 'open';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 010 COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added constraints to prevent concurrent pool closures:';
  RAISE NOTICE '  ✓ Cleaned up duplicate open pools';
  RAISE NOTICE '  ✓ Unique index on open pools';
  RAISE NOTICE '  ✓ Status check constraint (open/closing/closed)';
  RAISE NOTICE '  ✓ Performance indexes added';
  RAISE NOTICE '';
  RAISE NOTICE 'Current state:';
  RAISE NOTICE '  • Open pools: %', final_open_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Benefits:';
  RAISE NOTICE '  • Only one pool can be open at a time';
  RAISE NOTICE '  • Atomic status transitions with "closing" state';
  RAISE NOTICE '  • Prevents race conditions from multiple tabs';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
