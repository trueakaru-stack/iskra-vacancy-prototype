/**
 * Плюрализация через Intl.PluralRules.
 *
 * Наивное `count === 1 ? 'элемент' : 'элементы'` работает только в английском.
 * В русском четыре формы (1 файл / 2 файла / 5 файлов / 1.5 файла), в польском
 * и арабском — свои наборы. Intl.PluralRules знает правила для всех локалей,
 * и это единственный корректный способ.
 */

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>>;

const cache = new Map<string, Intl.PluralRules>();

function rulesFor(locale: string, type: Intl.PluralRuleType): Intl.PluralRules {
  const key = `${locale}:${type}`;
  let rules = cache.get(key);
  if (!rules) {
    rules = new Intl.PluralRules(locale, { type });
    cache.set(key, rules);
  }
  return rules;
}

/**
 * Выбирает форму слова по количеству.
 *
 *   plural('ru-RU', 5, { one: 'файл', few: 'файла', many: 'файлов' })  → 'файлов'
 *   plural('en-US', 5, { one: 'file', other: 'files' })                → 'files'
 *
 * `other` обязателен — это форма по умолчанию во всех локалях. Если нужная
 * категория не описана, откатываемся на неё, а не падаем: недостающая форма
 * в переводе не должна ронять интерфейс.
 */
export function plural(
  locale: string,
  count: number,
  forms: PluralForms & { other: string },
  type: Intl.PluralRuleType = 'cardinal',
): string {
  const category = rulesFor(locale, type).select(count);
  return forms[category] ?? forms.other;
}

/** Порядковые числительные: 1st / 2nd / 3rd, 1-й / 2-й. */
export function ordinal(locale: string, count: number, forms: PluralForms & { other: string }): string {
  return plural(locale, count, forms, 'ordinal');
}
