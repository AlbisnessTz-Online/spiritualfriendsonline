import { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'light' | 'dark' | 'church';
export type AppLang = 'en' | 'sw';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  lang: AppLang;
  setLang: (l: AppLang) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  lang: 'en',
  setLang: () => {},
});

const themeClasses: Record<AppTheme, string> = {
  light: 'theme-light',
  dark: 'theme-dark',
  church: 'theme-church',
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<AppTheme>(
    () => (localStorage.getItem('sf-theme') as AppTheme) || 'light'
  );
  const [lang, setLangState] = useState<AppLang>(
    () => (localStorage.getItem('sf-lang') as AppLang) || 'en'
  );

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    localStorage.setItem('sf-theme', t);
  };

  const setLang = (l: AppLang) => {
    setLangState(l);
    localStorage.setItem('sf-lang', l);
  };

  // Apply theme class to <html> so CSS vars cascade everywhere
  useEffect(() => {
    const root = document.documentElement;
    Object.values(themeClasses).forEach((cls) => root.classList.remove(cls));
    root.classList.add(themeClasses[theme]);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, lang, setLang }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
