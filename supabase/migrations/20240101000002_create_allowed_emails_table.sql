-- Create allowed emails table
CREATE TABLE allowed_emails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS (Row Level Security) policies
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only allow admins to read and manage the allowed_emails table
CREATE POLICY "Allow admins to manage allowed_emails"
    ON allowed_emails
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT auth.uid() 
        FROM auth.users 
        WHERE email = 'naifhomood@gmail.com'
    ));

-- Insert admin email as the first allowed email
INSERT INTO allowed_emails (email) VALUES
    ('naifhomood@gmail.com');
