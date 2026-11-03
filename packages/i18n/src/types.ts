import type { en } from './messages/en.js';

/** Все ключи словаря. Выводятся из английского — он источник истины. */
export type MessageKey = keyof typeof en;

/**
 * Форма словаря для любого языка.
 *
 * Каждый ключ обязан присутствовать и иметь ту же сигнатуру, что в en:
 * строка остаётся строкой, функция — функцией с теми же аргументами.
 * Литеральные типы при этом расширяются до string, иначе перевод
 * не смог бы отличаться от оригинала.
 */
export type Dictionary = {
  [K in MessageKey]: (typeof en)[K] extends (args: infer A) => string ? (args: A) => string : string;
};

/**
 * Аргументы конкретного сообщения. `locale` подставляется автоматически
 * из провайдера, поэтому из публичной сигнатуры он исключён —
 * вызывающий передаёт только смысловые параметры.
 */
export type MessageArgs<K extends MessageKey> = (typeof en)[K] extends (args: infer A) => string
  ? Omit<A, 'locale'>
  : never;

/** Ключи, которым нужны аргументы. */
export type ParameterizedKey = {
  [K in MessageKey]: (typeof en)[K] extends (args: never) => string ? K : never;
}[MessageKey];

/** Ключи-константы без аргументов. */
export type PlainKey = Exclude<MessageKey, ParameterizedKey>;

/** Направление финансовой динамики: где рост зелёный, а где красный. */
export type TrendDirection = 'western' | 'ea';
