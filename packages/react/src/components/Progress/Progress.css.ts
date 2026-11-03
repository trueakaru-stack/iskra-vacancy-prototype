import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/*
 * Перенос линейной половины раздела «Data & Layout · 16 / Progress»
 * витрины и reference/src/components/Progress/Progress.css. Обе формы
 * спецификации совпадают ступень в ступень — ни правил, ни разметки,
 * расходящихся между ними, у этого компонента нет.
 *
 * В макетах полоса и кольцо лежат в одном файле и делят раздел, но
 * пересекающихся правил у них нет: полоса держится на `.progress*`,
 * кольцо — на `.ring*`. Кольцевая половина живёт в `ProgressRing`.
 *
 * Селекторы макета и их судьба:
 *
 * `.progress`                          → `base`
 * `.progress__meta`                    → `meta`
 * `.progress__label`                   → `label`
 * `.progress__value`                   → `value`
 * `.progress__value .unit`             → `unit`
 * `.progress__track`                   → `track`
 * `.progress__fill`                    → `fill`
 * `.progress--xs/sm/lg .progress__track`
 *                                      → `trackSize`
 * `.progress--primary/accent/pos/neg/warn/info/neutral .progress__fill`
 *                                      → `fillVariant`
 * `.progress__fill--striped`           → `striped`
 * `.progress__fill--animated`          → `animated`
 * `@keyframes nb-progress-stripes`     → `stripeShift`
 * `.progress--indeterminate .progress__fill`
 *                                      → `indeterminateFill`
 * `@keyframes nb-progress-indet`       → `indeterminateSlide`
 * `@media (prefers-reduced-motion: reduce)` (полоса)
 *                                      → `animated`, `indeterminateFill`, `fill`
 *
 * Кольцевые селекторы (`.ring-wrap`, `.ring`, `.ring__*`, `.ring--*`)
 * перенесены в `../ProgressRing/ProgressRing.css.ts`.
 *
 * Модификаторы макета висят на корне, а действуют на вложенный элемент
 * (`.progress--xs .progress__track`). В порте класс варианта ставится сразу
 * на тот элемент, который он красит или мерит: у классов vanilla-extract
 * одинаковая специфичность, и селектор через корень ничего не добавлял бы,
 * кроме лишнего уровня. Порядок объявления при этом сохранён — он и решает.
 */

/** `.progress` */
export const base = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.progress.gap,
  width: '100%',
});

/** `.progress__meta` */
export const meta = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space[5],
});

/** `.progress__label` */
export const label = style({
  fontSize: vars.fontSize[12],
  fontWeight: vars.fontWeight.medium,
  color: vars.fg.secondary,
});

/** `.progress__value` */
export const value = style({
  fontSize: vars.fontSize[12],
  color: vars.fg.default,
  fontFamily: vars.fontFamily.mono,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

/** `.progress__value .unit` */
export const unit = style({
  color: vars.fg.muted,
});

/** `.progress__track` */
export const track = style({
  position: 'relative',
  width: '100%',
  height: vars.progress.trackHeight.md,
  background: vars.bg.muted,
  borderRadius: vars.radius.full,
  overflow: 'hidden',
});

/**
 * `.progress__fill`
 *
 * `inset: 0 auto 0 0` записан логическими свойствами: заливка обязана расти
 * от начала строки, а на арабском это правый край.
 */
export const fill = style({
  position: 'absolute',
  insetBlock: 0,
  insetInlineStart: 0,
  insetInlineEnd: 'auto',
  height: '100%',
  width: 0,
  background: vars.action.primary.bg,
  borderRadius: vars.radius.full,
  transition: `width ${vars.duration.base} ${vars.ease.out}`,

  '@media': {
    /*
     * Правила на переход ширины в макетах компонента нет — витрина обещает
     * общее правило на `*`, которого дизайн-система потребителю не навязывает.
     * Переход гасится здесь, у элемента, который его объявляет: то же решение,
     * что у Upload (.file-row .progress__fill).
     */
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

/** `.progress--xs/sm/lg .progress__track`; `md` — базовая высота дорожки */
export const trackSize = styleVariants({
  xs: { height: vars.progress.trackHeight.xs },
  sm: { height: vars.progress.trackHeight.sm },
  md: { height: vars.progress.trackHeight.md },
  lg: { height: vars.progress.trackHeight.lg },
});

/**
 * `.progress--*  .progress__fill`
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
  primary: { background: vars.action.primary.bg },
  accent: { background: vars.action.accent.bg },
  positive: { background: vars.status.positive.fg },
  negative: { background: vars.status.negative.fg },
  warning: { background: vars.status.warning.fg },
  info: { background: vars.status.info.fg },
  neutral: { background: vars.progress.fillNeutral },
});

/**
 * `.progress__fill--striped`
 *
 * Угол 45deg оставлен физическим: в макетах правила под RTL нет, а зеркалить
 * диагональ текстуры — решение дизайнеров, не переноса. Записано в DESIGN.md.
 */
export const striped = style({
  backgroundImage: `linear-gradient(45deg, ${vars.progress.stripe} 25%, transparent 25%, transparent 50%, ${vars.progress.stripe} 50%, ${vars.progress.stripe} 75%, transparent 75%, transparent)`,
  backgroundSize: `${vars.progress.stripeSize} ${vars.progress.stripeSize}`,
});

/** `@keyframes nb-progress-stripes` */
const stripeShift = keyframes({
  from: { backgroundPosition: '0 0' },
  to: { backgroundPosition: `${vars.progress.stripeSize} 0` },
});

/** `.progress__fill--animated` */
export const animated = style({
  animation: `${stripeShift} ${vars.progress.stripeDuration} linear infinite`,

  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

/**
 * `@keyframes nb-progress-indet`
 *
 * `left`/`right` макетов записаны логическими свойствами: бегунок обязан
 * ехать в сторону чтения, а на арабском она обратная.
 */
const indeterminateSlide = keyframes({
  '0%': {
    insetInlineStart: `calc(-1 * ${vars.progress.indeterminateWidth})`,
    insetInlineEnd: '100%',
  },
  '60%': {
    insetInlineStart: '100%',
    insetInlineEnd: `calc(-1 * ${vars.progress.indeterminateWidth})`,
  },
  '100%': {
    insetInlineStart: '100%',
    insetInlineEnd: `calc(-1 * ${vars.progress.indeterminateWidth})`,
  },
});

/**
 * `.progress--indeterminate .progress__fill`
 *
 * В макетах ширина помечена `!important` — она перебивает инлайновый
 * `width: N%` из разметки. В порте инлайновая ширина при неизвестном
 * прогрессе не выставляется вовсе, перебивать нечего, и `!important`
 * не нужен: базовую `width: 0` закрывает порядок объявления.
 */
export const indeterminateFill = style({
  width: vars.progress.indeterminateWidth,
  borderRadius: vars.radius.full,
  animation: `${indeterminateSlide} ${vars.progress.indeterminateDuration} ${vars.ease.inOut} infinite`,

  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});
