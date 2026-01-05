-- ============================================
-- Migration: Add Reply Feature to Messages
-- Run this in Supabase SQL Editor
-- ============================================

-- Add reply_to_id column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Create index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);
