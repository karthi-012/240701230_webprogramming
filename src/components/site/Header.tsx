import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useMode } from "@/hooks/use-mode";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationsBell } from "./NotificationsBell";
import { Sparkles, Menu, UserCircle, Briefcase, ArrowLeftRight } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { mode, setMode, clearMode } = useMode();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const switchMode = () => {
    const next = mode === "provider" ? "customer" : "provider";
    setMode(next);
    void navigate({ to: next === "provider" ? "/dashboard/provider" : "/dashboard" });
  };

  const handleSignOut = async () => {
    clearMode();
    await signOut();
    void navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="tracking-tight">{t("brand")}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/browse" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("nav.browse")}
          </Link>
          {mode !== "customer" && (
            <>
              <a href="/#how" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.howItWorks")}
              </a>
              <Link to="/onboarding" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.forPros")}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user && mode && (
            <button
              onClick={switchMode}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold hover:bg-accent/10 transition-colors"
              title="Switch mode"
            >
              {mode === "provider" ? <Briefcase className="h-3.5 w-3.5" /> : <UserCircle className="h-3.5 w-3.5" />}
              <span className="capitalize">{mode}</span>
              <ArrowLeftRight className="h-3 w-3 opacity-60" />
            </button>
          )}
          <LanguageToggle />
          {user && <NotificationsBell />}
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to={mode === "provider" ? "/dashboard/provider" : "/dashboard"}>
                  {t("nav.dashboard")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-soft">
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            <Link to="/browse" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{t("nav.browse")}</Link>
            {mode !== "customer" && (
              <>
                <a href="/#how" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{t("nav.howItWorks")}</a>
                <Link to="/onboarding" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{t("nav.forPros")}</Link>
              </>
            )}
            {user && (
              <>
                <Link
                  to={mode === "provider" ? "/dashboard/provider" : "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm font-medium"
                >
                  {t("nav.dashboard")}
                </Link>
                {mode && (
                  <button
                    onClick={() => { switchMode(); setOpen(false); }}
                    className="flex items-center gap-2 py-2 text-sm font-medium text-left"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Switch to {mode === "provider" ? "Customer" : "Provider"}
                  </button>
                )}
                <Link to="/mode" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-muted-foreground">
                  Choose mode…
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
