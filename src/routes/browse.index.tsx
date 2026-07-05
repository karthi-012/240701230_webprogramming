import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { ProviderCard } from "@/routes/index";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceSearchButton } from "@/components/site/VoiceSearchButton";
import { Search, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";


const searchSchema = z.object({
  q: z.string().optional(),
  near: z.union([z.literal("1"), z.literal("0")]).optional(),
}).catch({});

export const Route = createFileRoute("/browse/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Browse Professionals — SkillConnect" }] }),
  component: BrowseAll,
});

async function detectCityFromGeolocation(): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("geo-unsupported");
  }
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5 * 60 * 1000,
    });
  });
  const { latitude, longitude } = pos.coords;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
    { headers: { "Accept": "application/json" } },
  );
  if (!res.ok) throw new Error("reverse-failed");
  const json = await res.json();
  const a = json.address ?? {};
  const city: string = a.city || a.town || a.village || a.suburb || a.county || a.state_district || a.state || "";
  if (!city) throw new Error("no-city");
  return city;
}

function BrowseAll() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ta") ? "ta" : "en";
  const { q: initQ, near: initNear } = Route.useSearch();
  const [q, setQ] = useState(initQ ?? "");
  const [near, setNear] = useState(initNear === "1");
  const [detectedCity, setDetectedCity] = useState<string>("");
  const [detecting, setDetecting] = useState(false);
  const { user } = useAuth();

  const { data: myProfile } = useQuery({
    enabled: !!user,
    queryKey: ["profile-city", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("city").eq("id", user!.id).maybeSingle()).data,
  });
  const profileCity = (myProfile?.city ?? "").trim();
  const activeCity = detectedCity || profileCity;

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["providers", q, near, activeCity, user?.id ?? null],
    queryFn: async () => {
      let query = supabase
        .from("providers")
        .select("id, headline, category_slug, city, service_areas, avg_rating, total_reviews, experience_years, verified, profiles!providers_profile_fkey(full_name, avatar_url)")
        .order("avg_rating", { ascending: false })
        .limit(60);
      if (q.trim()) {
        query = query.or(`headline.ilike.%${q}%,city.ilike.%${q}%,category_slug.ilike.%${q}%`);
      }
      if (near && activeCity) {
        query = query.or(`city.ilike.%${activeCity}%,service_areas.cs.{${activeCity}}`);
      }
      if (user?.id) query = query.neq("id", user.id);
      const { data } = await query;
      return data ?? [];
    },
  });

  const handleNearClick = async () => {
    if (near) { setNear(false); return; }
    setDetecting(true);
    try {
      const city = await detectCityFromGeolocation();
      setDetectedCity(city);
      setNear(true);
      toast.success(t("nearby.detected", { city }));
    } catch (err: unknown) {
      const code = (err as GeolocationPositionError | (Error & { code?: number }))?.code;
      if (code === 1) {
        toast.error(t("nearby.permissionDenied"));
      } else if (profileCity) {
        setDetectedCity("");
        setNear(true);
        toast.message(t("nearby.usingProfileCity", { city: profileCity }));
      } else {
        toast.error(t("nearby.locationFailed"));
      }
    } finally {
      setDetecting(false);
    }
  };

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    if (initNear === "1" && !detectedCity && !detecting) {
      autoRan.current = true;
      void handleNearClick();
    }
     
  }, [initNear]);

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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={near ? "default" : "outline"}
          onClick={handleNearClick}
          disabled={detecting}
          className={near ? "bg-gradient-hero text-primary-foreground" : ""}
        >
          {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          {detecting
            ? t("nearby.detecting")
            : near
              ? t("nearby.showingNear", { city: activeCity || "…" })
              : t("nearby.fetchNearby")}
        </Button>
        {near && (
          <span className="text-xs text-muted-foreground">{t("nearby.hint")}</span>
        )}
      </div>


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
        {providers.length === 0 ? (
          <Card className="p-10 text-center border-dashed text-muted-foreground">
            {near && activeCity ? t("nearby.emptyNear", { city: activeCity }) : t("browse.empty")}
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => <ProviderCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
