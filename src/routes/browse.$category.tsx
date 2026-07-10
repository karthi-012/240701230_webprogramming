import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNearbyCity, sortByProximity } from "@/hooks/use-nearby-city";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { ProviderCard } from "@/routes/index";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/browse/$category")({
  head: ({ params }) => ({ meta: [{ title: `${params.category} pros — SkillConnect` }] }),
  component: BrowseCategory,
  notFoundComponent: () => <div className="container mx-auto py-20 text-center text-muted-foreground">Category not found</div>,
  errorComponent: ({ error }) => <div className="container mx-auto py-20 text-center text-destructive">{error.message}</div>,
});

function BrowseCategory() {
  const { category } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ta") ? "ta" : "en";
  const { user } = useAuth();
  const { city, areas } = useNearbyCity();

  const { data: cat } = useQuery({
    queryKey: ["category", category],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("slug", category).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["providers-by-cat", category, user?.id ?? null],
    queryFn: async () => {
      let query = supabase
        .from("providers")
        .select("id, headline, category_slug, city, service_areas, avg_rating, total_reviews, experience_years, verified, profiles!providers_profile_fkey(full_name, avatar_url)")
        .eq("category_slug", category)
        .order("avg_rating", { ascending: false });
      if (user?.id) query = query.neq("id", user.id);
      const { data } = await query;
      return data ?? [];
    },
  });

  const sorted = useMemo(() => sortByProximity(providers, areas), [providers, areas]);

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground">← {t("browse.all")}</Link>
      <div className="mt-4 flex items-center gap-4">
        {cat && (
          <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}>
            <CategoryIcon name={cat.icon} className="h-7 w-7" />
          </span>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {cat ? (lang === "ta" ? cat.name_ta : cat.name_en) : category}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{sorted.length} professionals</p>
        </div>
      </div>

      {city && (
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {t("nearby.sortedBy", { city, defaultValue: `Sorted by distance from ${city}` })}
        </div>
      )}

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
