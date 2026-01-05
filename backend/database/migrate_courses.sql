-- =============================================
-- UPDATE EXISTING TABLES
-- Run this if you already have tables created
-- =============================================

-- 1. Update courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS specialist_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS enrolled_users UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop old column if exists
ALTER TABLE courses DROP COLUMN IF EXISTS instructor;
ALTER TABLE courses DROP COLUMN IF EXISTS sessions_count;

-- 2. Update sessions table  
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id),
ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT 1;

-- 3. Create enrollments table if not exists
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_sessions INTEGER DEFAULT 0,
    UNIQUE(user_id, course_id)
);

-- 4. Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Anyone can read courses" ON courses;
CREATE POLICY "Anyone can read courses" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner/Specialist can manage courses" ON courses;
CREATE POLICY "Owner/Specialist can manage courses" ON courses FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can see own enrollments" ON enrollments;
CREATE POLICY "Users can see own enrollments" ON enrollments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can enroll" ON enrollments;
CREATE POLICY "Anyone can enroll" ON enrollments FOR INSERT WITH CHECK (true);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_specialist ON courses(specialist_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- 7. Insert sample course for testing
INSERT INTO courses (title, description, total_sessions, price) 
VALUES ('دورة التعامل مع القلق', 'دورة شاملة لفهم القلق والتعامل معه', 4, 99.00)
ON CONFLICT DO NOTHING;
