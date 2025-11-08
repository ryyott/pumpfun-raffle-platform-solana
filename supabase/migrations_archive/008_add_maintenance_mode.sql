-- Migration: Add Maintenance Mode System
-- Created: 2025-10-22
-- Purpose: Add maintenance mode with rate-limited password protection

-- 1. Create maintenance_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS maintenance_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on ip_address for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_attempts_ip
ON maintenance_attempts(ip_address);

-- Create index on locked_until for cleanup queries
CREATE INDEX IF NOT EXISTS idx_maintenance_attempts_locked
ON maintenance_attempts(locked_until)
WHERE locked_until IS NOT NULL;

-- 2. Add maintenance mode settings to system_settings table
-- (system_settings table should already exist from previous migrations)

-- Insert default maintenance mode settings if they don't exist
INSERT INTO system_settings (key, value, description)
VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('maintenance_message', 'Site is temporarily down for maintenance. We''ll be back soon!', 'Message to display on maintenance screen')
ON CONFLICT (key) DO NOTHING;

-- 3. Create cleanup function to remove old maintenance attempts
CREATE OR REPLACE FUNCTION cleanup_old_maintenance_attempts()
RETURNS void AS $$
BEGIN
  -- Delete attempts older than 24 hours
  DELETE FROM maintenance_attempts
  WHERE created_at < NOW() - INTERVAL '24 hours';

  -- Reset unlocked attempts that are no longer locked
  UPDATE maintenance_attempts
  SET attempt_count = 0,
      locked_until = NULL,
      updated_at = NOW()
  WHERE locked_until IS NOT NULL
    AND locked_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_attempts_updated_at
  BEFORE UPDATE ON maintenance_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_attempts_updated_at();

-- 5. Add comments for documentation
COMMENT ON TABLE maintenance_attempts IS 'Tracks password attempts and lockouts for maintenance mode';
COMMENT ON COLUMN maintenance_attempts.ip_address IS 'IP address of the client attempting to access maintenance mode';
COMMENT ON COLUMN maintenance_attempts.attempt_count IS 'Number of failed password attempts';
COMMENT ON COLUMN maintenance_attempts.locked_until IS 'Timestamp when the IP will be unlocked (NULL if not locked)';
COMMENT ON FUNCTION cleanup_old_maintenance_attempts() IS 'Removes old maintenance attempts and resets unlocked IPs';

-- 6. Grant necessary permissions (adjust role name as needed)
-- Note: Typically, the anon role should not have direct access to maintenance_attempts
-- Access should be through the edge function only
