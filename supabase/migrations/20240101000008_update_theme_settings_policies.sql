-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON theme_settings;
DROP POLICY IF EXISTS "Allow update access to admin users only" ON theme_settings;

-- Recreate policies
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

-- Add insert and delete policies for admin users
CREATE POLICY "Allow insert access to admin users only"
ON theme_settings FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM allowed_emails
        WHERE email = auth.jwt()->>'email'
        AND is_admin = true
    )
);

CREATE POLICY "Allow delete access to admin users only"
ON theme_settings FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM allowed_emails
        WHERE email = auth.jwt()->>'email'
        AND is_admin = true
    )
);
