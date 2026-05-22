-- Schedule auto-debit processing daily at 00:00 UTC (08:00 WIB)
select cron.schedule(
  'auto-debit-daily',
  '0 0 * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/auto-debit',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    ) as request_id;
  $$
);