import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMode } from "@/hooks/use-mode";
import { Card } from "@/components/ui/card";
import { Briefcase, UserCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/mode")({
  head: () => ({ meta: [{ title: "Choose mode — SkillConnect" }] }),
  component: ModePage,
});

function ModePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { setMode } = useMode();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: providerProfile } = useQuery({
    enabled: !!user,
    queryKey: ["my-provider-exists", user?.id],
    queryFn: async () =>
      (await supabase.from("providers").select("id").eq("id", user!.id).maybeSingle()).data,
  });

  const choose = async (m: "customer" | "provider") => {
    setMode(m);
    if (m === "customer") {
      void navigate({ to: "/dashboard" });
    } else {
      if (providerProfile) void navigate({ to: "/dashboard/provider" });
      else void navigate({ to: "/onboarding" });
    }
  };

  if (loading || !user) {
    return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          How will you use SkillConnect today?
        </h1>
        <p className="mt-3 text-muted-foreground">
          You can switch anytime from the top bar. The same account works for both.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-10">
          <button onClick={() => choose("customer")} className="text-left group">
            <Card className="p-6 h-full hover:border-primary/60 hover:shadow-elegant transition-all">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <UserCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-bold">I'm a Customer</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Find and book trusted local professionals near you.
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
                Continue <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </button>

          <button onClick={() => choose("provider")} className="text-left group">
            <Card className="p-6 h-full hover:border-accent/60 hover:shadow-elegant transition-all">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent-foreground">
                <Briefcase className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-bold">I'm a Service Provider</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {providerProfile
                  ? "Open your provider dashboard and manage bookings."
                  : "Set up your professional profile and start receiving requests."}
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-semibold text-accent-foreground">
                Continue <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Example: A plumber serves customers in provider mode, and switches to customer mode to book an AC mechanic.
        </p>
      </div>
    </div>
  );
}
