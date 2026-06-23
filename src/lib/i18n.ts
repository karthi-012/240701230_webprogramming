import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { ta } from "./locales/ta";

const isBrowser = typeof window !== "undefined";

function detectInitialLang(): string {
  if (!isBrowser) return "en";
  try {
    const stored = window.localStorage.getItem("sc_lang");
    if (stored === "en" || stored === "ta") return stored;
  } catch {
    // ignore
  }
  const nav = window.navigator?.language?.toLowerCase() ?? "en";
  if (nav.startsWith("ta")) return "ta";
  return "en";
}

if (!i18n.isInitialized) {
  // Initialize synchronously so SSR + first client render have translations
  // available immediately (avoids flashing raw keys like "nav.signIn").
  i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, ta: { translation: ta } },
    lng: detectInitialLang(),
    fallbackLng: "en",
    supportedLngs: ["en", "ta"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    initImmediate: false,
  });

  if (isBrowser) {
    i18n.on("languageChanged", (lng) => {
      try {
        window.localStorage.setItem("sc_lang", lng);
      } catch {
        // ignore
      }
    });
  }
}

export default i18n;
