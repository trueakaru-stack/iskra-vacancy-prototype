'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useMessages, type TrendDirection } from '@neobook/i18n';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'neobook-theme';

interface ThemeContextValue {
  /** Что выбрал пользователь, включая `system`. */
  preference: ThemePreference;
  /** Что реально применено. `system` уже разрешён в light или dark. */
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** @default 'system' */
  defaultPreference?: ThemePreference;
  /**
   * `global` — атрибуты ставятся на <html>, тема действует на порталы
   * (модалки, тултипы), которые рендерятся вне поддерева React.
   * `local` — атрибуты на обёртке. Нужен для вложенных тем: тёмная карточка
   * на светлой странице.
   *
   * @default 'global'
   */
  scope?: 'global' | 'local';
  /** Конвенция направления финансовой динамики. Прокидывается в data-direction. */
  trendDirection?: TrendDirection;
  /** Запоминать выбор в localStorage. @default true при scope='global' */
  persist?: boolean;
  children: ReactNode;
}

/**
 * Скрипт для вставки в <head> ДО первой отрисовки.
 *
 * Без него страница с тёмной темой на долю секунды показывается светлой:
 * сервер не знает предпочтений пользователя, а React применит тему только
 * после гидрации. Этот скрипт выполняется синхронно до первого кадра.
 *
 * Next.js App Router:
 *   <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
 * в app/layout.tsx внутри <head>.
 */
export const themeInitScript = `
(function(){try{
  var s=localStorage.getItem('${STORAGE_KEY}');
  var t=(!s||s==='system')?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s;
  document.documentElement.setAttribute('data-theme',t);
}catch(e){}})();
`.trim();

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Управление темой.
 *
 * Тема — это только два data-атрибута на элементе; никакого контекста
 * в стилях нет. Поэтому переключение не вызывает перерисовки поддерева
 * React: браузер пересчитывает CSS-переменные сам, что на плотных
 * интерфейсах с тысячами узлов разница на порядок.
 */
export function ThemeProvider({
  defaultPreference = 'system',
  scope = 'global',
  trendDirection,
  persist = scope === 'global',
  children,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(defaultPreference);
  // На сервере системную тему знать неоткуда, поэтому стартуем со светлой
  // и синхронизируемся сразу после монтирования. До гидрации правильную
  // тему уже поставил themeInitScript, так что мигания не будет.
  const [systemResolved, setSystemResolved] = useState<ResolvedTheme>('light');

  useEffect(() => {
    if (!persist) return;
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (stored) setPreferenceState(stored);
  }, [persist]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemResolved(query.matches ? 'dark' : 'light');
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const theme: ResolvedTheme = preference === 'system' ? systemResolved : preference;

  // direction приходит из локали через React Aria. Логические CSS-свойства
  // в компонентах опираются именно на него — без dir на корне документа
  // весь пакет молча остаётся LTR, и на арабском интерфейс разъезжается.
  const { direction, locale } = useMessages();

  useEffect(() => {
    if (scope !== 'global') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('dir', direction);
    // lang нужен не меньше dir: по нему браузер выбирает правила переноса слов,
    // начертания шрифта для CJK и язык синтеза речи у скринридера. Без него
    // русский текст может читаться английским голосом.
    root.setAttribute('lang', locale);
    if (trendDirection === 'ea') root.setAttribute('data-direction', 'ea');
    else root.removeAttribute('data-direction');
  }, [scope, theme, direction, locale, trendDirection]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      theme,
      setPreference: (next) => {
        setPreferenceState(next);
        if (persist) localStorage.setItem(STORAGE_KEY, next);
      },
    }),
    [preference, theme, persist],
  );

  const content =
    scope === 'local' ? (
      <div
        data-theme={theme}
        dir={direction}
        lang={locale}
        {...(trendDirection === 'ea' ? { 'data-direction': 'ea' } : {})}
      >
        {children}
      </div>
    ) : (
      children
    );

  return <ThemeContext.Provider value={value}>{content}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme должен вызываться внутри <NeoBookProvider> или <ThemeProvider>');
  }
  return ctx;
}

export { systemTheme };
