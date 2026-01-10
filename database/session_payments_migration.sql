-- ============================================
-- Session Payments Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add session_id, payment_type, and metadata to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'course';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create session_payments table to track paid sessions per user
CREATE TABLE IF NOT EXISTS session_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    payment_id UUID REFERENCES payments(id),
    paid_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id, session_number)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_payments_user ON session_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_course ON session_payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);

-- ============================================
-- END OF MIGRATION
-- ============================================
