-- Add system setting to enable/disable automatic creator fee claims
INSERT INTO system_settings (key, value, description)
VALUES (
  'creator_fees_enabled',
  'true',
  'Enable or disable automatic creator fee claims (true/false)'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
