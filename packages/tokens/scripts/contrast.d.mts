/** Типы для contrast.mjs — его импортирует конструктор темы в Storybook. */

export interface ContrastRule {
  /** Семантический токен переднего плана: 'fg.onPrimary'. */
  fg: string;
  /** Семантический токен подложки: 'action.primary.bg'. */
  bg: string;
  /** Порог WCAG: 4.5 для текста, 3 для рамок и крупного текста. */
  min: number;
  note?: string;
}

export declare const CONTRAST_RULES: readonly ContrastRule[];

export declare function parseHex(hex: string): [number, number, number] | null;

export declare function luminance(rgb: readonly number[]): number;

export declare function contrast(a: readonly number[], b: readonly number[]): number;
