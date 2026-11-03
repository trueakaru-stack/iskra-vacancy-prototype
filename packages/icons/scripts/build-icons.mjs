/**
 * Сборка компонентов иконок из `svg/`.
 *
 * Исходник иконки — файл `svg/<имя>.svg`, ровно как он приехал из витрины
 * (см. `extract-from-showcase.mjs`). Компоненты из него генерируются:
 * править `src/generated/**` руками нельзя, правка переживёт ровно
 * до следующей сборки.
 *
 * Скрипт заодно проверяет исходники, потому что дизайнеры присылают SVG
 * из разных мест и разной чистоты:
 *
 *   1. Каждому файлу соответствует запись в `meta.json` и наоборот.
 *      Иначе иконка либо не попадёт в набор, либо окажется в нём
 *      без указания, откуда взялась.
 *   2. Атрибуты корня — канонические. Свой `fill`, `width` или чужая
 *      сетка внутри файла означают, что иконка выпадет из общего строя,
 *      а заметно это будет только глазами.
 *   3. Фигуры — из белого списка. Экзотика вроде <style>, <image>
 *      или <use> в набор не едет: она не наследует currentColor
 *      и ломается в тёмной теме.
 *
 *   node scripts/build-icons.mjs
 */
import { readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgDir = join(packageRoot, 'svg');
const outDir = join(packageRoot, 'src', 'generated');

const ROOT_ATTRS = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

const SHAPES = new Set(['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'g']);

const errors = [];

/** search → IconSearch, chart-line → IconChartLine. */
const pascal = (name) => 'Icon' + name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

/** stroke-width → strokeWidth; остальное JSX принимает как есть. */
const camel = (attr) => attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function parseSvg(name, source) {
  const root = source.match(/<svg\b([^>]*)>/);
  if (!root) return errors.push(`${name}.svg: нет корневого <svg>`), null;

  const attrs = Object.fromEntries([...root[1].matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  for (const [attr, expected] of Object.entries(ROOT_ATTRS)) {
    if (attrs[attr] !== expected) {
      errors.push(`${name}.svg: у корня ${attr}="${attrs[attr] ?? ''}", ожидается "${expected}"`);
    }
  }
  for (const attr of Object.keys(attrs)) {
    if (!(attr in ROOT_ATTRS) && attr !== 'class') {
      errors.push(`${name}.svg: лишний атрибут корня ${attr} — размер и цвет задаёт тот, кто ставит иконку`);
    }
  }

  const inner = source.slice(source.indexOf('>', root.index) + 1, source.lastIndexOf('</svg>')).trim();
  for (const tag of inner.matchAll(/<([a-zA-Z]+)/g)) {
    if (!SHAPES.has(tag[1])) errors.push(`${name}.svg: фигура <${tag[1]}> не из белого списка`);
  }
  if (!inner) errors.push(`${name}.svg: пусто`);

  return inner;
}

/** Переводит разметку фигур в JSX: атрибуты в camelCase, остальное как есть. */
function toJsx(inner) {
  return inner
    .replace(/([a-z]+(?:-[a-z]+)+)=/g, (_, attr) => `${camel(attr)}=`)
    .split('\n')
    .map((line) => '    ' + line.trim())
    .join('\n');
}

const meta = JSON.parse(readFileSync(join(packageRoot, 'meta.json'), 'utf8'));
const files = readdirSync(svgDir)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.replace(/\.svg$/, ''))
  .sort();

for (const name of files) if (!meta[name]) errors.push(`${name}.svg: нет записи в meta.json`);
for (const name of Object.keys(meta)) if (!files.includes(name)) errors.push(`meta.json: ${name} — нет файла svg/${name}.svg`);

const icons = [];
for (const name of files) {
  const inner = parseSvg(name, readFileSync(join(svgDir, `${name}.svg`), 'utf8'));
  if (inner) icons.push({ name, exportName: pascal(name), inner, ...meta[name] });
}

if (errors.length) {
  console.error('Иконки не собраны:\n' + errors.map((e) => `  · ${e}`).join('\n'));
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const head = '/* Сгенерировано scripts/build-icons.mjs. Не редактировать: источник — svg/. */\n';

for (const icon of icons) {
  const options = icon.mirrorInRtl ? ', { mirrorInRtl: true }' : '';
  writeFileSync(
    join(outDir, `${icon.name}.tsx`),
    `${head}
import { createIcon } from '../createIcon.js';

export const ${icon.exportName} = createIcon(
  '${icon.name}',
  <>
${toJsx(icon.inner)}
  </>${options},
);
`,
  );
}

writeFileSync(
  join(outDir, 'index.ts'),
  head + '\n' + icons.map((i) => `export { ${i.exportName} } from './${i.name}.js';`).join('\n') + '\n',
);

writeFileSync(
  join(outDir, 'manifest.ts'),
  `${head}
/** Имя иконки в наборе — оно же имя файла в svg/ и значение data-nb-icon. */
export type IconName =
${icons.map((i) => `  | '${i.name}'`).join('\n')};

export interface IconMeta {
  /** Имя в наборе. */
  name: IconName;
  /** Имя экспорта: IconSearch. */
  exportName: string;
  /** Откуда взят глиф: витрина или reference/src, где витрина его не рисует. */
  source: 'showcase' | 'reference';
  /** Отражается ли в RTL по умолчанию. */
  mirrorInRtl: boolean;
}

/** Весь набор списком — для галерей, поиска и проверок. */
export const iconManifest: readonly IconMeta[] = [
${icons
  .map(
    (i) =>
      `  { name: '${i.name}', exportName: '${i.exportName}', source: '${i.source}', mirrorInRtl: ${Boolean(i.mirrorInRtl)} },`,
  )
  .join('\n')}
];
`,
);

const fromReference = icons.filter((i) => i.source === 'reference').map((i) => i.name);
console.log(`Иконок собрано: ${icons.length} (вне витрины: ${fromReference.join(', ') || 'нет'})`);
