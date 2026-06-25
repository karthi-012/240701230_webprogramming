import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Star, ShieldCheck, Sparkles, Smartphone, ArrowRight, MapPin } from "lucide-react";
import hero from "@/assets/hero-worker.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillConnect — Find Trusted Local Professionals Near You" },
      { name: "description", content: "Book mechanics, plumbers, electricians, cooks and more. Verified, rated, ready in minutes. Tamil & English." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ta") ? "ta" : "en";
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: topPros = [] } = useQuery({
    queryKey: ["top-pros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("id, headline, category_slug, city, avg_rating, total_reviews, experience_years, verified, profiles!providers_profile_fkey(full_name, avatar_url)")
        .order("avg_rating", { ascending: false })
        .order("total_reviews", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void navigate({ to: "/browse", search: { q } as never });
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.07]" />
        <div className="container mx-auto px-4 pt-12 md:pt-20 pb-16 md:pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 text-accent-foreground px-3 py-1.5 text-xs font-semibold ring-1 ring-accent/30">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {t("hero.eyebrow")}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-balance">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl text-balance">{t("hero.subtitle")}</p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <Button asChild size="lg" className="h-14 px-6 rounded-2xl bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-elegant font-semibold">
                <Link to="/browse">{t("hero.cta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-6 rounded-2xl font-semibold">
                <Link to="/onboarding">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>


            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { k: "10k+", v: t("hero.stats.pros") },
                { k: "50+", v: t("hero.stats.cities") },
                { k: "4.8★", v: t("hero.stats.rating") },
              ].map((s) => (
                <div key={s.v}>
                  <div className="text-2xl font-extrabold tracking-tight">{s.k}</div>
                  <div className="text-xs text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-hero opacity-20 rounded-[2rem] blur-2xl" />
            <img
              src={hero}
              alt="Verified local professional"
              width={1536}
              height={1536}
              className="relative w-full aspect-square object-cover rounded-3xl shadow-elegant ring-1 ring-border/60"
            />
            <Card className="absolute -left-4 bottom-6 px-4 py-3 flex items-center gap-3 shadow-elegant bg-card/95 backdrop-blur">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-success/15 text-success">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">100% Verified</div>
                <div className="text-xs text-muted-foreground">ID + skill check</div>
              </div>
            </Card>
            <Card className="absolute -right-4 top-6 px-4 py-3 flex items-center gap-3 shadow-elegant bg-card/95 backdrop-blur">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/20 text-accent-foreground">
                <Star className="h-5 w-5 fill-current text-accent" />
              </div>
              <div>
                <div className="text-sm font-semibold">4.9 / 5</div>
                <div className="text-xs text-muted-foreground">avg pro rating</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeading title={t("sections.popularCategories")} sub={t("sections.popularCategoriesSub")} />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 md:gap-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/browse/$category"
              params={{ category: c.slug }}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-card border border-border/60 p-4 hover:border-primary/50 hover:shadow-soft transition-all"
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${c.color}1a`, color: c.color }}
              >
                <CategoryIcon name={c.icon} className="h-6 w-6" />
              </span>
              <span className="text-xs font-semibold text-center leading-tight">
                {lang === "ta" ? c.name_ta : c.name_en}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-surface border-y border-border/60">
        <div className="container mx-auto px-4 py-20">
          <SectionHeading title={t("sections.howItWorks")} sub={t("sections.howItWorksSub")} />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { i: Search, k: "s1" as const },
              { i: Sparkles, k: "s2" as const },
              { i: ShieldCheck, k: "s3" as const },
            ].map(({ i: Icon, k }, idx) => (
              <Card key={k} className="p-6 relative overflow-hidden border-border/60">
                <div className="absolute top-3 right-4 text-6xl font-black text-muted/60 select-none">
                  {idx + 1}
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{t(`steps.${k}.t`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`steps.${k}.d`)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TOP RATED */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-8 gap-4">
          <SectionHeading title={t("sections.topRated")} sub={t("sections.topRatedSub")} className="mb-0" />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/browse">{t("cta.viewAll")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        {topPros.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <p className="text-muted-foreground">No professionals yet. Be the first to join!</p>
            <Button asChild className="mt-4 bg-gradient-hero text-primary-foreground">
              <Link to="/onboarding">{t("hero.ctaSecondary")}</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPros.map((p) => <ProviderCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* REVIEWS */}
      <section className="bg-surface border-y border-border/60">
        <div className="container mx-auto px-4 py-20">
          <SectionHeading title={t("sections.reviews")} sub={t("sections.reviewsSub")} />
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: "Priya R.", c: "Chennai", t: "Booked a plumber in 5 minutes. He fixed our motor leak the same evening — super professional." },
              { n: "Karthik M.", c: "Coimbatore", t: "Tamil voice search is a lifesaver. My mom uses it to call electricians herself now." },
              { n: "Ananya S.", c: "Madurai", t: "Cook for a function — arrived on time, food was loved by everyone. Will book again." },
            ].map((r) => (
              <Card key={r.n} className="p-6">
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-3 text-sm leading-relaxed">"{r.t}"</p>
                <div className="mt-4 text-sm">
                  <div className="font-semibold">{r.n}</div>
                  <div className="text-xs text-muted-foreground">{r.c}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOAD APP CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground p-8 md:p-14 shadow-elegant">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-8">
            <div>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("sections.downloadApp")}</h3>
              <p className="mt-3 text-primary-foreground/85 max-w-xl">{t("sections.downloadAppSub")}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" variant="secondary" className="h-14 rounded-2xl font-semibold">
                <Smartphone className="mr-2 h-5 w-5" /> Google Play
              </Button>
              <Button size="lg" variant="secondary" className="h-14 rounded-2xl font-semibold">
                <Smartphone className="mr-2 h-5 w-5" /> App Store
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ title, sub, className = "" }: { title: string; sub?: string; className?: string }) {
  return (
    <div className={`text-center mb-10 ${className}`}>
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance">{title}</h2>
      {sub && <p className="mt-3 text-muted-foreground text-balance">{sub}</p>}
    </div>
  );
}

type ProviderRow = {
  id: string;
  headline: string | null;
  category_slug: string;
  city: string | null;
  avg_rating: number;
  total_reviews: number;
  experience_years: number;
  verified: boolean;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export function ProviderCard({ p }: { p: ProviderRow }) {
  const { t } = useTranslation();
  return (
    <Link to="/providers/$id" params={{ id: p.id }}>
      <Card className="p-5 hover:shadow-elegant hover:-translate-y-0.5 transition-all border-border/60 h-full">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-warm grid place-items-center text-accent-foreground font-bold text-lg overflow-hidden shrink-0">
            {p.profiles?.avatar_url ? (
              <img src={p.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (p.profiles?.full_name ?? "?").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold truncate">{p.profiles?.full_name ?? "Pro"}</h3>
              {p.verified && <ShieldCheck className="h-4 w-4 text-success shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground capitalize">{p.category_slug.replace("-", " ")}</p>
            <p className="text-sm mt-1 line-clamp-1">{p.headline ?? "Professional service"}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {Number(p.avg_rating).toFixed(1)} <span className="text-muted-foreground font-normal">({p.total_reviews})</span>
          </span>
          <span>{t("browse.yearsExp", { years: p.experience_years })}</span>
          {p.city && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
