import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Briefcase, UserCircle } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get started — SkillConnect" }] }),
  component: Onboarding,
});

const providerSchema = z.object({
  category_slug: z.string().min(1, "Pick a category"),
  headline: z.string().trim().min(3).max(120),
  bio: z.string().trim().max(2000).optional(),
  experience_years: z.coerce.number().int().min(0).max(80),
  city: z.string().trim().min(1).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  phone: z.string().trim().min(7).max(20),
  service_areas: z.string().trim().max(300).optional(),
});


function Onboarding() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"choose" | "provider">("choose");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const [form, setForm] = useState({
    category_slug: "", headline: "", bio: "", experience_years: "1",
    city: "", pincode: "", phone: "", service_areas: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    const geo = await detectFromGeo();
    setLocating(false);
    if (!geo) {
      toast.error("Couldn't get your location. Allow location access, or type your city and pincode.");
      return;
    }
    if (geo.lat != null && geo.lng != null) setCoords({ lat: geo.lat, lng: geo.lng });
    setForm((f) => ({
      ...f,
      city: geo.city || f.city,
      pincode: geo.pincode || f.pincode,
      service_areas: f.service_areas || geo.areas.filter((a) => !/^\d+$/.test(a)).slice(0, 4).join(", "),
    }));
    toast.success("Location captured — customers nearby will see you first.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = providerSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!user) return;
    setSubmitting(true);
    const areas = (parsed.data.service_areas ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("providers").upsert({
      id: user.id,
      category_slug: parsed.data.category_slug,
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      experience_years: parsed.data.experience_years,
      city: parsed.data.city,
      pincode: parsed.data.pincode,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      phone: parsed.data.phone,
      whatsapp: parsed.data.phone,
      service_areas: areas,
    });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }
    await supabase.from("user_roles").insert({ user_id: user.id, role: "provider" }).then(() => {});
    toast.success("Profile created!");
    void navigate({ to: "/dashboard/provider" });
  };


  if (loading || !user) return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading…</div>;

  if (mode === "choose") {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">How will you use SkillConnect?</h1>
          <p className="mt-3 text-muted-foreground">You can switch roles anytime.</p>
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <button onClick={() => navigate({ to: "/dashboard" })}
              className="group text-left">
              <Card className="p-6 h-full hover:border-primary/50 hover:shadow-elegant transition-all">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserCircle className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-bold">Continue as Customer</h2>
                <p className="text-sm text-muted-foreground mt-1">Find and book local professionals.</p>
              </Card>
            </button>
            <button onClick={() => setMode("provider")} className="text-left">
              <Card className="p-6 h-full hover:border-primary/50 hover:shadow-elegant transition-all">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent-foreground">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-bold">Continue as Professional</h2>
                <p className="text-sm text-muted-foreground mt-1">Offer your services & receive bookings.</p>
              </Card>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link to="/onboarding" onClick={(e) => { e.preventDefault(); setMode("choose"); }} className="text-sm text-muted-foreground">← Back</Link>
      <h1 className="text-3xl font-extrabold tracking-tight mt-2">Set up your professional profile</h1>
      <p className="text-muted-foreground mt-1">Customers will see this on your profile page.</p>
      <Card className="mt-6 p-6 md:p-8 shadow-soft">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Service category</Label>
            <Select value={form.category_slug} onValueChange={(v) => setForm({ ...form, category_slug: v })}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Choose…" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Headline</Label>
            <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. 24/7 emergency plumbing • 8 yrs experience" className="mt-1.5 h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Years of experience</Label>
              <Input type="number" min={0} value={form.experience_years}
                onChange={(e) => setForm({ ...form, experience_years: e.target.value })} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5 h-11" />
            </div>
          </div>
          <div>
            <Label>Phone / WhatsApp</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91…" className="mt-1.5 h-11" />
          </div>
          <div>
            <Label>Service areas (comma separated)</Label>
            <Input value={form.service_areas} onChange={(e) => setForm({ ...form, service_areas: e.target.value })}
              placeholder="Anna Nagar, T. Nagar, Adyar" className="mt-1.5 h-11" />
          </div>
          <div>
            <Label>About</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell customers about your work…" rows={4} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-11 bg-gradient-hero text-primary-foreground font-semibold">
            {submitting ? "Saving…" : "Create profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
