import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Star, CheckCircle2, Clock, Briefcase, Upload, ImagePlus, Trash2 } from "lucide-react";
import { formatTimeWithPeriod } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/provider")({
  head: () => ({ meta: [{ title: "Provider Dashboard — SkillConnect" }] }),
  component: ProviderDashboard,
});

function ProviderDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [portfolioImageToDelete, setPortfolioImageToDelete] = useState<{ id: string; image_url: string } | null>(null);
  const [deletingPortfolioImage, setDeletingPortfolioImage] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: provider } = useQuery({
    enabled: !!user,
    queryKey: ["my-provider-full", user?.id],
    queryFn: async () => (await supabase.from("providers").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: portfolio = [] } = useQuery({
    enabled: !!user,
    queryKey: ["my-portfolio", user?.id],
    queryFn: async () => (await supabase.from("portfolio_images").select("*").eq("provider_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: requests = [] } = useQuery({
    enabled: !!user,
    queryKey: ["incoming-bookings", user?.id],
    queryFn: async () => (await supabase.from("bookings").select("*").eq("provider_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  if (loading || !user) return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading…</div>;
  if (!provider) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-muted-foreground">You don't have a provider profile yet.</p>
        <Button asChild className="mt-4 bg-gradient-hero text-primary-foreground"><Link to="/onboarding">Set up profile</Link></Button>
      </div>
    );
  }

  const completion = Math.round(
    [provider.headline, provider.bio, provider.city, provider.phone,
      provider.service_areas?.length, portfolio.length > 0].filter(Boolean).length / 6 * 100
  );

  const toggleAvail = async (v: boolean) => {
    const { error } = await supabase.from("providers").update({ is_available: v }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success(v ? "You're available" : "Marked unavailable"); void qc.invalidateQueries({ queryKey: ["my-provider-full"] }); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${f.name.replace(/[^a-z0-9.]/gi, "_")}`;
    const { error: upErr } = await supabase.storage.from("portfolios").upload(path, f);
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from("portfolios").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (signed?.signedUrl) {
      await supabase.from("portfolio_images").insert({ provider_id: user.id, image_url: signed.signedUrl });
      toast.success("Photo added");
      void qc.invalidateQueries({ queryKey: ["my-portfolio"] });
      void qc.invalidateQueries({ queryKey: ["portfolio", user.id] });
    }
    setUploading(false);
  };

  const updateBookingStatus = async (id: string, status: "accepted" | "rejected" | "completed") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); void qc.invalidateQueries({ queryKey: ["incoming-bookings"] }); }
  };

  const deletePortfolioImage = async () => {
    if (!portfolioImageToDelete) return;

    setDeletingPortfolioImage(true);
    const { error } = await supabase
      .from("portfolio_images")
      .delete()
      .eq("id", portfolioImageToDelete.id)
      .eq("provider_id", user.id);
    if (error) {
      toast.error(error.message);
      setDeletingPortfolioImage(false);
      return;
    }

    const storagePath = portfolioImageToDelete.image_url.match(/\/storage\/v1\/object\/sign\/portfolios\/([^?]+)/)?.[1];
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("portfolios")
        .remove([decodeURIComponent(storagePath)]);
      if (storageError) toast.error(`Post deleted, but image cleanup failed: ${storageError.message}`);
      else toast.success("Post deleted");
    } else {
      toast.success("Post deleted");
    }

    setPortfolioImageToDelete(null);
    setDeletingPortfolioImage(false);
    void qc.invalidateQueries({ queryKey: ["my-portfolio"] });
    void qc.invalidateQueries({ queryKey: ["portfolio", user.id] });
  };

  const active = requests.filter((r) => r.status === "pending" || r.status === "accepted").length;
  const completed = requests.filter((r) => r.status === "completed").length;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Provider dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline"><Link to="/profile">My profile</Link></Button>
          <div className="flex items-center gap-2 rounded-full bg-card border border-border/60 px-4 py-2">
            <Switch checked={provider.is_available} onCheckedChange={toggleAvail} />
            <span className="text-sm font-semibold">{provider.is_available ? "Available now" : "Unavailable"}</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Profile completion" value={`${completion}%`} extra={<Progress value={completion} className="mt-2" />} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Active requests" value={active.toString()} />
        <StatCard icon={<Briefcase className="h-5 w-5" />} label="Completed jobs" value={completed.toString()} />
        <StatCard icon={<Star className="h-5 w-5" />} label="Rating" value={`${Number(provider.avg_rating).toFixed(1)} ★`} sub={`${provider.total_reviews} reviews`} />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Portfolio</h2>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={onFile} className="sr-only" disabled={uploading} />
            <span className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Add photo"}
            </span>
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {portfolio.length === 0 ? (
            <Card className="col-span-full p-10 text-center text-muted-foreground border-dashed">
              <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Upload work photos so customers can see your craft.
            </Card>
          ) : portfolio.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-border/60">
              <img src={img.image_url} alt={img.caption ?? ""} className="h-full w-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                aria-label="Delete portfolio post"
                onClick={() => setPortfolioImageToDelete({ id: img.id, image_url: img.image_url })}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <AlertDialog
        open={portfolioImageToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingPortfolioImage) setPortfolioImageToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the post from your portfolio and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPortfolioImage}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingPortfolioImage}
              onClick={(event) => {
                event.preventDefault();
                void deletePortfolioImage();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingPortfolioImage ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Booking requests</h2>
        <div className="mt-4 grid gap-3">
          {requests.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">No requests yet.</Card>
          ) : requests.map((b) => (
            <Card key={b.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {b.service_date}{b.service_time ? ` ${formatTimeWithPeriod(b.service_time)}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">{b.address ?? "—"} • {b.notes ?? ""}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">{b.status}</span>
                {b.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateBookingStatus(b.id, "accepted")}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, "rejected")}>Reject</Button>
                  </>
                )}
                {b.status === "accepted" && (
                  <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, "completed")}>Mark done</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub, extra }: { icon: React.ReactNode; label: string; value: string; sub?: string; extra?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide">{icon} {label}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      {extra}
    </Card>
  );
}
