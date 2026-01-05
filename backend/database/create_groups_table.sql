-- Create course_groups table
CREATE TABLE IF NOT EXISTS course_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    specialist_id UUID REFERENCES users(id), -- The assigned Specialist
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 4, -- Strict limit of 4 users
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, name)
);

-- Add group_id to enrollments
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES course_groups(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_course_groups_course ON course_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS
ALTER TABLE course_groups ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read course groups" ON course_groups
    FOR SELECT USING (true);

CREATE POLICY "Owner/Specialist can manage course groups" ON course_groups
    FOR ALL USING (true);
