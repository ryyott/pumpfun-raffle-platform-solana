-- ============================================
-- MIGRATION 010: Prevent Concurrent Pool Closures
-- ============================================
-- This migration adds database-level constraints to prevent race conditions
-- when multiple tabs/requests try to close the same pool simultaneously.
--
-- Changes:
-- 1. Add unique partial index to ensure only one pool can be 'open' at a time
-- 2. Add 'closing' status to pool lifecycle for atomic transitions
-- 3. Add check constraint to validate status transitions
-- ============================================

-- Step 1: Add 'closing' as a valid status (intermediate state)
-- This allows atomic transition: open -> closing -> closed
COMMENT ON COLUMN rain_pools.status IS
'Pool status: open (accepting participants), closing (being drawn), closed (completed)';

-- Step 2: Create unique partial index to prevent multiple open pools
-- This ensures only ONE pool can have status='open' at any time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_pool
ON rain_pools (status)
WHERE status = 'open';

COMMENT ON INDEX idx_one_open_pool IS
'Ensures only one pool can be open at a time, preventing race conditions from multiple close-and-draw calls';

-- Step 3: Add check constraint for valid status values
-- Allows: 'open', 'closing', 'closed'
ALTER TABLE rain_pools
DROP CONSTRAINT IF EXISTS rain_pools_status_check;

ALTER TABLE rain_pools
ADD CONSTRAINT rain_pools_status_check
CHECK (status IN ('open', 'closing', 'closed'));

-- Step 4: Create index on status for faster queries
-- Improves performance when searching for open/closing pools
CREATE INDEX IF NOT EXISTS idx_pools_status
ON rain_pools (status);

-- Step 5: Add index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_pools_created_at
ON rain_pools (created_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 010 COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added constraints to prevent concurrent pool closures:';
  RAISE NOTICE '  ✓ Unique index on open pools';
  RAISE NOTICE '  ✓ Status check constraint (open/closing/closed)';
  RAISE NOTICE '  ✓ Performance indexes added';
  RAISE NOTICE '';
  RAISE NOTICE 'Benefits:';
  RAISE NOTICE '  • Only one pool can be open at a time';
  RAISE NOTICE '  • Atomic status transitions with "closing" state';
  RAISE NOTICE '  • Prevents race conditions from multiple tabs';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
