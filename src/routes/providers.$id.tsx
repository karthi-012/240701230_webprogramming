import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Star, Phone, MessageCircle, ShieldCheck, MapPin, Calendar, Briefcase, Heart } from "lucide-react";
import { AiProviderSummary } from "@/components/site/AiProviderSummary";


export const Route = createFileRoute("/providers/$id")({
  head: () => ({ meta: [{ title: "Professional Profile — SkillConnect" }] }),
  component: ProviderPage,
  errorComponent: ({ error }) => <div className="container mx-auto py-20 text-center text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="container mx-auto py-20 text-center text-muted-foreground">Professional not found</div>,
});

// Build a WhatsApp deep-link safely. Strips non-digits and prefixes a default
// country code (India, 91) when the user stored a 10-digit local number.
function buildWhatsAppUrl(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  return `https://wa.me/${digits}`;
}

function ProviderPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [bookOpen, setBookOpen] = useState(false);

  const { data: provider } = useQuery({
    queryKey: ["provider", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*, profiles!providers_profile_fkey(full_name, avatar_url, phone, city)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ["portfolio", id],
    queryFn: async () =>
      (await supabase.from("portfolio_images").select("*").eq("provider_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () =>
      (await supabase.from("reviews").select("*, profiles:customer_id(full_name, avatar_url)").eq("provider_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const createBooking = useMutation({
    mutationFn: async (vals: { date: string; time: string; address: string; notes: string }) => {
      if (!user) throw new Error("Please sign in to book a service.");
      if (user.id === id) throw new Error("You cannot book yourself.");
      const { error } = await supabase.from("bookings").insert({
        customer_id: user.id,
        provider_id: id,
        service_date: vals.date,
        service_time: vals.time || null,
        address: vals.address || null,
        notes: vals.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking request sent!");
      setBookOpen(false);
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!provider) {
    return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const phone = provider.phone ?? provider.profiles?.phone;
  const wa = provider.whatsapp ?? phone;
  const isSelf = user?.id === provider.id;

  const onBookClick = () => {
    if (!user) {
      toast.error("Please sign in to book a service.");
      return;
    }
    if (isSelf) {
      toast.error("You cannot book yourself.");
      return;
    }
    setBookOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="p-6 md:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="h-24 w-24 md:h-28 md:w-28 rounded-3xl bg-gradient-warm grid place-items-center text-accent-foreground text-3xl font-extrabold overflow-hidden">
            {provider.profiles?.avatar_url
              ? <img src={provider.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
              : (provider.profiles?.full_name ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{provider.profiles?.full_name ?? "Professional"}</h1>
              {provider.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success px-2 py-0.5 text-xs font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t("provider.verified")}
                </span>
              )}
            </div>
            <p className="text-muted-foreground capitalize mt-1">{provider.category_slug.replace("-", " ")}</p>
            {provider.headline && <p className="mt-2 font-medium">{provider.headline}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="h-4 w-4 fill-accent text-accent" /> {Number(provider.avg_rating).toFixed(1)} ({provider.total_reviews})
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Briefcase className="h-4 w-4" /> {t("browse.yearsExp", { years: provider.experience_years })}
              </span>
              {provider.city && (
                <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {provider.city}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Button
              className="bg-gradient-hero text-primary-foreground font-semibold h-11"
              onClick={onBookClick}
              disabled={isSelf}
              title={isSelf ? "You cannot book yourself" : undefined}
            >
              <Calendar className="mr-2 h-4 w-4" /> {t("provider.bookService")}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {phone && (
                <Button asChild variant="outline" className="font-semibold">
                  <a href={`tel:${phone}`}><Phone className="mr-1.5 h-4 w-4" /> {t("provider.callNow")}</a>
                </Button>
              )}
              {wa && (
                <Button
                  variant="outline"
                  className="font-semibold"
                  onClick={() => window.open(buildWhatsAppUrl(wa), "_blank", "noopener,noreferrer")}
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" /> {t("provider.whatsapp")}
                </Button>
              )}
            </div>
          </div>
        </div>

        <AiProviderSummary
          providerId={provider.id}
          name={provider.profiles?.full_name ?? "Professional"}
          category={provider.category_slug}
          headline={provider.headline}
          bio={provider.bio}
          experienceYears={provider.experience_years}
          avgRating={provider.avg_rating}
          totalReviews={provider.total_reviews}
          reviewComments={reviews.map((r) => r.comment ?? "").filter(Boolean)}
        />

        {provider.bio && (
          <div className="mt-8">
            <h2 className="font-bold text-lg">{t("provider.about")}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{provider.bio}</p>
          </div>
        )}


        {provider.service_areas?.length > 0 && (
          <div className="mt-6">
            <h2 className="font-bold text-lg">{t("provider.serviceAreas")}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {provider.service_areas.map((a) => (
                <span key={a} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{a}</span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {portfolio.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight mb-4">{t("provider.portfolio")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {portfolio.map((img) => (
              <a key={img.id} href={img.image_url} target="_blank" rel="noreferrer" className="aspect-square rounded-2xl overflow-hidden border border-border/60">
                <img src={img.image_url} alt={img.caption ?? ""} className="h-full w-full object-cover hover:scale-105 transition-transform" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold tracking-tight mb-4">{t("provider.reviews")} ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed">No reviews yet.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {reviews.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-sm font-bold">
                    {(r.profiles?.full_name ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{r.profiles?.full_name ?? "Customer"}</div>
                    <div className="flex gap-0.5 text-accent">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                    </div>
                  </div>
                </div>
                {r.comment && <p className="mt-3 text-sm leading-relaxed">{r.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="mt-12 text-center">
        <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground">← Back to browse</Link>
      </div>

      <BookingDialog
        open={bookOpen}
        onOpenChange={setBookOpen}
        submitting={createBooking.isPending}
        onSubmit={(vals) => createBooking.mutate(vals)}
        providerName={provider.profiles?.full_name ?? "Professional"}
      />
    </div>
  );
}

function BookingDialog({
  open, onOpenChange, onSubmit, submitting, providerName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (vals: { date: string; time: string; address: string; notes: string }) => void;
  submitting: boolean;
  providerName: string;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book {providerName}</DialogTitle>
          <DialogDescription>Send a booking request. The professional will confirm shortly.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!date) return;
            onSubmit({ date, time, address, notes });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bk-date">Date</Label>
              <Input id="bk-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="bk-time">Time</Label>
              <Input id="bk-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="bk-addr">Service address</Label>
            <Input id="bk-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" />
          </div>
          <div>
            <Label htmlFor="bk-notes">Notes</Label>
            <Textarea id="bk-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the issue or scope" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !date} className="bg-gradient-hero text-primary-foreground">
              {submitting ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
