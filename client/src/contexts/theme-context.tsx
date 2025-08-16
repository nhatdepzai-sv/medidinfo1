
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    gradient: string;
  };
}

const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default Blue',
    colors: {
      primary: '#2563eb',
      secondary: '#1e40af',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      textSecondary: '#6b7280',
      accent: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'from-blue-600 to-blue-700'
    }
  },
  {
    id: 'pokemon-scarlet',
    name: 'Pokemon Scarlet',
    colors: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      background: '#fef2f2',
      surface: '#fee2e2',
      text: '#7f1d1d',
      textSecondary: '#991b1b',
      accent: '#f87171',
      success: '#16a34a',
      warning: '#eab308',
      error: '#dc2626',
      gradient: 'from-red-600 to-orange-600'
    }
  },
  {
    id: 'pokemon-violet',
    name: 'Pokemon Violet',
    colors: {
      primary: '#7c3aed',
      secondary: '#6d28d9',
      background: '#faf5ff',
      surface: '#f3e8ff',
      text: '#581c87',
      textSecondary: '#7c2d12',
      accent: '#a855f7',
      success: '#16a34a',
      warning: '#eab308',
      error: '#dc2626',
      gradient: 'from-violet-600 to-purple-600'
    }
  },
  {
    id: 'pokemon-legends',
    name: 'Pokemon Legends',
    colors: {
      primary: '#059669',
      secondary: '#047857',
      background: '#f0fdf4',
      surface: '#dcfce7',
      text: '#14532d',
      textSecondary: '#166534',
      accent: '#34d399',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'from-emerald-600 to-teal-600'
    }
  },
  {
    id: 'pokemon-crystal',
    name: 'Pokemon Crystal',
    colors: {
      primary: '#0891b2',
      secondary: '#0e7490',
      background: '#f0f9ff',
      surface: '#e0f2fe',
      text: '#164e63',
      textSecondary: '#0369a1',
      accent: '#38bdf8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'from-cyan-600 to-blue-600'
    }
  },
  {
    id: 'pokemon-gold',
    name: 'Pokemon Gold',
    colors: {
      primary: '#d97706',
      secondary: '#b45309',
      background: '#fffbeb',
      surface: '#fef3c7',
      text: '#92400e',
      textSecondary: '#a16207',
      accent: '#fbbf24',
      success: '#16a34a',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'from-amber-600 to-yellow-600'
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  themes: Theme[];
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('drugscan-theme');
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('drugscan-theme', themeId);
    }
  };

  useEffect(() => {
    // Apply CSS custom properties
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themes, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
