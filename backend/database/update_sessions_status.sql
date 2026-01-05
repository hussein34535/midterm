-- Add 'scheduled' to allowed session statuses
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check CHECK (status IN ('waiting', 'active', 'ended', 'scheduled'));
