-- إنشاء جدول الأعمدة
CREATE TABLE kanban_columns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#e2e8f0',
    position INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- تحديث جدول المهام
ALTER TABLE tasks ADD COLUMN column_id UUID REFERENCES kanban_columns(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- إضافة سياسات الأمان للأعمدة
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own columns"
    ON kanban_columns
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own columns"
    ON kanban_columns
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own columns"
    ON kanban_columns
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own columns"
    ON kanban_columns
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
