import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProviderCard } from "@/routes/index";
import { Briefcase, Heart, Calendar, Star, Search } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — SkillConnect" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQ, setSearchQ] = useState("");
  const [reviewBooking, setReviewBooking] = useState<{ id: string; provider_id: string; name: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: providerProfile } = useQuery({
    enabled: !!user,
    queryKey: ["my-provider", user?.id],
    queryFn: async () => (await supabase.from("providers").select("id").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: bookings = [] } = useQuery({
    enabled: !!user,
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => (await supabase.from("bookings").select("*, providers:provider_id(headline, category_slug, profiles!providers_profile_fkey(full_name))").eq("customer_id", user!.id).order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  const { data: myReviews = [] } = useQuery({
    enabled: !!user,
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => (await supabase.from("reviews").select("booking_id").eq("customer_id", user!.id)).data ?? [],
  });
  const reviewedBookingIds = new Set(myReviews.map((r) => r.booking_id).filter(Boolean));

  const { data: favorites = [] } = useQuery({
    enabled: !!user,
    queryKey: ["my-favorites", user?.id],
    queryFn: async () => (await supabase
      .from("favorites")
      .select("provider_id, providers:provider_id(id, headline, category_slug, city, avg_rating, total_reviews, experience_years, verified, profiles!providers_profile_fkey(full_name, avatar_url))")
      .eq("customer_id", user!.id)).data ?? [],
  });

  if (loading || !user) return <div className="container mx-auto py-20 text-center text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("dashboard.welcome")}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{profile?.full_name ?? user.email}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline"><Link to="/profile">{t("dashboard.myProfile")}</Link></Button>
          {providerProfile ? (
            <Button asChild variant="outline"><Link to="/dashboard/provider">{t("dashboard.providerDashboard")}</Link></Button>
          ) : (
            <Button asChild className="bg-gradient-hero text-primary-foreground"><Link to="/onboarding">{t("dashboard.becomePro")}</Link></Button>
          )}
        </div>
      </div>

      {!providerProfile && (
        <Card className="mt-6 p-6 bg-gradient-warm/10 border-accent/30 flex items-center gap-4">
          <Briefcase className="h-6 w-6 text-accent" />
          <div className="flex-1">
            <div className="font-bold">{t("dashboard.becomePro")}</div>
            <div className="text-sm text-muted-foreground">{t("dashboard.becomeProSub")}</div>
          </div>
          <Button asChild><Link to="/onboarding">{t("dashboard.start")}</Link></Button>
        </Card>
      )}

      <Card className="mt-6 p-6 md:p-8 bg-gradient-hero/5 border-primary/20 shadow-soft">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t("dashboard.findWorker")}</h2>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">{t("dashboard.findWorkerSub")}</p>
        <form
          className="mt-4 flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void navigate({ to: "/browse", search: searchQ.trim() ? { q: searchQ.trim() } : undefined });
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="h-14 pl-12 text-base rounded-xl"
            />
          </div>
          <Button type="submit" size="lg" className="h-14 px-8 text-base bg-gradient-hero text-primary-foreground font-semibold rounded-xl">
            {t("dashboard.browseWorkers")}
          </Button>
        </form>
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 rounded-xl border-primary/40 text-primary hover:bg-primary/5"
            onClick={() => {
              if (!profile?.city?.trim()) {
                toast.error(t("nearby.setCityFirst"));
                void navigate({ to: "/profile" });
                return;
              }
              void navigate({ to: "/browse", search: { ...(searchQ.trim() ? { q: searchQ.trim() } : {}), near: "1" } });
            }}
          >
            <MapPin className="h-4 w-4" />
            {t("nearby.fetchNearby")}
          </Button>
          {!profile?.city?.trim() && (
            <p className="mt-2 text-xs text-muted-foreground">{t("nearby.setCityFirst")}</p>
          )}
        </div>
      </Card>


      <section className="mt-10">
        <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="h-5 w-5" /> {t("dashboard.myBookings")}</h2>
        <div className="mt-4 grid gap-3">
          {bookings.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">{t("dashboard.noBookings")}</Card>
          ) : bookings.map((b) => {
            const name = b.providers?.profiles?.full_name ?? t("common.provider");
            const isCompleted = b.status === "completed";
            const alreadyReviewed = reviewedBookingIds.has(b.id);
            return (
              <Card key={b.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{b.providers?.category_slug?.replace("-", " ")} • {b.service_date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">{b.status}</span>
                  {isCompleted && !alreadyReviewed && (
                    <Button size="sm" onClick={() => setReviewBooking({ id: b.id, provider_id: b.provider_id, name })}>
                      <Star className="mr-1 h-3.5 w-3.5" /> {t("dashboard.writeReview")}
                    </Button>
                  )}
                  {isCompleted && alreadyReviewed && (
                    <span className="text-xs text-success font-semibold">✓ {t("dashboard.reviewed")}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold flex items-center gap-2"><Heart className="h-5 w-5" /> {t("dashboard.favorites")}</h2>
        {favorites.length === 0 ? (
          <Card className="mt-4 p-8 text-center text-muted-foreground border-dashed">{t("dashboard.noFavorites")}</Card>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.filter((f) => f.providers).map((f) => <ProviderCard key={f.provider_id} p={f.providers!} />)}
          </div>
        )}
      </section>

      <ReviewDialog
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
      />
    </div>
  );
}

function ReviewDialog({ booking, onClose }: { booking: { id: string; provider_id: string; name: string } | null; onClose: () => void }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (booking) { setRating(5); setHover(0); setComment(""); }
  }, [booking]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user || !booking) throw new Error("Missing data");
      const { error } = await supabase.from("reviews").insert({
        booking_id: booking.id,
        customer_id: user.id,
        provider_id: booking.provider_id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("dashboard.thanksReview"));
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!booking} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dashboard.rate")} {booking?.name}</DialogTitle>
          <DialogDescription>{t("dashboard.reviewHelp")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex items-center justify-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="p-1"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${(hover || rating) >= n ? "fill-accent text-accent" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("dashboard.reviewPlaceholder")}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            disabled={submit.isPending}
            onClick={() => submit.mutate()}
            className="bg-gradient-hero text-primary-foreground"
          >
            {submit.isPending ? t("dashboard.submitting") : t("dashboard.submitReview")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
