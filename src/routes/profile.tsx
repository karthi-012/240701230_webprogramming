import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, User } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — SkillConnect" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.city ?? "");
    }
  }, [profile]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("profile.updated"));
    void qc.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image");
    if (f.size > 5 * 1024 * 1024) return toast.error("Max file size is 5MB");
    setUploading(true);
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: signed, error: sErr } = await supabase.storage
      .from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (sErr || !signed?.signedUrl) { setUploading(false); return toast.error(sErr?.message ?? "Could not get URL"); }
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: signed.signedUrl }).eq("id", user.id);
    setUploading(false);
    if (updErr) return toast.error(updErr.message);
    toast.success(t("profile.photoUpdated"));
    void qc.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  if (loading || !user) {
    return <div className="container mx-auto py-20 text-center text-muted-foreground">{t("common.loading")}</div>;
  }

  const initial = (fullName || user.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("profile.title", "My profile")}</h1>
      <p className="mt-1 text-muted-foreground">Manage your personal details and profile photo.</p>

      <Card className="mt-6 p-6 md:p-8 shadow-soft">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-24 w-24 rounded-3xl bg-gradient-warm grid place-items-center text-accent-foreground text-3xl font-extrabold overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                : initial}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-md hover:opacity-90 disabled:opacity-50"
              aria-label="Change profile photo"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-lg truncate">{fullName || "Unnamed"}</div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 text-sm font-semibold text-primary hover:underline"
            >
              {uploading ? "Uploading…" : "Change photo"}
            </button>
          </div>
        </div>

        <form className="mt-8 grid gap-4" onSubmit={onSave}>
          <div>
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="p-phone">Phone</Label>
            <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="10-digit mobile" inputMode="tel" />
          </div>
          <div>
            <Label htmlFor="p-city">City</Label>
            <Input id="p-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} placeholder="e.g. Chennai" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-gradient-hero text-primary-foreground font-semibold">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-6 p-6 flex items-center gap-3 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        Your profile details are shown to customers when they view your service listing.
      </Card>
    </div>
  );
}
