-- Create join table for multi-linking between notes and calendar events
CREATE TABLE IF NOT EXISTS notes_events_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES notes_lliures(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(note_id, event_id)
);

-- Enable RLS
ALTER TABLE notes_events_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own note-event links"
    ON notes_events_links
    FOR ALL
    USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS notes_events_links_note_id_idx ON notes_events_links (note_id);
CREATE INDEX IF NOT EXISTS notes_events_links_event_id_idx ON notes_events_links (event_id);
