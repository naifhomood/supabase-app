-- تأكد من وجود الجدول
CREATE TABLE IF NOT EXISTS allowed_emails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- حذف البريد الإلكتروني إذا كان موجوداً (لتجنب الأخطاء)
DELETE FROM allowed_emails WHERE email = 'naifhomood@gmail.com';

-- إضافة بريد المشرف
INSERT INTO allowed_emails (email) VALUES ('naifhomood@gmail.com');

-- التأكد من تفعيل RLS
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- إعادة إنشاء سياسة الأمان
DROP POLICY IF EXISTS "Allow admins to manage allowed_emails" ON allowed_emails;
CREATE POLICY "Allow admins to manage allowed_emails"
    ON allowed_emails
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT auth.uid() 
        FROM auth.users 
        WHERE email = 'naifhomood@gmail.com'
    ));
