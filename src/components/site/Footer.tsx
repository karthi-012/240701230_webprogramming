import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/60 bg-surface mt-16">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>{t("brand")}</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">{t("tagline")}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{t("footer.about")}</li>
            <li>{t("footer.contact")}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{t("footer.privacy")}</li>
            <li>{t("footer.terms")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} SkillConnect. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
