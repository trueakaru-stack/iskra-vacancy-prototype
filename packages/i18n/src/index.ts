export { LocaleProvider, useMessages, bundledDictionaries } from './LocaleProvider.js';
export type { LocaleProviderProps, Translate, BundledLocale } from './LocaleProvider.js';

export {
  useDateFormatter,
  useNumberFormatter,
  useNumberParser,
  useRelativeTimeFormatter,
} from './formatters.js';
// Тип опций useNumberFormatter — чтобы компоненты могли объявлять свои
// пропсы форматирования тем же типом, не подключая @internationalized напрямую.
export type { NumberFormatOptions } from '@internationalized/number';

export { plural, ordinal } from './plural.js';
export type { PluralForms } from './plural.js';

export { trendDirectionForLocale, textDirectionForLocale } from './direction.js';

export { en } from './messages/en.js';
export { ru } from './messages/ru.js';

export type {
  Dictionary,
  MessageKey,
  MessageArgs,
  PlainKey,
  ParameterizedKey,
  TrendDirection,
} from './types.js';
