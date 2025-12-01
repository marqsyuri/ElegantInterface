ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{"clientName":"","appointmentDate":"1970-01-01T00:00:00.000Z","appointmentTime":null,"procedures":[],"staffName":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamp,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

ALTER TABLE notifications
  ALTER COLUMN channel SET DEFAULT 'in_app',
  ALTER COLUMN status SET DEFAULT 'unread';

UPDATE notifications
SET metadata = '{"clientName":"","appointmentDate":"1970-01-01T00:00:00.000Z","appointmentTime":null,"procedures":[],"staffName":null}'::jsonb
WHERE metadata IS NULL;

UPDATE notifications
SET status = 'unread'
WHERE status IS NULL OR status = 'pending';

UPDATE notifications
SET updated_at = COALESCE(updated_at, created_at, now());

UPDATE notifications
SET is_read = false
WHERE is_read IS NULL;

