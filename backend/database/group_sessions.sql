-- Create group_sessions table for per-group scheduling
CREATE TABLE IF NOT EXISTS group_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- The syllabus template
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- Denormalized for easier queries
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    channel_name TEXT, -- Unique channel for this group session
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, session_id) -- One active schedule per session per group
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_group_sessions_group ON group_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_course ON group_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_status ON group_sessions(status);
