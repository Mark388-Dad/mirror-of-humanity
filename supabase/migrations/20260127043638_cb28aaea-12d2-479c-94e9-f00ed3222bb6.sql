-- Fix the overly permissive notification INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications for themselves" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);