
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_provider_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- Storage policies: portfolios + avatars (private buckets, signed/owner-aware access)
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read portfolios" ON storage.objects FOR SELECT USING (bucket_id = 'portfolios');
CREATE POLICY "Providers upload own portfolio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Providers update own portfolio" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Providers delete own portfolio" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);
