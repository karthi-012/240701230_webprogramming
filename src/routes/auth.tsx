import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — SkillConnect" }] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
});

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName: mode === "signup" ? fullName : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/mode`,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
        void navigate({ to: "/mode" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        void navigate({ to: "/mode" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/mode` });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
    if (!result.redirected && !result.error) void navigate({ to: "/mode" });
    setLoading(false);
  };


  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="max-w-md mx-auto">
        <Link to="/" className="flex items-center justify-center gap-2 font-extrabold text-xl mb-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <Sparkles className="h-5 w-5" />
          </span>
          {t("brand")}
        </Link>
        <Card className="p-6 md:p-8 shadow-elegant border-border/60">
          <h1 className="text-2xl font-extrabold tracking-tight text-center">{t("auth.title")}</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">{t("auth.subtitle")}</p>

          <Button
            type="button" onClick={google} disabled={loading}
            variant="outline" className="w-full mt-6 h-11 font-semibold"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1.1 2.5-2.3 3.3v2.7h3.7c2.2-2 3.2-4.9 3.2-8z"/><path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 20.4 7.5 23 12 23z"/><path fill="#FBBC05" d="M5.6 13.8c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V6.6H1.8C1 8.2.5 10 .5 12s.5 3.8 1.3 5.4l3.8-3z"/><path fill="#EA4335" d="M12 4.9c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.4 15.1.5 12 .5 7.5.5 3.7 3.1 1.8 6.6l3.8 3C6.5 6.9 9 4.9 12 4.9z"/></svg>
            {t("auth.continueGoogle")}
          </Button>

          <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> {t("auth.or")} <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5 h-11" />
              </div>
            )}
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" required />
            </div>
            <div>
              <Label htmlFor="pwd">{t("auth.password")}</Label>
              <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-hero text-primary-foreground hover:opacity-90 font-semibold">
              {mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-semibold hover:underline">
              {mode === "signin" ? t("auth.signUp") : t("auth.signIn")}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
