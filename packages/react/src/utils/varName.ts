/**
 * Имя переменной из ссылки на неё: `createVar()` отдаёт `var(--имя)`,
 * а ключом инлайн-стиля годится только само имя.
 */
export function varName(ref: string): string {
  return ref.replace(/^var\((--[^,)]+).*$/, '$1');
}
