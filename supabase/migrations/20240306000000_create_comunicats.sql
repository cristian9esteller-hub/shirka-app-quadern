
-- Create comunicats table
CREATE TABLE IF NOT EXISTS public.comunicats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_ids UUID[] DEFAULT NULL,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.comunicats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see communiqués they sent
CREATE POLICY "Users can view their own sent communiqués"
    ON public.comunicats FOR SELECT
    USING (auth.uid() = sender_id);

-- Policy: Users can only insert their own communiqués
CREATE POLICY "Users can insert their own sent communiqués"
    ON public.comunicats FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Allow real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicats;
