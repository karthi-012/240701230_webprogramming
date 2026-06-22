import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppMode = "customer" | "provider";

type ModeState = {
  mode: AppMode | null;
  setMode: (m: AppMode) => void;
  clearMode: () => void;
};

const ModeContext = createContext<ModeState | undefined>(undefined);
const STORAGE_KEY = "skillconnect.mode";

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "customer" || v === "provider") setModeState(v);
    } catch {}
  }, []);

  const setMode = (m: AppMode) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch {}
  };
  const clearMode = () => {
    setModeState(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, clearMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
