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

export type GeoResult = {
  city: string;
  areas: string[];
  pincode: string;
  lat: number | null;
  lng: number | null;
};

export async function detectFromGeo(): Promise<GeoResult | null> {
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
    if (!res.ok) return { city: "", areas: [], pincode: "", lat: latitude, lng: longitude };
    const json = await res.json();
    const a = json.address ?? {};
    const areas = [
      a.neighbourhood, a.suburb, a.city_district, a.city, a.town,
      a.village, a.municipality, a.state_district, a.state,
    ].map(cleanName).filter(Boolean) as string[];
    const postcode = typeof a.postcode === "string" ? a.postcode.trim() : "";
    if (postcode) areas.push(postcode);
    return { city: areas[0] ?? "", areas, pincode: postcode, lat: latitude, lng: longitude };
  } catch {
    return null;
  }
}

const CACHE_KEY = "sc:nearby-city:v2";

export function useNearbyCity() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    enabled: !!user,
    queryKey: ["profile-city", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("city").eq("id", user!.id).maybeSingle()).data,
  });
  const profileCity = (profile?.city ?? "").trim();

  const [geo, setGeo] = useState<GeoResult | null>(() => {
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
  return { city, areas, pincode: geo?.pincode ?? "", lat: geo?.lat ?? null, lng: geo?.lng ?? null };
}

type ProviderLike = {
  city?: string | null;
  service_areas?: string[] | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type Origin = { areas: string[]; pincode?: string; lat?: number | null; lng?: number | null };

const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Real distance in km when both sides have coordinates, else null. */
export function distanceKm(p: ProviderLike, origin: Origin): number | null {
  if (origin.lat == null || origin.lng == null) return null;
  if (p.latitude == null || p.longitude == null) return null;
  return haversineKm(origin.lat, origin.lng, p.latitude, p.longitude);
}

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

/**
 * Ranking tiers (best first):
 *  0. exact pincode match
 *  1. real Haversine distance (both sides have lat/lng)
 *  2. text area match fallback
 */
function rank(p: ProviderLike, origin: Origin): [number, number] {
  const pin = (origin.pincode ?? "").trim();
  if (pin && (p.pincode ?? "").trim() === pin) return [0, 0];
  const km = distanceKm(p, origin);
  if (km != null) return [1, km];
  return [2, proximityScore(p, origin.areas)];
}

export function sortByProximity<T extends ProviderLike & { avg_rating?: number | string }>(
  list: T[],
  origin: Origin | string[],
): T[] {
  const o: Origin = Array.isArray(origin) ? { areas: origin } : origin;
  if (!o.areas.length && o.lat == null && !o.pincode) return list;
  return [...list].sort((a, b) => {
    const [ta, va] = rank(a, o);
    const [tb, vb] = rank(b, o);
    if (ta !== tb) return ta - tb;
    if (va !== vb) return va - vb;
    return Number(b.avg_rating ?? 0) - Number(a.avg_rating ?? 0);
  });
}


/** True when the provider is a pincode match, within maxKm, or matches a known area name. */
export function isNearby(p: ProviderLike, origin: Origin, maxKm = 25): boolean {
  const [tier, value] = rank(p, origin);
  if (tier === 0) return true;
  if (tier === 1) return value <= maxKm;
  return value < 99;
}
