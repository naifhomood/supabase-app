-- Add is_admin column to allowed_emails table
ALTER TABLE allowed_emails
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Update the existing admin email to have is_admin = true
UPDATE allowed_emails
SET is_admin = true
WHERE email = 'naifhomood@gmail.com';

-- Recreate the theme_settings RLS policies with the corrected column reference
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON theme_settings;
DROP POLICY IF EXISTS "Allow update access to admin users only" ON theme_settings;

CREATE POLICY "Allow read access to all authenticated users"
ON theme_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow update access to admin users only"
ON theme_settings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM allowed_emails
        WHERE email = auth.jwt()->>'email'
        AND is_admin = true
    )
);
