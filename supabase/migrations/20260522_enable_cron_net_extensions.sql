-- Enable pg_cron for scheduling jobs
create extension if not exists pg_cron with schema cron;

-- Enable pg_net for async HTTP requests (creates its own schema)
create extension if not exists pg_net;