-- Create notes_lliures table
CREATE TABLE IF NOT EXISTS public.notes_lliures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titol TEXT NOT NULL DEFAULT '',
    contingut TEXT NOT NULL DEFAULT '',
    categoria TEXT,
    data_vincle_calendari TIMESTAMP WITH TIME ZONE,
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notes_lliures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes" 
    ON public.notes_lliures FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" 
    ON public.notes_lliures FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
    ON public.notes_lliures FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
    ON public.notes_lliures FOR DELETE 
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notes_lliures_updated_at
BEFORE UPDATE ON public.notes_lliures
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
