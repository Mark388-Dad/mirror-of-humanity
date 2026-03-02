-- Enable realtime for challenges table so homepage featured section updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;