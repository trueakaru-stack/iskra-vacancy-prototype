'use client';

import { useMemo } from 'react';
import { DateFormatter } from '@internationalized/date';
import {
  NumberFormatter,
  NumberParser,
  type NumberFormatOptions,
} from '@internationalized/number';
import { useMessages } from './LocaleProvider.js';

// Типы опций берутся из @internationalized, а не из глобального Intl.
// Они шире: включают опции, которых в типах Intl ещё нет (например,
// поведение знака), и совместимы с exactOptionalPropertyTypes.

/**
 * Форматтеры, привязанные к текущей локали.
 *
 * Обёртки из @internationalized кешируют инстансы Intl.* — создание
 * Intl.NumberFormat стоит порядка десятков микросекунд, и в таблице
 * на тысячу строк разница уже заметна.
 *
 * Namespace-объекты Intl тут не используются напрямую ещё и потому,
 * что @internationalized закрывает известные расхождения браузеров
 * (например, поведение отрицательного нуля и группировку в ru-RU).
 */

/** Форматирование дат и времени. */
export function useDateFormatter(options?: Intl.DateTimeFormatOptions): DateFormatter {
  const { locale } = useMessages();
  return useMemo(() => new DateFormatter(locale, options), [locale, JSON.stringify(options)]);
}

/** Форматирование чисел, валют и процентов. */
export function useNumberFormatter(options?: NumberFormatOptions): NumberFormatter {
  const { locale } = useMessages();
  return useMemo(() => new NumberFormatter(locale, options), [locale, JSON.stringify(options)]);
}

/**
 * Разбор чисел, введённых пользователем.
 *
 * Обязателен для полей ввода: в ru-RU разделитель дробной части — запятая,
 * в en-US — точка, а в de-DE точка ещё и разделяет разряды. parseFloat
 * на таком вводе молча возвращает не то число.
 */
export function useNumberParser(options?: NumberFormatOptions): NumberParser {
  const { locale } = useMessages();
  return useMemo(() => new NumberParser(locale, options), [locale, JSON.stringify(options)]);
}

/**
 * Относительное время: «3 минуты назад», «через 2 дня».
 *
 * Единица выбирается автоматически по величине интервала.
 */
export function useRelativeTimeFormatter(options?: Intl.RelativeTimeFormatOptions) {
  const { locale } = useMessages();

  return useMemo(() => {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', ...options });
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ['year', 31_536_000_000],
      ['month', 2_592_000_000],
      ['week', 604_800_000],
      ['day', 86_400_000],
      ['hour', 3_600_000],
      ['minute', 60_000],
      ['second', 1000],
    ];

    return (from: Date, to: Date = new Date()): string => {
      const deltaMs = from.getTime() - to.getTime();
      for (const [unit, ms] of units) {
        if (Math.abs(deltaMs) >= ms) {
          return formatter.format(Math.round(deltaMs / ms), unit);
        }
      }
      return formatter.format(0, 'second');
    };
  }, [locale, JSON.stringify(options)]);
}
