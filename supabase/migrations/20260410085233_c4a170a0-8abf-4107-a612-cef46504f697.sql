
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  description text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view settings" ON public.system_settings FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Librarians can manage settings" ON public.system_settings FOR ALL USING (get_user_role(auth.uid()) = 'librarian'::user_role);

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('registration_enabled', 'true', 'Whether new user registration is allowed'),
  ('maintenance_mode', 'false', 'Whether the platform is in maintenance mode'),
  ('default_challenge_id', '', 'The default challenge ID to redirect users to'),
  ('announcement_banner', '', 'Platform-wide announcement banner text'),
  ('max_submissions_per_day', '10', 'Maximum book submissions per student per day');
