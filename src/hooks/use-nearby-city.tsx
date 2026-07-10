import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

function cleanName(v: unknown): string {
  if (typeof v !== "string") return "";
  const c = v.replace(/\s+/g, " ").trim();
  if (!c) return "";
  if (/\b(taluka|tehsil|district|county)\b/i.test(c)) return "";
  return c;
}

async function detectFromGeo(): Promise<{ city: string; areas: string[] } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5 * 60 * 1000,
      });
    });
    const { latitude, longitude } = pos.coords;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const a = json.address ?? {};
    const areas = [
      a.neighbourhood, a.suburb, a.city_district, a.city, a.town,
      a.village, a.municipality, a.state_district, a.state,
    ].map(cleanName).filter(Boolean) as string[];
    const postcode = typeof a.postcode === "string" ? a.postcode.trim() : "";
    if (postcode) areas.push(postcode);
    return { city: areas[0] ?? "", areas };
  } catch {
    return null;
  }
}

const CACHE_KEY = "sc:nearby-city:v1";

export function useNearbyCity() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    enabled: !!user,
    queryKey: ["profile-city", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("city").eq("id", user!.id).maybeSingle()).data,
  });
  const profileCity = (profile?.city ?? "").trim();

  const [geo, setGeo] = useState<{ city: string; areas: string[] } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Date.now() - parsed.at < 30 * 60 * 1000) return parsed.value;
    } catch { /* ignore */ }
    return null;
  });

  useEffect(() => {
    if (geo) return;
    let cancelled = false;
    void detectFromGeo().then((v) => {
      if (cancelled || !v) return;
      setGeo(v);
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), value: v }));
      } catch { /* ignore */ }
    });
    return () => { cancelled = true; };
  }, [geo]);

  const city = geo?.city || profileCity;
  const areas = geo?.areas ?? (profileCity ? [profileCity] : []);
  return { city, areas };
}

type ProviderLike = { city?: string | null; service_areas?: string[] | null };

/** Lower score = closer. */
export function proximityScore(p: ProviderLike, areas: string[]): number {
  if (!areas.length) return 99;
  const pCity = (p.city ?? "").toLowerCase().trim();
  const pAreas = (p.service_areas ?? []).map((s) => s.toLowerCase().trim());
  for (let i = 0; i < areas.length; i++) {
    const a = areas[i].toLowerCase();
    if (pCity && (pCity === a || pCity.includes(a) || a.includes(pCity))) return i;
    if (pAreas.some((x) => x === a || x.includes(a) || a.includes(x))) return i + 0.5;
  }
  return 99;
}

export function sortByProximity<T extends ProviderLike & { avg_rating?: number | string }>(
  list: T[],
  areas: string[],
): T[] {
  if (!areas.length) return list;
  return [...list].sort((a, b) => {
    const sa = proximityScore(a, areas);
    const sb = proximityScore(b, areas);
    if (sa !== sb) return sa - sb;
    return Number(b.avg_rating ?? 0) - Number(a.avg_rating ?? 0);
  });
}
