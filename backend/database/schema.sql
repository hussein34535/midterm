-- =============================================
-- Sakina Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'specialist', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    specialist_id UUID REFERENCES users(id),  -- الأخصائي المسؤول
    price DECIMAL(10,2) DEFAULT 0,
    duration TEXT,
    image_url TEXT,
    total_sessions INTEGER DEFAULT 4,  -- عدد الجلسات الكلي
    enrolled_users UUID[] DEFAULT '{}',  -- المشتركين
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions Table (Voice Calls - linked to courses)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_name TEXT NOT NULL,
    title TEXT DEFAULT 'جلسة دعم نفسي',
    type TEXT DEFAULT 'group' CHECK (type IN ('individual', 'group')),
    course_id UUID REFERENCES courses(id),  -- ربط بالكورس
    session_number INTEGER DEFAULT 1,  -- رقم الجلسة في الكورس
    host_id UUID REFERENCES users(id),
    participants UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Course Enrollments (tracking)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_sessions INTEGER DEFAULT 0,
    UNIQUE(user_id, course_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (true);

-- Policies for sessions table
CREATE POLICY "Anyone can read sessions" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sessions" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Host can update session" ON sessions
    FOR UPDATE USING (true);

-- Policies for courses
CREATE POLICY "Anyone can read courses" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Owner/Specialist can manage courses" ON courses
    FOR ALL USING (true);

-- Policies for enrollments
CREATE POLICY "Users can see own enrollments" ON enrollments
    FOR SELECT USING (true);

CREATE POLICY "Anyone can enroll" ON enrollments
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_host ON sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_specialist ON courses(specialist_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
