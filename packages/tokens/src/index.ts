/**
 * @neobook/tokens — публичная точка входа.
 *
 * Что откуда брать:
 *
 *   import { vars } from '@neobook/tokens/contract'   ← в стилях компонентов (.css.ts)
 *   import '@neobook/tokens/tokens.css'               ← один раз в приложении
 *   import { chartPalette } from '@neobook/tokens'    ← там, где нужен литерал (canvas, SVG)
 */

export { tokenValues, chartPalette, themeValues } from './values.js';
export type { ThemeName, Direction } from './values.js';

/** Значение атрибута `data-theme` на корневом элементе. */
export const THEME_ATTRIBUTE = 'data-theme' as const;

/** Значение атрибута `data-direction`. Отсутствие атрибута = западная конвенция. */
export const DIRECTION_ATTRIBUTE = 'data-direction' as const;
