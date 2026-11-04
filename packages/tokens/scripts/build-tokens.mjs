/** Генерация используемых токенов светлого интерфейса из исходных JSON. */
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CONTRAST_RULES, parseHex, contrast } from './contrast.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', 'src');
const assets = join(here, '..', 'generated');
const header = '/* Сгенерировано из packages/tokens/src/. Не редактировать вручную. */\n';
const kebab = value => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const cssName = path => ['nb', ...path.map(kebab)].join('-');

function flatten(node, path = [], out = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if ('$value' in value) out.push({ path: [...path, key], value: value.$value });
    else flatten(value, [...path, key], out);
  }
  return out;
}

async function readPrimitives() {
  const result = [];
  for (const name of (await readdir(join(src, 'primitive'))).sort()) {
    if (name.endsWith('.json')) flatten(JSON.parse(await readFile(join(src, 'primitive', name), 'utf8')), [], result);
  }
  return result;
}

function resolve(value, lookup, seen = new Set()) {
  return String(value).replace(/\{([^}]+)\}/g, (_, key) => {
    if (seen.has(key)) throw new Error('Циклическая ссылка: ' + key);
    if (!lookup.has(key)) throw new Error('Неизвестный токен: ' + key);
    return resolve(lookup.get(key), lookup, new Set([...seen, key]));
  });
}

function cssBlock(selector, tokens) {
  return `${selector} {\n${tokens.map(({ path, value }) => `  --${cssName(path)}: ${String(value).replace(/\{([^}]+)\}/g, (_, key) => `var(--${cssName(key.split('.'))})`)};`).join('\n')}\n}\n`;
}

function contract(tokens) {
  const tree = {};
  for (const { path } of tokens) {
    let node = tree;
    for (const key of path.slice(0, -1)) node = node[key] ??= {};
    node[path.at(-1)] = cssName(path);
  }
  return tree;
}

async function main() {
  const primitives = await readPrimitives();
  const light = flatten(JSON.parse(await readFile(join(src, 'semantic', 'light.json'), 'utf8')));
  const tokens = [...primitives, ...light];
  const lookup = new Map(tokens.map(token => [token.path.join('.'), token.value]));
  const literals = new Map(tokens.map(token => [token.path.join('.'), resolve(token.value, lookup)]));
  const rules = CONTRAST_RULES.filter(rule => literals.has(rule.fg) && literals.has(rule.bg));
  let warnings = 0;
  for (const rule of rules) {
    const fg = parseHex(literals.get(rule.fg)), bg = parseHex(literals.get(rule.bg));
    if (!fg || !bg) continue;
    const ratio = contrast(fg, bg);
    if (ratio < rule.min) {
      warnings++;
      console.warn(`${rule.fg} / ${rule.bg}: ${ratio.toFixed(2)}:1, требуется ${rule.min}:1`);
    }
  }
  if (warnings && process.argv.includes('--strict')) throw new Error('Нарушения контраста: ' + warnings);
  await mkdir(assets, { recursive: true });
  await writeFile(join(assets, 'tokens.css'), header + cssBlock(':root', primitives) + cssBlock(":root, [data-theme='light']", light) + ':root { color-scheme: light; }\n');
  await writeFile(join(src, 'contract.css.ts'), header + `import { createGlobalThemeContract } from '@vanilla-extract/css';\nexport const vars = createGlobalThemeContract(${JSON.stringify(contract(tokens), null, 2)}, value => value as string);\nexport type Vars = typeof vars;\n`);
  const runtimeKeys = ['space.2', 'popover.maxHeight', 'controlHeight.md'];
  await writeFile(join(src, 'values.ts'), header + `export const tokenValues = ${JSON.stringify(Object.fromEntries(runtimeKeys.map(key => [key, literals.get(key)])), null, 2)} as const;\n`);
  await rm(join(assets, 'tokens.json'), { force: true });
  console.log(`Токены: ${primitives.length} базовых, ${light.length} семантических; светлая тема. Предупреждений контраста: ${warnings}.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
