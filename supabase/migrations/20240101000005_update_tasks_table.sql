-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Update tasks table structure
ALTER TABLE public.tasks
DROP COLUMN IF EXISTS id CASCADE;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4() PRIMARY KEY;

-- Add necessary columns for Kanban functionality
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS column_id uuid REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
ALTER COLUMN user_id SET NOT NULL;

-- Create updated policies
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
USING (
    user_id = auth.uid() OR
    column_id IN (
        SELECT id FROM public.kanban_columns
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND
    column_id IN (
        SELECT id FROM public.kanban_columns
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
USING (
    user_id = auth.uid() AND
    column_id IN (
        SELECT id FROM public.kanban_columns
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
USING (
    user_id = auth.uid() AND
    column_id IN (
        SELECT id FROM public.kanban_columns
        WHERE user_id = auth.uid()
    )
);
