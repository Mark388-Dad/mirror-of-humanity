-- Add new year groups to the enum
ALTER TYPE public.year_group ADD VALUE IF NOT EXISTS 'G11';
ALTER TYPE public.year_group ADD VALUE IF NOT EXISTS 'G12';

-- Update challenge RLS policy to allow all staff to manage challenges (not just librarians)
DROP POLICY IF EXISTS "Librarians can manage challenges" ON public.challenges;
CREATE POLICY "Staff can manage challenges" 
ON public.challenges 
FOR ALL 
USING (is_staff(auth.uid()));

-- Ensure access_codes table can handle role-specific codes
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS role_restriction text DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS idx_pending_submissions_email ON public.pending_submissions(email);