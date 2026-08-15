import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  primaryColor: string;
  fontSize: number;
  borderRadius: number;
  density: "compact" | "comfortable";
  currency: "ILS" | "USD";
  darkMode: boolean;
  language: string;
  setPrimaryColor: (c: string) => void;
  setFontSize: (s: number) => void;
  setBorderRadius: (r: number) => void;
  setDensity: (d: "compact" | "comfortable") => void;
  setCurrency: (c: "ILS" | "USD") => void;
  setDarkMode: (v: boolean) => void;
  setLanguage: (l: string) => void;
  applyToRoot: () => void;
  reset: () => void;
}

const DEFAULTS = {
  primaryColor: "#C8102E",
  fontSize: 14,
  borderRadius: 8,
  density: "comfortable" as const,
  currency: "ILS" as const,
  darkMode: false,
  language: "en",
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setPrimaryColor: (primaryColor) => { set({ primaryColor }); get().applyToRoot(); },
      setFontSize: (fontSize) => { set({ fontSize }); get().applyToRoot(); },
      setBorderRadius: (borderRadius) => { set({ borderRadius }); get().applyToRoot(); },
      setDensity: (density) => { set({ density }); get().applyToRoot(); },
      setCurrency: (currency) => set({ currency }),
      setDarkMode: (darkMode) => { set({ darkMode }); get().applyToRoot(); },
      setLanguage: (language) => set({ language }),
      applyToRoot: () => {
        const { primaryColor, fontSize, borderRadius, density, darkMode } = get();
        const root = document.documentElement;
        root.style.setProperty("--primary", primaryColor);
        root.style.setProperty("--ring", primaryColor);
        root.style.setProperty("--font-size-base", `${fontSize}px`);
        root.style.setProperty("--radius", `${borderRadius / 16}rem`);
        root.setAttribute("data-density", density);
        root.classList.toggle("dark", darkMode);
      },
      reset: () => { set(DEFAULTS); get().applyToRoot(); },
    }),
    { name: "rc-hms-theme" },
  ),
);
