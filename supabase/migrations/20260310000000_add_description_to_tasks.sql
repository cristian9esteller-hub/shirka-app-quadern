-- Add description column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
