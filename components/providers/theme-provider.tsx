"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "apsys-theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const guardado = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (guardado === "light" || guardado === "dark") {
        return guardado;
      }
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return defaultTheme;
  });

  const aplicarTemaEnDOM = useCallback((nuevoTema: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (nuevoTema === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    }
  }, []);

  useEffect(() => {
    aplicarTemaEnDOM(theme);
  }, [theme, aplicarTemaEnDOM]);

  const setTheme = useCallback(
    (nuevoTema: Theme) => {
      setThemeState(nuevoTema);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, nuevoTema);
      }
      aplicarTemaEnDOM(nuevoTema);
    },
    [aplicarTemaEnDOM],
  );

  const toggleTheme = useCallback(() => {
    const siguiente: Theme = theme === "dark" ? "light" : "dark";
    setTheme(siguiente);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const DEFAULT_THEME_CONTEXT: ThemeContextType = {
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context ?? DEFAULT_THEME_CONTEXT;
}
