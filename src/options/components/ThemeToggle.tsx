import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../../utils/storage';

type Theme = 'light' | 'dark' | 'auto';

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('auto');

  // Apply theme to HTML element
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    console.log('[ThemeToggle] Applying theme:', theme);
    console.log('[ThemeToggle] Current classes before:', root.className);

    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('[ThemeToggle] Auto mode - system prefers dark:', prefersDark);
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

    console.log('[ThemeToggle] Current classes after:', root.className);
    console.log('[ThemeToggle] Has dark class:', root.classList.contains('dark'));
  };

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      const settings = await getSettings();
      const theme = settings.theme || 'auto';
      console.log('[ThemeToggle] Loaded theme from storage:', theme);
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
    console.log('[ThemeToggle] User clicked theme:', theme);
    setCurrentTheme(theme);
    applyTheme(theme);

    const settings = await getSettings();
    settings.theme = theme;
    await saveSettings(settings);
    console.log('[ThemeToggle] Saved theme to storage:', theme);
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-[#2d2d2d] rounded-lg p-1 shadow">
      <button
        onClick={() => handleThemeChange('light')}
        className={`px-3 py-1.5 rounded transition-all duration-200 ${
          currentTheme === 'light'
            ? 'bg-primary text-white shadow-sm scale-110'
            : 'text-text-secondary dark:text-[#b0b0b0] hover:bg-gray-100 dark:hover:bg-[#3a3a3a] opacity-60'
        }`}
        title="Light theme"
      >
        <span className={currentTheme === 'light' ? 'text-base' : 'text-sm'}>☀️</span>
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className={`px-3 py-1.5 rounded transition-all duration-200 ${
          currentTheme === 'dark'
            ? 'bg-primary text-white shadow-sm scale-110'
            : 'text-text-secondary dark:text-[#b0b0b0] hover:bg-gray-100 dark:hover:bg-[#3a3a3a] opacity-60'
        }`}
        title="Dark theme"
      >
        <span className={currentTheme === 'dark' ? 'text-base' : 'text-sm'}>🌙</span>
      </button>
      <button
        onClick={() => handleThemeChange('auto')}
        className={`px-3 py-1.5 rounded transition-all duration-200 ${
          currentTheme === 'auto'
            ? 'bg-primary text-white shadow-sm scale-110'
            : 'text-text-secondary dark:text-[#b0b0b0] hover:bg-gray-100 dark:hover:bg-[#3a3a3a] opacity-60'
        }`}
        title="Auto (system)"
      >
        <span className={currentTheme === 'auto' ? 'text-base' : 'text-sm'}>💻</span>
      </button>
    </div>
  );
}
