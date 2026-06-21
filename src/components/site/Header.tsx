import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";
import { Sparkles, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

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
          <a href="/#how" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("nav.howItWorks")}
          </a>
          <Link to="/onboarding" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("nav.forPros")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
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
            <a href="/#how" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{t("nav.howItWorks")}</a>
            <Link to="/onboarding" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{t("nav.forPros")}</Link>
            {user && <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{t("nav.dashboard")}</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
