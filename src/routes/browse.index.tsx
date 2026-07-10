import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNearbyCity, sortByProximity, proximityScore } from "@/hooks/use-nearby-city";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { ProviderCard } from "@/routes/index";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VoiceSearchButton } from "@/components/site/VoiceSearchButton";
import { Search, MapPin } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional(),
}).catch({});

export const Route = createFileRoute("/browse/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Browse Professionals — SkillConnect" }] }),
  component: BrowseAll,
});

function BrowseAll() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ta") ? "ta" : "en";
  const { q: initQ } = Route.useSearch();
  const [q, setQ] = useState(initQ ?? "");
  const { user } = useAuth();
  const { city, areas } = useNearbyCity();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["providers", q, user?.id ?? null],
    queryFn: async () => {
      let query = supabase
        .from("providers")
        .select("id, headline, category_slug, city, service_areas, avg_rating, total_reviews, experience_years, verified, profiles!providers_profile_fkey(full_name, avatar_url)")
        .order("avg_rating", { ascending: false })
        .limit(200);
      if (q.trim()) {
        query = query.or(`headline.ilike.%${q}%,city.ilike.%${q}%,category_slug.ilike.%${q}%`);
      }
      if (user?.id) query = query.neq("id", user.id);
      const { data } = await query;
      return data ?? [];
    },
  });

  const sorted = useMemo(() => sortByProximity(providers, areas), [providers, areas]);
  const nearbyCount = useMemo(
    () => (areas.length ? sorted.filter((p) => proximityScore(p, areas) < 99).length : 0),
    [sorted, areas],
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("browse.title")}</h1>
      <div className="mt-6 flex items-center gap-2 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("hero.searchPlaceholder")} className="pl-11 h-12 rounded-xl" />
        </div>
        <VoiceSearchButton className="h-12 w-12 rounded-xl shrink-0" onTranscript={(text) => setQ(text)} />
      </div>

      {city && (
        <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {t("nearby.sortedBy", { city, count: nearbyCount, defaultValue: `Sorted by distance from ${city} · ${nearbyCount} nearby` })}
        </div>
      )}

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <Link key={c.slug} to="/browse/$category" params={{ category: c.slug }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/60 hover:border-primary/40 text-sm font-semibold whitespace-nowrap">
            <CategoryIcon name={c.icon} className="h-4 w-4" style={{ color: c.color }} />
            {lang === "ta" ? c.name_ta : c.name_en}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {sorted.length === 0 ? (
          <Card className="p-10 text-center border-dashed text-muted-foreground">{t("browse.empty")}</Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((p) => <ProviderCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
