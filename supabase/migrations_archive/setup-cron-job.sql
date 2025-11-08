-- Setup cron job to claim creator fees every 7 minutes
-- Run this in your Supabase SQL Editor

-- First, enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists (ignore error if doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('claim-creator-fees-every-7-min');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END
$$;

-- Schedule the job to run every 7 minutes
SELECT cron.schedule(
  'claim-creator-fees-every-7-min',  -- Job name
  '*/7 * * * *',                      -- Every 7 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://jziiwbxptavdpyfpfhio.supabase.co/functions/v1/cron-claim-creator-fees',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
