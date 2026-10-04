import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || "";
const STORAGE_KEY = "rbstars_site_modes";

export interface SiteModes {
  halloween: boolean;
}

interface SiteModeValue {
  modes: SiteModes;
  loading: boolean;
  /** localOnly = backend unreachable, value only applies to this browser */
  localOnly: boolean;
  setModes: (modes: SiteModes) => void;
}

const DEFAULT_MODES: SiteModes = { halloween: false };

const SiteModeContext = createContext<SiteModeValue>({
  modes: DEFAULT_MODES,
  loading: true,
  localOnly: false,
  setModes: () => {},
});

function readStored(): SiteModes | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.halloween === "boolean") return { halloween: parsed.halloween };
  } catch { /* ignore */ }
  return null;
}

function writeStored(modes: SiteModes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(modes)); } catch { /* ignore */ }
}

export function SiteModeProvider({ children }: { children: ReactNode }) {
  const [modes, setModesState] = useState<SiteModes>(
    () => readStored() || DEFAULT_MODES
  );
  const [loading, setLoading] = useState(true);
  const [localOnly, setLocalOnly] = useState(false);

  const setModes = (next: SiteModes) => {
    setModesState(next);
    writeStored(next);
  };

  useEffect(() => {
    let alive = true;
    fetch(`${BACKEND}/api/site-modes`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!alive || !json?.data) return;
        const next: SiteModes = { halloween: !!json.data.halloween };
        setModesState(next);
        writeStored(next);
        setLocalOnly(false);
      })
      .catch(() => {
        // Backend offline (or endpoint not deployed yet) — keep whatever we have.
        if (alive) setLocalOnly(true);
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  return (
    <SiteModeContext.Provider value={{ modes, loading, localOnly, setModes }}>
      {children}
    </SiteModeContext.Provider>
  );
}

export function useSiteModes() {
  return useContext(SiteModeContext);
}
