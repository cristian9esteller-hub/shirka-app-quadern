
-- Afegir columna smtp_settings a la taula de perfils
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS smtp_settings JSONB DEFAULT '{
  "enabled": false,
  "host": "",
  "port": 587,
  "user": "",
  "password": "",
  "fromName": "",
  "fromEmail": ""
}'::JSONB;

-- Comentari per a la documentació
COMMENT ON COLUMN public.profiles.smtp_settings IS 'Configuració SMTP personalitzada per a l''enviament de correus des del compte del mestre.';
