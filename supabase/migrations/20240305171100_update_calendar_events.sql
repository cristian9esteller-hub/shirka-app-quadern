-- Actualització de la taula calendar_events per suportar rangs i nous tipus
ALTER TABLE public.calendar_events RENAME COLUMN date TO data_inici;
ALTER TABLE public.calendar_events ADD COLUMN data_fi DATE;
ALTER TABLE public.calendar_events ADD COLUMN tipus TEXT;
ALTER TABLE public.calendar_events ADD COLUMN subtipus TEXT;

-- Omplir dades per defecte per a registres existents
UPDATE public.calendar_events SET tipus = 'general' WHERE tipus IS NULL;
UPDATE public.calendar_events SET data_fi = data_inici WHERE data_fi IS NULL;
