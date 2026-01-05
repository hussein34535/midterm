-- =============================================
-- Platform Settings Table
-- Run this in Supabase SQL Editor
-- =============================================

-- Settings Table (Key-Value store for platform configuration)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('platform_name', '"إيواء"'),
    ('platform_description', '"منصة الدعم والإرشاد النفسي"'),
    ('welcome_message', '"مرحباً بك في إيواء! نحن هنا لدعمك."'),
    ('support_email', '"support@eiwa.com"'),
    ('maintenance_mode', 'false'),
    ('allow_registration', 'true'),
    ('payment_methods', '["bank_transfer", "vodafone_cash"]')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only owner can update settings
CREATE POLICY "Owner can manage settings" ON settings
    FOR ALL
    USING (true)
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'owner'
        )
    );

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can read settings" ON settings
    FOR SELECT
    USING (true);
