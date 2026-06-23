import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderCard } from "@/routes/index";
import { Briefcase, Heart, Calendar, Settings } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — SkillConnect" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const { data: favorites = [] } = useQuery({
    enabled: !!user,
    queryKey: ["my-favorites", user?.id],
    queryFn: async () => (await supabase
      .from("favorites")
      .select("provider_id, providers:provider_id(id, headline, category_slug, city, avg_rating, total_reviews, experience_years, verified, profiles!providers_profile_fkey(full_name, avatar_url))")
      .eq("customer_id", user!.id)).data ?? [],
  });

  if (loading || !user) return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("dashboard.welcome")}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{profile?.full_name ?? user.email}</h1>
        </div>
        {providerProfile ? (
          <Button asChild variant="outline"><Link to="/dashboard/provider">Provider dashboard</Link></Button>
        ) : (
          <Button asChild className="bg-gradient-hero text-primary-foreground"><Link to="/onboarding">{t("dashboard.becomePro")}</Link></Button>
        )}
      </div>

      {!providerProfile && (
        <Card className="mt-6 p-6 bg-gradient-warm/10 border-accent/30 flex items-center gap-4">
          <Briefcase className="h-6 w-6 text-accent" />
          <div className="flex-1">
            <div className="font-bold">{t("dashboard.becomePro")}</div>
            <div className="text-sm text-muted-foreground">{t("dashboard.becomeProSub")}</div>
          </div>
          <Button asChild><Link to="/onboarding">Start</Link></Button>
        </Card>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="h-5 w-5" /> {t("dashboard.myBookings")}</h2>
        <div className="mt-4 grid gap-3">
          {bookings.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">No bookings yet.</Card>
          ) : bookings.map((b) => (
            <Card key={b.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{b.providers?.profiles?.full_name ?? "Provider"}</div>
                <div className="text-xs text-muted-foreground capitalize">{b.providers?.category_slug?.replace("-", " ")} • {b.service_date}</div>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">{b.status}</span>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold flex items-center gap-2"><Heart className="h-5 w-5" /> {t("dashboard.favorites")}</h2>
        {favorites.length === 0 ? (
          <Card className="mt-4 p-8 text-center text-muted-foreground border-dashed">No saved pros yet.</Card>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.filter((f) => f.providers).map((f) => <ProviderCard key={f.provider_id} p={f.providers!} />)}
          </div>
        )}
      </section>
    </div>
  );
}
