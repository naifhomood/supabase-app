-- Create theme settings table
CREATE TABLE theme_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    header_bg VARCHAR(255) NOT NULL DEFAULT '#ffffff',
    header_text VARCHAR(255) NOT NULL DEFAULT '#000000',
    footer_bg VARCHAR(255) NOT NULL DEFAULT '#ffffff',
    footer_text VARCHAR(255) NOT NULL DEFAULT '#000000',
    board_bg VARCHAR(255) NOT NULL DEFAULT '#f0f2f5',
    default_column_bg VARCHAR(255) NOT NULL DEFAULT '#e2e8f0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default theme
INSERT INTO theme_settings (
    header_bg, header_text, 
    footer_bg, footer_text, 
    board_bg, default_column_bg
) VALUES (
    '#ffffff', '#000000',
    '#ffffff', '#000000',
    '#f0f2f5', '#e2e8f0'
);

-- Create RLS policies
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users"
ON theme_settings FOR SELECT
TO authenticated
USING (true);
