-- Add role column to existing users table
-- Run this in Supabase SQL Editor

-- 1. Add the role column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('owner', 'admin', 'specialist', 'user'));

-- 2. Set yourself as owner (replace YOUR_EMAIL with your actual email)
UPDATE users 
SET role = 'owner' 
WHERE email = 'YOUR_EMAIL_HERE';

-- 3. Verify it worked
SELECT id, nickname, email, role FROM users;
