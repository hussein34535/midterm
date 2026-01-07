-- ============================================
-- Sakina Platform - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. USERS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'specialist', 'owner')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL DEFAULT 0,
    total_sessions INTEGER DEFAULT 1,
    group_capacity INTEGER DEFAULT 4,
    specialist_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    session_number INTEGER DEFAULT 1,
    scheduled_at TIMESTAMP,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
    agora_channel TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. ENROLLMENTS TABLE (User enrolled in Course)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    completed_sessions INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 5. MESSAGES TABLE (Chat between Users)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Nullable for group chats
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- For group chats
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'schedule', 'alert')), -- Message type
    metadata JSONB, -- For extra data like session_id
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. PAYMENTS TABLE (Track all payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    payment_method TEXT,
    payment_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add is_active column to courses if not exists
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Add payment_id to enrollments if not exists
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

-- ============================================
-- MIGRATION: Add new columns to messages if not exists
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'schedule', 'alert'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL; -- Make receiver nullable for group chats

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_courses_specialist ON courses(specialist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_course ON messages(course_id); -- New Index
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);


-- ============================================
-- END OF SCHEMA
-- No sample data - Production Ready
-- ============================================
