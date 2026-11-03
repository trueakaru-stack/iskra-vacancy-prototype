import { createVar, style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/*
 * Перенос кольцевой половины раздела «Data & Layout · 16 / Progress»
 * витрины и reference/src/components/Progress/Progress.css. Обе формы
 * спецификации совпадают ступень в ступень — ни правил, ни разметки,
 * расходящихся между ними, у кольца нет.
 *
 * В макетах кольцо и полоса лежат в одном файле и делят раздел, но
 * пересекающихся правил у них нет: полоса держится на `.progress*`,
 * кольцо — на `.ring*`. Порт разложен по этой же границе.
 *
 * Селекторы макета и их судьба:
 *
 * `.ring-wrap`                         → `base`
 * `.ring`                              → `canvas`
 * `.ring__track`                       → `track`
 * `.ring__fill`                        → `fill`
 * `.ring--accent/pos/neg/warn/info/neutral .ring__fill`
 *                                      → `fillVariant`
 * `.ring__center`                      → `center`
 * `.ring__value`                       → `value`
 * `.ring__sub`                         → `sub`
 * `.ring--sm/lg/xl`                    → `sizeVariant`
 * `.ring--sm/lg/xl .ring__value`       → `valueSize`
 * `@media (prefers-reduced-motion: reduce)`
 *                                      → `fill`
 *
 * Модификаторы макета висят на корне, а действуют на вложенный элемент
 * (`.ring--sm .ring__value`). В порте класс варианта ставится сразу
 * на тот элемент, который он красит или мерит: у классов vanilla-extract
 * одинаковая специфичность, и селектор через корень ничего не добавлял бы,
 * кроме лишнего уровня. Порядок объявления при этом сохранён — он и решает.
 *
 * Токены остались в группе `progress.ring*`: имена пришли из макетов
 * вместе со значениями, и разрез порта на два компонента — причина
 * репозитория, а не дизайна.
 */

/** `--ring-size` из макетов: диаметр кольца. */
const ringSize = createVar();

/**
 * `--ring-thick` из макетов: толщина обводки в единицах системы координат
 * SVG, а не в пикселях. Число без единиц — так задано в макетах.
 */
const ringThickness = createVar();

/** `.ring-wrap` */
export const base = style({
  vars: {
    [ringSize]: vars.progress.ringSize.md,
    [ringThickness]: vars.progress.ringThickness.md,
  },
  position: 'relative',
  width: ringSize,
  height: ringSize,
  display: 'inline-grid',
  placeItems: 'center',
  flex: 'none',
});

/** `.ring` */
export const canvas = style({
  width: '100%',
  height: '100%',
  transform: 'rotate(-90deg)',
  display: 'block',
});

/** `.ring__track` */
export const track = style({
  fill: 'none',
  stroke: vars.bg.muted,
  strokeWidth: ringThickness,
});

/** `.ring__fill` */
export const fill = style({
  fill: 'none',
  stroke: vars.action.primary.bg,
  strokeWidth: ringThickness,
  strokeLinecap: 'round',
  // `stroke-dasharray: var(--val, 0) 100` — долю выставляет компонент
  // инлайновым стилем, окружность нормирована на 100 единиц (r = 15.9155).
  strokeDasharray: '0 100',
  transition: `stroke-dasharray ${vars.duration.slow} ${vars.ease.out}`,

  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

/**
 * `.ring--*  .ring__fill`
 *
 * Имена вариантов приведены к конвенции системы: `pos`/`neg`/`warn` макетов —
 * это `positive`/`negative`/`warning`, как одноимённые токены.
 *
 * `--pos-500` и `--neg-500` в макетах переворачиваются локалью
 * (`data-direction="ea"`). Здесь взяты непереворачиваемые статусные цвета —
 * то же решение, что у Banner, Dialog, Timeline и Checkbox; вопрос записан
 * в DESIGN.md.
 */
export const fillVariant = styleVariants({
  primary: { stroke: vars.action.primary.bg },
  accent: { stroke: vars.action.accent.bg },
  positive: { stroke: vars.status.positive.fg },
  negative: { stroke: vars.status.negative.fg },
  warning: { stroke: vars.status.warning.fg },
  info: { stroke: vars.status.info.fg },
  neutral: { stroke: vars.progress.fillNeutral },
});

/** `.ring__center` */
export const center = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.progress.ringCenterGap,
  textAlign: 'center',
  lineHeight: vars.progress.ringCenterLineHeight,
});

/** `.ring__value` */
export const value = style({
  fontFamily: vars.fontFamily.mono,
  fontVariantNumeric: 'tabular-nums',
  fontSize: vars.fontSize[15],
  fontWeight: vars.fontWeight.semibold,
  color: vars.fg.default,
  lineHeight: vars.progress.ringValueLineHeight,
});

/** `.ring__sub` */
export const sub = style({
  fontSize: vars.fontSize[10],
  color: vars.fg.muted,
  marginBlockStart: 0,
  lineHeight: vars.progress.ringSubLineHeight,
});

/** `.ring--sm/lg/xl`; `md` — базовые диаметр и толщина */
export const sizeVariant = styleVariants({
  sm: {
    vars: {
      [ringSize]: vars.progress.ringSize.sm,
      [ringThickness]: vars.progress.ringThickness.sm,
    },
  },
  md: {
    vars: {
      [ringSize]: vars.progress.ringSize.md,
      [ringThickness]: vars.progress.ringThickness.md,
    },
  },
  lg: {
    vars: {
      [ringSize]: vars.progress.ringSize.lg,
      [ringThickness]: vars.progress.ringThickness.lg,
    },
  },
  xl: {
    vars: {
      [ringSize]: vars.progress.ringSize.xl,
      [ringThickness]: vars.progress.ringThickness.xl,
    },
  },
});

/** `.ring--sm/lg/xl .ring__value`; `md` — базовый кегль */
export const valueSize = styleVariants({
  sm: { fontSize: vars.fontSize[12] },
  md: { fontSize: vars.fontSize[15] },
  lg: { fontSize: vars.fontSize[24] },
  xl: { fontSize: vars.fontSize[32] },
});
