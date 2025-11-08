import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../../utils/storage';

type Theme = 'light' | 'dark' | 'auto';

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('auto');

  // Apply theme to HTML element
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      const settings = await getSettings();
      const theme = settings.theme || 'auto';
      setCurrentTheme(theme);
      applyTheme(theme);
    };
    loadTheme();
  }, []);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (currentTheme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('auto');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  // Handle theme change
  const handleThemeChange = async (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);

    const settings = await getSettings();
    settings.theme = theme;
    await saveSettings(settings);
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-[#2d2d2d] rounded-lg p-1 shadow">
      <button
        onClick={() => handleThemeChange('light')}
        className={`px-3 py-1.5 rounded transition-all duration-200 text-sm ${
          currentTheme === 'light'
            ? 'bg-primary text-white'
            : 'text-text-secondary dark:text-[#b0b0b0] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
        }`}
        title="Light theme"
      >
        ☀️
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className={`px-3 py-1.5 rounded transition-all duration-200 text-sm ${
          currentTheme === 'dark'
            ? 'bg-primary text-white'
            : 'text-text-secondary dark:text-[#b0b0b0] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
        }`}
        title="Dark theme"
      >
        🌙
      </button>
      <button
        onClick={() => handleThemeChange('auto')}
        className={`px-3 py-1.5 rounded transition-all duration-200 text-sm ${
          currentTheme === 'auto'
            ? 'bg-primary text-white'
            : 'text-text-secondary dark:text-[#b0b0b0] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
        }`}
        title="Auto (system)"
      >
        💻
      </button>
    </div>
  );
}
