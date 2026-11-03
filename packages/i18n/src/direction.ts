import type { TrendDirection } from './types.js';

/**
 * Языки, где на финансовых графиках рост традиционно красный,
 * а падение — зелёное. Обратно к западной конвенции.
 *
 * Это не то же самое, что статусные цвета: сообщение об успехе остаётся
 * зелёным в любой локали. Переворачивается только семантика `trend.*`.
 */
const EA_LANGUAGES = new Set(['zh', 'ja', 'ko']);

/**
 * Определяет конвенцию направления по локали.
 *
 * Значение по умолчанию — приложение всегда может переопределить его явно:
 * терминал международного трейдинга может держать западную конвенцию
 * для всех языков, чтобы трейдеры не путались при переключении.
 */
export function trendDirectionForLocale(locale: string): TrendDirection {
  const language = new Intl.Locale(locale).language;
  return EA_LANGUAGES.has(language) ? 'ea' : 'western';
}

/**
 * Направление письма. Дублирует то, что RAC отдаёт через useLocale, но нужно
 * и вне React — например, чтобы выставить dir на <html> при серверном рендеринге.
 */
export function textDirectionForLocale(locale: string): 'ltr' | 'rtl' {
  const resolved = new Intl.Locale(locale).maximize();
  // getTextInfo — Baseline с 2023 года; textInfo оставлен как запасной путь
  // для сред, где реализована более ранняя редакция предложения.
  const info =
    (resolved as { getTextInfo?: () => { direction: string } }).getTextInfo?.() ??
    (resolved as unknown as { textInfo?: { direction: string } }).textInfo;
  return info?.direction === 'rtl' ? 'rtl' : 'ltr';
}
