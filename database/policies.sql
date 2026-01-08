-- ============================================
-- Sakina Platform - Security Policies (RLS)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable RLS on All Tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- A. USERS POLICIES
-- ============================================

-- Allow Public Read for Profiles (Nickname/Avatar)
-- Vital for search and displaying sender info
CREATE POLICY "Public profiles are viewable by everyone" 
ON users FOR SELECT 
USING (true);

-- Allow Users to Update their OWN profile only
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- ============================================
-- B. MESSAGES POLICIES
-- ============================================

-- 1. View Messages
-- - Users see their own messages (sent or received)
-- - Owners see ALL messages involving them OR System OR Legacy
CREATE POLICY "Users can view their own messages" 
ON messages FOR SELECT 
USING (
    sender_id = auth.uid() 
    OR 
    receiver_id = auth.uid()
    OR
    -- Owner Logic: Access System/Legacy Chats
    (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
        AND
        (
            sender_id IN ('23886de5-16da-49b0-9d6d-85ac55d2ba12', 'b1cb10e6-002e-4377-850e-2c3bcbdfb648')
            OR
            receiver_id IN ('23886de5-16da-49b0-9d6d-85ac55d2ba12', 'b1cb10e6-002e-4377-850e-2c3bcbdfb648')
        )
    )
    OR
    -- Group Chat Logic (If enrolled)
    (
        group_id IS NOT NULL 
        AND 
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE user_id = auth.uid() AND group_id = messages.group_id
        )
    )
);

-- 2. Send Messages
-- - Sender MUST be the authenticated user
CREATE POLICY "Users can insert their own messages" 
ON messages FOR INSERT 
WITH CHECK (
    sender_id = auth.uid()
);

-- 3. Update Messages (Mark as Read / Hide)
-- - Recipient can mark as read
-- - Owner/Sender/Receiver can hide (soft delete)
CREATE POLICY "Participants can update messages" 
ON messages FOR UPDATE 
USING (
    sender_id = auth.uid() 
    OR 
    receiver_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
);

-- ============================================
-- C. COURSES & ENROLLMENTS
-- ============================================

-- Courses are viewable by everyone (Catalog)
CREATE POLICY "Courses are public" 
ON courses FOR SELECT 
USING (true);

-- Only Specialists/Owners can edit courses
CREATE POLICY "Specialists can edit own courses" 
ON courses FOR UPDATE 
USING (
    specialist_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
);

-- Enrollments: View Own or if Owner
CREATE POLICY "View own enrollments" 
ON enrollments FOR SELECT 
USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
    OR
    EXISTS (SELECT 1 FROM courses WHERE id = enrollments.course_id AND specialist_id = auth.uid())
);

-- ============================================
-- D. PAYMENTS (High Security)
-- ============================================

-- View Own Payments
CREATE POLICY "View own payments" 
ON payments FOR SELECT 
USING (user_id = auth.uid());

-- Insert Payment (User)
CREATE POLICY "Users can create payments" 
ON payments FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Only Owner/Admin can view ALL payments or Update status
CREATE POLICY "Admins manage payments" 
ON payments FOR ALL 
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
