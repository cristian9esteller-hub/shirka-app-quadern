
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Mestre/a',
  avatar_url TEXT DEFAULT '',
  subjects TEXT[] NOT NULL DEFAULT ARRAY['Matemàtiques','Llengua Catalana','Llengua Castellana','Anglès','Medi Natural','Medi Social','Educació Física','Música','Plàstica','Tutoria']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  room TEXT DEFAULT '',
  quarterly_objectives JSONB DEFAULT '[]'::JSONB,
  annual_objectives JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own classes" ON public.classes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  personal_data JSONB DEFAULT '{"birthDate":"","age":0,"address":"","socialSecurity":""}'::JSONB,
  tutors JSONB DEFAULT '[]'::JSONB,
  alerts JSONB DEFAULT '[]'::JSONB,
  private_notes TEXT DEFAULT '',
  behavior_log JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own students" ON public.students FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Calendar events
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT DEFAULT '',
  color TEXT DEFAULT '#19e65e',
  description TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  recurring JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  tags JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  morning_status TEXT NOT NULL DEFAULT 'Present',
  afternoon_status TEXT NOT NULL DEFAULT 'Present',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attendance" ON public.attendance FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Evaluation activities
CREATE TABLE public.evaluation_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  term TEXT NOT NULL,
  name TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 20,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluation_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own eval activities" ON public.evaluation_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Evaluation grades
CREATE TABLE public.evaluation_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.evaluation_activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  grade NUMERIC(4,2) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, student_id)
);
ALTER TABLE public.evaluation_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own grades" ON public.evaluation_grades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Meetings
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT DEFAULT '',
  location TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Altres',
  discussion TEXT DEFAULT '',
  agreements TEXT DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  recurring JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own meetings" ON public.meetings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
