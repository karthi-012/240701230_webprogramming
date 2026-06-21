
ALTER TABLE public.providers
  ADD CONSTRAINT providers_profile_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_customer_profile_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_customer_profile_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_customer_profile_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
