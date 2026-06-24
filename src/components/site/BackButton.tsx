import { useRouter, useLocation } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  const { pathname } = useLocation();

  // Hide on home page
  if (pathname === "/") return null;

  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      void router.navigate({ to: "/" });
    }
  };

  return (
    <div className="container mx-auto px-4 pt-4">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
    </div>
  );
}
