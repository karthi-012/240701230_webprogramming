
CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  customer_name TEXT;
  provider_name TEXT;
BEGIN
  SELECT COALESCE(full_name, 'A customer') INTO customer_name FROM public.profiles WHERE id = NEW.customer_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.provider_id,
      'booking_new',
      'New booking request',
      customer_name || ' booked you for ' || NEW.service_date || COALESCE(' at ' || NEW.service_time::text, '') || '.'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT COALESCE(full_name, 'The worker') INTO provider_name FROM public.profiles WHERE id = NEW.provider_id;
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.customer_id,
      'booking_' || NEW.status,
      'Booking ' || NEW.status,
      provider_name || ' ' || NEW.status || ' your booking for ' || NEW.service_date || '.'
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_on_booking_ins ON public.bookings;
CREATE TRIGGER trg_notify_on_booking_ins
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking();

DROP TRIGGER IF EXISTS trg_notify_on_booking_upd ON public.bookings;
CREATE TRIGGER trg_notify_on_booking_upd
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking();
