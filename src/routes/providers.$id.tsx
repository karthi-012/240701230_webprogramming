import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Phone, MessageCircle, ShieldCheck, MapPin, Calendar, Briefcase } from "lucide-react";

export const Route = createFileRoute("/providers/$id")({
  head: () => ({ meta: [{ title: "Professional Profile — SkillConnect" }] }),
  component: ProviderPage,
  errorComponent: ({ error }) => <div className="container mx-auto py-20 text-center text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="container mx-auto py-20 text-center text-muted-foreground">Professional not found</div>,
});

function ProviderPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: provider } = useQuery({
    queryKey: ["provider", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*, profiles:id(full_name, avatar_url, phone, city)")
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

  if (!provider) {
    return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const phone = provider.phone ?? provider.profiles?.phone;
  const wa = provider.whatsapp ?? phone;

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
            <Button className="bg-gradient-hero text-primary-foreground font-semibold h-11">
              <Calendar className="mr-2 h-4 w-4" /> {t("provider.bookService")}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {phone && (
                <Button asChild variant="outline" className="font-semibold">
                  <a href={`tel:${phone}`}><Phone className="mr-1.5 h-4 w-4" /> {t("provider.callNow")}</a>
                </Button>
              )}
              {wa && (
                <Button asChild variant="outline" className="font-semibold">
                  <a href={`https://wa.me/${encodeURIComponent(wa.replace(/\D/g, ""))}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-1.5 h-4 w-4" /> {t("provider.whatsapp")}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

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
    </div>
  );
}
