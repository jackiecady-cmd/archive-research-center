/**
 * Concierge profile context — shares the completed Concierge wizard
 * result across the app (e.g. Archive Search suggestions).
 *
 * Persisted in sessionStorage so navigation within the tab preserves it.
 * Cleared when the user clicks Start Over in the Concierge.
 */
import { createContext, useContext, useState, ReactNode } from "react";

const PROFILE_KEY = "arc_concierge_profile_v1";

export type ConciergeProfile = {
  researcherType: string;   // API id: "beginner", "genealogist", …
  researcherLabel: string;  // Human-readable name from the path record
  experience: "beginner" | "intermediate" | "advanced";
};

type ContextValue = {
  profile: ConciergeProfile | null;
  setProfile: (p: ConciergeProfile) => void;
  clearProfile: () => void;
};

const ConciergeProfileContext = createContext<ContextValue>({
  profile: null,
  setProfile: () => {},
  clearProfile: () => {},
});

export function ConciergeProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ConciergeProfile | null>(() => {
    try {
      const raw = sessionStorage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as ConciergeProfile) : null;
    } catch {
      return null;
    }
  });

  const setProfile = (p: ConciergeProfile) => {
    setProfileState(p);
    try {
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch { /* quota or private mode — silent */ }
  };

  const clearProfile = () => {
    setProfileState(null);
    try { sessionStorage.removeItem(PROFILE_KEY); } catch {}
  };

  return (
    <ConciergeProfileContext.Provider value={{ profile, setProfile, clearProfile }}>
      {children}
    </ConciergeProfileContext.Provider>
  );
}

/** Hook — use anywhere in the app to read or write the concierge profile. */
export function useConciergeProfile() {
  return useContext(ConciergeProfileContext);
}
