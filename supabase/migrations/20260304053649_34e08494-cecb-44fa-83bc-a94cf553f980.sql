
-- Allow staff to update book_submissions (approve, reject, flag, edit points)
CREATE POLICY "Staff can update book submissions"
ON public.book_submissions
FOR UPDATE
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Allow staff to delete book_submissions
CREATE POLICY "Staff can delete book submissions"
ON public.book_submissions
FOR DELETE
TO authenticated
USING (is_staff(auth.uid()));

-- Allow staff to insert notifications for any user
CREATE POLICY "Staff can create notifications for users"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));
