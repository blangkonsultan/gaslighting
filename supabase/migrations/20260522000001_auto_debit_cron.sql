-- ==============================================================================
-- AUTO-DEBIT CRON JOB & EXTENSIONS
-- ==============================================================================

-- Enable pg_cron for scheduling jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

-- Enable pg_net for async HTTP requests (creates its own schema)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule auto-debit processing daily at 00:00 UTC (08:00 WIB)
SELECT cron.schedule(
  'auto-debit-daily',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/auto-debit',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    ) AS request_id;
  $$
);
