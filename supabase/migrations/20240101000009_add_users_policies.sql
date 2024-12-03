-- Drop existing table and triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.users;

-- Create users table
CREATE TABLE public.users (
    id uuid NOT NULL,
    email text,
    is_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all data" ON public.users;

CREATE POLICY "Users can view their own data"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Users can update their own data"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all data"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    ));

-- Function to automatically create user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, is_admin)
    VALUES (
        new.id::uuid,
        new.email,
        CASE 
            WHEN new.email = 'naifhomood@gmail.com' THEN true
            ELSE false
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        is_admin = CASE 
            WHEN new.email = 'naifhomood@gmail.com' THEN true
            ELSE users.is_admin
        END;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial admin user if exists
INSERT INTO public.users (id, email, is_admin)
SELECT id, email, true
FROM auth.users
WHERE email = 'naifhomood@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_admin = true;
