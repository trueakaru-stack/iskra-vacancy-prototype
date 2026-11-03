'use client';

import type { ReactNode } from 'react';
import { LocaleProvider, trendDirectionForLocale, type LocaleProviderProps } from '@neobook/i18n';
import { ThemeProvider, type ThemeProviderProps } from './ThemeProvider.js';

export interface NeoBookProviderProps
  extends Pick<LocaleProviderProps, 'locale' | 'messages'>,
    Pick<ThemeProviderProps, 'defaultPreference' | 'scope' | 'persist' | 'trendDirection'> {
  children: ReactNode;
}

/**
 * Единая точка подключения дизайн-системы.
 *
 * Ставится один раз в корне приложения:
 *
 *   import '@neobook/tokens/tokens.css';
 *   import '@neobook/react/styles.css';
 *
 *   <NeoBookProvider locale="ru-RU">
 *     <App />
 *   </NeoBookProvider>
 *
 * Внутри — два независимых слоя, которые при необходимости можно
 * использовать по отдельности: LocaleProvider (язык, форматирование,
 * направление письма) и ThemeProvider (тема, конвенция динамики).
 *
 * Порядок вложения важен: конвенция направления по умолчанию выводится
 * из локали, поэтому LocaleProvider обязан быть снаружи.
 */
export function NeoBookProvider({
  locale,
  messages,
  defaultPreference,
  scope,
  persist,
  trendDirection,
  children,
}: NeoBookProviderProps) {
  const resolvedTrend =
    trendDirection ?? (locale ? trendDirectionForLocale(locale) : 'western');

  return (
    <LocaleProvider
      {...(locale !== undefined ? { locale } : {})}
      {...(messages !== undefined ? { messages } : {})}
      trendDirection={resolvedTrend}
    >
      <ThemeProvider
        {...(defaultPreference !== undefined ? { defaultPreference } : {})}
        {...(scope !== undefined ? { scope } : {})}
        {...(persist !== undefined ? { persist } : {})}
        trendDirection={resolvedTrend}
      >
        {children}
      </ThemeProvider>
    </LocaleProvider>
  );
}
