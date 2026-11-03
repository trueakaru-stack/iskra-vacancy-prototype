/**
 * Генератор токенов NeoBook.
 *
 * Источник истины — DTCG-JSON в src/. Отсюда порождается ВСЁ:
 *
 *   generated/tokens.css   публичный контракт темизации (:root, [data-theme], [data-direction])
 *   generated/tokens.json  плоская карта для не-JS потребителей (вёрстка писем, мобилки)
 *   src/contract.css.ts    типизированный доступ к тем же переменным для vanilla-extract
 *   src/values.ts          разрешённые литералы для JS (графики, canvas, экспорт в PNG)
 *
 * Руками эти файлы не редактируются — они в .gitignore.
 *
 * Формат JSON намеренно оставлен DTCG-совместимым: если позже понадобятся
 * выходы в iOS/Android/Figma, поверх встаёт Style Dictionary без переписывания источника.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CONTRAST_RULES, parseHex, contrast } from './contrast.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'src');

/** CSS и JSON — самостоятельные ассеты, версионируются как есть. */
const ASSETS = join(here, '..', 'generated');

/**
 * TypeScript кладём в src/, а не в отдельную папку: тогда у пакета один
 * rootDir, и раскладка dist/ от tsc совпадает с раскладкой от Vite.
 * Файлы помечены заголовком и лежат в .gitignore.
 */
const TS_OUT = SRC;

/** Префикс всех CSS-переменных. Защищает от коллизий с переменными потребляющего приложения. */
const PREFIX = 'nb';

// ---------------------------------------------------------------------------
// Утилиты
// ---------------------------------------------------------------------------

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** ['action','primary','bgHover'] → 'nb-action-primary-bg-hover' */
const cssName = (path) => [PREFIX, ...path.map(kebab)].join('-');

/** ['action','primary','bgHover'] → 'var(--nb-action-primary-bg-hover)' */
const cssVar = (path) => `var(--${cssName(path)})`;

/**
 * Разворачивает вложенный DTCG-объект в плоский список токенов.
 * Ключи, начинающиеся с `$`, — метаданные, не токены.
 */
function flatten(node, path = [], out = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (value && typeof value === 'object' && '$value' in value) {
      out.push({ path: [...path, key], value: value.$value, type: value.$type, description: value.$description });
    } else if (value && typeof value === 'object') {
      flatten(value, [...path, key], out);
    }
  }
  return out;
}

async function readJsonDir(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const merged = {};
  for (const f of files) {
    Object.assign(merged, JSON.parse(await readFile(join(dir, f), 'utf8')));
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Резолв ссылок {a.b.c}
// ---------------------------------------------------------------------------

const REF = /\{([^}]+)\}/g;

/** Ссылка → CSS-переменная. Так тема остаётся живой: поменял примитив — поменялось везде. */
const toCssRefs = (value) =>
  String(value).replace(REF, (_, ref) => cssVar(ref.split('.')));

/** Ссылка → литеральное значение. Нужно там, где CSS-переменные недоступны (canvas, SVG-экспорт). */
function toLiteral(value, lookup, seen = new Set()) {
  return String(value).replace(REF, (match, ref) => {
    if (seen.has(ref)) throw new Error(`Циклическая ссылка в токенах: ${ref}`);
    const target = lookup.get(ref);
    if (target === undefined) throw new Error(`Ссылка на несуществующий токен: {${ref}}`);
    return toLiteral(target, lookup, new Set([...seen, ref]));
  });
}

/**
 * color-mix(in srgb, #rrggbb N%, transparent) → rgba(r, g, b, N/100).
 *
 * Ссылка внутри color-mix нужна CSS: так значение следует за темой
 * потребителя. Литеральным выходам (tokens.json, values.ts) она ни к чему —
 * почтовые клиенты и мобильные платформы color-mix не разбирают, rgba
 * разбирают все. Смесь с прозрачным в srgb равна rgba с той же долей
 * альфы точно, а не приближённо. Смеси с непрозрачным цветом
 * ({bg.surface}, black) остаются как есть: их результат зависит
 * от пространства смешивания, и считать его здесь незачем.
 */
const TRANSPARENT_MIX = /color-mix\(in srgb, (#[0-9a-f]{3}|#[0-9a-f]{6}) (\d+(?:\.\d+)?)%, transparent\)/gi;

function foldTransparentMix(value) {
  return value.replace(TRANSPARENT_MIX, (_, hex, pct) => {
    // Два знака — как у литералов из макетов (0.30, 0.16); дробный процент
    // получает свои знаки сверху, чтобы свёртка не округляла.
    const digits = (pct.split('.')[1] ?? '').length + 2;
    return `rgba(${parseHex(hex).join(', ')}, ${(Number(pct) / 100).toFixed(digits)})`;
  });
}

// ---------------------------------------------------------------------------
// Проверка контраста (WCAG 2.2). Пары и формула — в contrast.mjs: их же
// берёт конструктор темы в Storybook, и цифры у них совпадают.
// ---------------------------------------------------------------------------

function checkContrast(themeName, literals) {
  const problems = [];
  for (const rule of CONTRAST_RULES) {
    const fg = parseHex(literals.get(rule.fg) ?? '');
    const bg = parseHex(literals.get(rule.bg) ?? '');
    // rgba(...) пропускаем — результат зависит от подложки, статически не считается.
    if (!fg || !bg) continue;
    const ratio = contrast(fg, bg);
    if (ratio < rule.min) {
      problems.push(
        `  ${themeName}: ${rule.fg} на ${rule.bg} = ${ratio.toFixed(2)}:1, нужно ≥ ${rule.min}:1` +
          (rule.note ? ` (${rule.note})` : ''),
      );
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Форматтеры
// ---------------------------------------------------------------------------

const HEADER = `/* Сгенерировано packages/tokens/scripts/build-tokens.mjs — не редактировать руками.
   Источник: packages/tokens/src/ */\n`;

function cssBlock(selector, tokens) {
  const lines = tokens.map((t) => `  --${cssName(t.path)}: ${toCssRefs(t.value)};`);
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

/** Меняет местами trend.up и trend.down — конвенция восточноазиатских рынков. */
function trendSwap(tokens) {
  const swapped = [];
  for (const t of tokens) {
    if (t.path[0] !== 'trend') continue;
    const [, dir, ...rest] = t.path;
    if (dir !== 'up' && dir !== 'down') continue;
    const source = tokens.find(
      (o) => o.path[0] === 'trend' && o.path[1] === (dir === 'up' ? 'down' : 'up') && o.path.slice(2).join('.') === rest.join('.'),
    );
    if (source) swapped.push({ path: t.path, value: source.value });
  }
  return swapped;
}

/** Строит вложенный объект для createGlobalThemeContract: листья — имена CSS-переменных. */
function contractTree(tokens) {
  const root = {};
  for (const t of tokens) {
    let node = root;
    t.path.slice(0, -1).forEach((seg) => (node = node[seg] ??= {}));
    node[t.path.at(-1)] = cssName(t.path);
  }
  return root;
}

const isSafeKey = (k) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k);

function serialize(node, indent = '  ') {
  if (typeof node === 'string') return `'${node}'`;
  const entries = Object.entries(node).map(([k, v]) => {
    const key = isSafeKey(k) ? k : `'${k}'`;
    return `${indent}  ${key}: ${serialize(v, indent + '  ')},`;
  });
  return `{\n${entries.join('\n')}\n${indent}}`;
}

// ---------------------------------------------------------------------------
// Сборка
// ---------------------------------------------------------------------------

async function main() {
  const primitives = flatten(await readJsonDir(join(SRC, 'primitive')));
  const light = flatten(JSON.parse(await readFile(join(SRC, 'semantic', 'light.json'), 'utf8')));
  const dark = flatten(JSON.parse(await readFile(join(SRC, 'semantic', 'dark.json'), 'utf8')));

  // --- Гарантия: темы структурно идентичны -------------------------------
  // Без этой проверки в тёмной теме однажды не окажется какого-нибудь
  // --nb-action-danger-bg-active, и компонент отвалится в рантайме
  // у потребителя, а не в нашем CI.
  const keys = (ts) => new Set(ts.map((t) => t.path.join('.')));
  const [lk, dk] = [keys(light), keys(dark)];
  const missingInDark = [...lk].filter((k) => !dk.has(k));
  const missingInLight = [...dk].filter((k) => !lk.has(k));
  if (missingInDark.length || missingInLight.length) {
    console.error('✗ Формы светлой и тёмной темы разошлись:');
    missingInDark.forEach((k) => console.error(`  нет в dark:  ${k}`));
    missingInLight.forEach((k) => console.error(`  нет в light: ${k}`));
    process.exit(1);
  }

  // --- Резолв литералов и проверка контраста -----------------------------
  const primitiveLookup = new Map(primitives.map((t) => [t.path.join('.'), t.value]));
  const problems = [];
  const literalsByTheme = {};

  for (const [name, tokens] of [['light', light], ['dark', dark]]) {
    const lookup = new Map(primitiveLookup);
    tokens.forEach((t) => lookup.set(t.path.join('.'), t.value));
    const literals = new Map(
      tokens.map((t) => [t.path.join('.'), foldTransparentMix(toLiteral(t.value, lookup))]),
    );
    literalsByTheme[name] = literals;
    problems.push(...checkContrast(name, literals));
  }

  const strict = process.argv.includes('--strict');
  if (problems.length) {
    const label = strict ? '✗ Нарушения контраста WCAG:' : '⚠ Отчёт по контрасту WCAG (сборка не остановлена):';
    console.warn(label);
    problems.forEach((p) => console.warn(p));
    if (strict) process.exit(1);
    console.warn(
      '  Палитру определяют дизайнеры. Обсудите цифры с ними; если правка нужна,\n' +
        '  она приходит из макетов и оформляется новым токеном.',
    );
  }

  await mkdir(ASSETS, { recursive: true });

  // --- tokens.css --------------------------------------------------------
  const css = [
    HEADER,
    '/* Уровень 1 — примитивы. Не зависят от темы. */',
    cssBlock(':root', primitives),
    '',
    '/* Уровень 2 — семантика. Светлая тема по умолчанию. */',
    cssBlock(":root,\n[data-theme='light']", [
      ...light,
      { path: ['__color-scheme'], value: 'light' },
    ].filter((t) => t.path[0] !== '__color-scheme')),
    "\n:root,\n[data-theme='light'] { color-scheme: light; }\n",
    '',
    '/* Тёмная тема. */',
    cssBlock("[data-theme='dark']", dark),
    "\n[data-theme='dark'] { color-scheme: dark; }\n",
    '',
    '/* Восточноазиатская конвенция направления: рост красный, падение зелёное.',
    '   Затрагивает только trend.* — status.* (валидация, системные сообщения)',
    '   остаётся неизменным во всех локалях. */',
    cssBlock("[data-direction='ea'],\n[data-theme='light'][data-direction='ea']", trendSwap(light)),
    '',
    cssBlock("[data-theme='dark'][data-direction='ea']", trendSwap(dark)),
  ].join('\n');

  await writeFile(join(ASSETS, 'tokens.css'), css);

  // --- contract.css.ts ---------------------------------------------------
  const contract = contractTree([...primitives, ...light]);
  const contractTs = `${HEADER}
import { createGlobalThemeContract } from '@vanilla-extract/css';

/**
 * Типизированные ссылки на CSS-переменные из tokens.css.
 *
 * createGlobalThemeContract НЕ задаёт значения — он только описывает контракт.
 * Значения приходят из tokens.css, который потребитель подключает отдельно.
 * Благодаря этому имена переменных остаются человекочитаемыми и стабильными:
 * кастомную тему можно собрать голым CSS, без vanilla-extract в своей сборке.
 *
 *   vars.bg.canvas          → 'var(--nb-bg-canvas)'
 *   vars.color.primary[500] → 'var(--nb-color-primary-500)'
 */
export const vars = createGlobalThemeContract(${serialize(contract)}, (value) => value as string);

export type Vars = typeof vars;
`;
  await writeFile(join(TS_OUT, 'contract.css.ts'), contractTs);

  // --- values.ts ---------------------------------------------------------
  const primitiveLiterals = Object.fromEntries(
    primitives.map((t) => [t.path.join('.'), toLiteral(t.value, primitiveLookup)]),
  );
  const chart = primitives
    .filter((t) => t.path[0] === 'color' && t.path[1] === 'chart')
    .sort((a, b) => Number(a.path[2]) - Number(b.path[2]))
    .map((t) => t.value);

  const valuesTs = `${HEADER}
/**
 * Разрешённые литеральные значения токенов.
 *
 * Нужны там, где CSS-переменные недоступны: отрисовка в canvas, генерация SVG
 * на сервере, экспорт графиков в PNG. В обычных компонентах используйте \`vars\`
 * из contract.css.ts — иначе значение не будет меняться вместе с темой.
 */
export const tokenValues = ${JSON.stringify(primitiveLiterals, null, 2)} as const;

/** Категориальная палитра графиков в порядке назначения сериям. */
export const chartPalette = ${JSON.stringify(chart, null, 2)} as const;

/** Значения семантических токенов по темам — для серверного рендеринга графиков. */
export const themeValues = {
  light: ${JSON.stringify(Object.fromEntries(literalsByTheme.light), null, 2)},
  dark: ${JSON.stringify(Object.fromEntries(literalsByTheme.dark), null, 2)},
} as const;

export type ThemeName = keyof typeof themeValues;
export type Direction = 'western' | 'ea';
`;
  await writeFile(join(TS_OUT, 'values.ts'), valuesTs);

  // --- tokens.json -------------------------------------------------------
  await writeFile(
    join(ASSETS, 'tokens.json'),
    JSON.stringify(
      {
        primitive: Object.fromEntries(primitives.map((t) => [`--${cssName(t.path)}`, toLiteral(t.value, primitiveLookup)])),
        light: Object.fromEntries(light.map((t) => [`--${cssName(t.path)}`, literalsByTheme.light.get(t.path.join('.'))])),
        dark: Object.fromEntries(dark.map((t) => [`--${cssName(t.path)}`, literalsByTheme.dark.get(t.path.join('.'))])),
      },
      null,
      2,
    ),
  );

  console.log(
    `✓ Токены собраны: ${primitives.length} примитивов, ${light.length} семантических × 2 темы\n` +
      `  контраст: ${CONTRAST_RULES.length} правил проверено, ${problems.length} расхождений`,
  );
}

main().catch((err) => {
  console.error('✗ Сборка токенов упала:', err.message);
  process.exit(1);
});
