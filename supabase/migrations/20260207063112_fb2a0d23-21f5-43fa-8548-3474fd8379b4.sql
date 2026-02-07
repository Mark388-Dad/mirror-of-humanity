
-- 1. Custom Categories table
CREATE TABLE public.custom_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Start IDs at 31 to not conflict with default categories
ALTER SEQUENCE custom_categories_id_seq RESTART WITH 31;

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active custom categories"
ON public.custom_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff can manage custom categories"
ON public.custom_categories FOR ALL
USING (is_staff(auth.uid()));

-- 2. Challenge Submissions table
CREATE TABLE public.challenge_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Unknown',
  reflection TEXT NOT NULL DEFAULT '',
  category_number INTEGER NOT NULL DEFAULT 15,
  category_name TEXT NOT NULL DEFAULT 'Free Choice',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_earned INTEGER NOT NULL DEFAULT 3
);

ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own challenge submissions"
ON public.challenge_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id AND get_user_role(auth.uid()) = 'student'::user_role);

CREATE POLICY "Anyone can read challenge submissions"
ON public.challenge_submissions FOR SELECT
USING (true);

-- 3. Add is_independent column to challenges
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_independent BOOLEAN NOT NULL DEFAULT false;

-- 4. Certificate Templates table
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'bronze', 'silver', 'gold')),
  title TEXT NOT NULL DEFAULT 'Certificate of Achievement',
  subtitle TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  background_image_url TEXT,
  school_logo_url TEXT,
  template_preset TEXT NOT NULL DEFAULT 'classic',
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(level)
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published certificate templates"
ON public.certificate_templates FOR SELECT
USING (is_published = true OR is_staff(auth.uid()));

CREATE POLICY "Staff can manage certificate templates"
ON public.certificate_templates FOR ALL
USING (is_staff(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Seed default certificate templates
INSERT INTO public.certificate_templates (level, title, subtitle, body_text, template_preset) VALUES
  ('beginner', 'Beginner Reader', 'First Book Achievement', 'Congratulations on submitting your first book! Your reading journey has begun.', 'classic'),
  ('bronze', 'Bronze Achievement', '15 Books Completed', 'Outstanding effort! You have read 15 books and earned the Bronze Achievement.', 'elegant'),
  ('silver', 'Silver Achievement', '30 Books Completed', 'Remarkable dedication! You have read 30 books and earned the Silver Achievement.', 'modern'),
  ('gold', 'Gold Achievement', '45 Books Completed', 'Extraordinary accomplishment! You have completed the entire 45-Book Challenge and earned the Gold Achievement.', 'royal');

-- 6. Create certificates storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view certificate assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "Staff can upload certificate assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND is_staff(auth.uid()));

CREATE POLICY "Staff can update certificate assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificates' AND is_staff(auth.uid()));

CREATE POLICY "Staff can delete certificate assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificates' AND is_staff(auth.uid()));

-- 7. Add MAX_BOOKS_PER_CATEGORY constant reference (enforced in frontend)
