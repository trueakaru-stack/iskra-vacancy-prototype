'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { I18nProvider as RACI18nProvider, useLocale } from 'react-aria-components';
import { en } from './messages/en.js';
import { ru } from './messages/ru.js';
import { trendDirectionForLocale } from './direction.js';
import type { Dictionary, MessageArgs, MessageKey, PlainKey, ParameterizedKey, TrendDirection } from './types.js';

/** Словари, поставляемые вместе с дизайн-системой. */
export const bundledDictionaries = {
  en: en as unknown as Dictionary,
  ru,
} satisfies Record<string, Dictionary>;

export type BundledLocale = keyof typeof bundledDictionaries;

interface LocaleContextValue {
  locale: string;
  dictionary: Dictionary;
  trendDirection: TrendDirection;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps {
  /** BCP-47, например `ru-RU`. По умолчанию берётся из настроек браузера. */
  locale?: string;
  /**
   * Точечная замена строк дизайн-системы. Нужна редко — например, когда
   * в корпоративном контуре принята своя терминология. Мержится поверх
   * словаря языка, поэтому переопределять весь словарь не требуется.
   */
  messages?: Partial<Dictionary>;
  /**
   * Конвенция направления финансовой динамики. По умолчанию выводится
   * из локали: zh/ja/ko → `ea`. Задавайте явно, если приложение должно
   * держать одну конвенцию независимо от языка интерфейса.
   */
  trendDirection?: TrendDirection;
  children: ReactNode;
}

/**
 * Локализация дизайн-системы.
 *
 * Оборачивает RACI18nProvider из React Aria — тот отвечает за собственные строки
 * RAC (месяцы календаря, подписи слайдера) и за направление письма, а мы
 * добавляем поверх словарь наших компонентов.
 *
 * Ставится один раз в корне приложения. Компоненты NeoBook без него работают,
 * но откатываются на английский, поэтому в проде провайдер обязателен.
 */
export function LocaleProvider({ locale, messages, trendDirection, children }: LocaleProviderProps) {
  const resolved = locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

  const value = useMemo<LocaleContextValue>(() => {
    const language = new Intl.Locale(resolved).language;
    const base =
      bundledDictionaries[language as BundledLocale] ?? bundledDictionaries.en;
    return {
      locale: resolved,
      dictionary: messages ? { ...base, ...messages } : base,
      trendDirection: trendDirection ?? trendDirectionForLocale(resolved),
    };
  }, [resolved, messages, trendDirection]);

  return (
    <RACI18nProvider locale={resolved}>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </RACI18nProvider>
  );
}

/** Функция перевода. Аргументы и их наличие проверяются компилятором. */
export interface Translate {
  (key: PlainKey): string;
  <K extends ParameterizedKey>(key: K, args: MessageArgs<K>): string;
}

interface UseMessagesResult {
  t: Translate;
  locale: string;
  /** `rtl` для арабского, иврита, фарси. Приходит из React Aria. */
  direction: 'ltr' | 'rtl';
  trendDirection: TrendDirection;
}

/**
 * Доступ к строкам дизайн-системы.
 *
 *   const { t } = useMessages();
 *   t('field.clear')                              // 'Очистить поле'
 *   t('select.selectedCount', { count: 5 })       // 'Выбрано 5 элементов'
 *
 * `locale` в аргументы подставляется автоматически — вызывающему
 * не нужно знать, что плюрализация вообще от неё зависит.
 */
export function useMessages(): UseMessagesResult {
  const ctx = useContext(LocaleContext);
  const racLocale = useLocale();

  const locale = ctx?.locale ?? racLocale.locale;
  const dictionary = ctx?.dictionary ?? (en as unknown as Dictionary);

  const t = useMemo<Translate>(() => {
    return ((key: MessageKey, args?: Record<string, unknown>) => {
      const entry = dictionary[key];
      if (typeof entry === 'function') {
        return (entry as (a: Record<string, unknown>) => string)({ ...args, locale });
      }
      return entry;
    }) as Translate;
  }, [dictionary, locale]);

  return {
    t,
    locale,
    direction: racLocale.direction,
    trendDirection: ctx?.trendDirection ?? 'western',
  };
}
