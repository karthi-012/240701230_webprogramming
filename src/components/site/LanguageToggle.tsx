import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const next = i18n.language?.startsWith("ta") ? "en" : "ta";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => i18n.changeLanguage(next)}
      className="gap-1.5 font-medium"
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs uppercase tracking-wide">{next === "ta" ? "தமிழ்" : "EN"}</span>
    </Button>
  );
}
