'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
}>({ theme: 'light', isDark: false, setTheme: () => {} });

function applyThemeToDOM(theme: Theme) {
  const html = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = theme === 'dark' || (theme === 'system' && systemDark);
  
  console.log('Applying theme:', theme, 'shouldBeDark:', shouldBeDark);
  
  if (shouldBeDark) {
    html.classList.add('dark');
    html.style.colorScheme = 'dark';
  } else {
    html.classList.remove('dark');
    html.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('kf-theme') as Theme) || 'light';
    console.log('ThemeProvider mounted, saved theme:', saved);
    setThemeState(saved);
    applyThemeToDOM(saved);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(saved === 'dark' || (saved === 'system' && systemDark));
    setMounted(true);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    console.log('setTheme called with:', newTheme);
    localStorage.setItem('kf-theme', newTheme);
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(newTheme === 'dark' || (newTheme === 'system' && systemDark));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
