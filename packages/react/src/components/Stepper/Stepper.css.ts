import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/*
 * Перенос reference/src/components/Stepper/Stepper.css один в один.
 *
 * Отличия только технические, каждое подписано:
 *   — физические свойства заменены логическими (insetInlineStart вместо
 *     left), иначе соединители не зеркалятся на RTL;
 *   — :focus-visible кнопочного шага заменён на data-focus-visible
 *     React Aria;
 *   — состояния is-complete / is-current / is-error приходят вариантом
 *     state, а не модификатором класса.
 *
 * Порядок объявлений повторяет порядок правил в макетах: базовый шаг,
 * состояния соединителя, маркер, подписи, вертикальная ориентация,
 * сброс кнопочного шага. У классов vanilla-extract одинаковая
 * специфичность, побеждает объявленный ниже — как в исходном каскаде.
 */

/**
 * .stepper — плюс горизонтальная раскладка из правила
 * `.stepper:has(.stepper__step):not(.stepper--vertical)`. Гард :has()
 * в макетах существует только чтобы не задеть легаси-прогрессбар
 * `.stepper__bar`/`.stepper__fill` с тем же корневым классом (паттерн
 * create-object); в порте того прогрессбара нет, поэтому row и gap: 0
 * сложены в базовый стиль без условия.
 */
export const stepper = style({
  display: 'flex',
  alignItems: 'flex-start',
  width: '100%',
  flexDirection: 'row',
  gap: vars.space[0],
});

/** .stepper__step */
export const step = style({
  position: 'relative',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space[4],
  textAlign: 'center',

  selectors: {
    // .stepper__step::before — линия-соединитель с предыдущим шагом.
    // top: 14px из макетов = половина маркера (28px / 2) — выводится
    // из токена, чтобы при смене markerSize линия не отклеилась.
    // left: -50% — логическим свойством: на RTL предыдущий шаг справа,
    // и линия обязана уходить туда же.
    '&::before': {
      content: '""',
      position: 'absolute',
      insetBlockStart: `calc(${vars.stepper.markerSize} / 2)`,
      insetInlineStart: '-50%',
      width: '100%',
      height: vars.stepper.connectorThickness,
      background: vars.border.default,
      zIndex: vars.layer.base,
    },
    // .stepper__step:first-child::before — у первого шага соединителя нет.
    '&:first-child::before': {
      display: 'none',
    },
  },
});

/**
 * .is-complete / .is-current / .is-error из макетов.
 *
 * Ключ upcoming — состояние по умолчанию, собственных правил в макетах
 * у него нет: вид задаёт базовый .stepper__step и .stepper__marker.
 */
export const stepState = styleVariants({
  // .stepper__step.is-complete::before, .stepper__step.is-current::before —
  // соединитель пройденного пути. В макетах — сырой примитив --primary-500;
  // здесь семантический action.primary.bg: в обеих темах это то же значение,
  // а сырые примитивы в компонентах не используются.
  complete: {
    selectors: {
      '&::before': { background: vars.action.primary.bg },
    },
  },
  current: {
    selectors: {
      '&::before': { background: vars.action.primary.bg },
    },
  },
  error: {},
  upcoming: {},
  // available — вид upcoming; отличается только тем, что может быть кнопкой.
  available: {},
});

/** .stepper__marker — кружок с номером, галкой или крестом. */
export const marker = style({
  position: 'relative',
  // z-index: 1 из макетов — маркер над линией-соединителем.
  zIndex: vars.layer.raised,
  width: vars.stepper.markerSize,
  height: vars.stepper.markerSize,
  // В макетах действует глобальный box-sizing: border-box: 28px маркера —
  // вместе с рамкой 1.5px. Без явного border-box кружок вырос бы до 31px.
  boxSizing: 'border-box',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: vars.fontFamily.mono,
  fontSize: vars.fontSize[12],
  fontWeight: vars.fontWeight.semibold,
  background: vars.bg.surface,
  // 1.5px — ширина рамки, пишется литералом, как 1px у остальных компонентов.
  border: `1.5px solid ${vars.border.strong}`,
  color: vars.fg.muted,

  selectors: {
    // .stepper__step.is-complete .stepper__marker — залит primary-500.
    // #fff из макетов — vars.fg.onPrimary: в обеих темах это #ffffff,
    // рендер совпадает с литералом, но цвет остаётся в контракте темы.
    [`${stepState.complete} &`]: {
      background: vars.action.primary.bg,
      borderColor: vars.action.primary.bg,
      color: vars.fg.onPrimary,
    },
    // .stepper__step.is-current .stepper__marker
    [`${stepState.current} &`]: {
      borderColor: vars.action.primary.bg,
      color: vars.action.primary.fg,
      boxShadow: vars.focus.ring,
    },
    // .stepper__step.is-error .stepper__marker — в макетах сырой --neg-500;
    // здесь action.danger.bg с тем же значением в обеих темах.
    // #fff — vars.fg.onDanger, см. комментарий выше.
    [`${stepState.error} &`]: {
      background: vars.action.danger.bg,
      borderColor: vars.action.danger.bg,
      color: vars.fg.onDanger,
    },
  },
});

// .stepper__marker svg — иконка галки/креста, 15×15px.
globalStyle(`${marker} svg`, {
  width: vars.stepper.iconSize,
  height: vars.stepper.iconSize,
});

/** .stepper__labels */
export const labels = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.stepper.labelsGap,
});

/** .stepper__label */
export const label = style({
  fontSize: vars.fontSize[12],
  color: vars.fg.secondary,

  selectors: {
    // .stepper__step.is-current .stepper__label
    [`${stepState.current} &`]: {
      color: vars.fg.default,
      fontWeight: vars.fontWeight.medium,
    },
  },
});

/** .stepper__sub */
export const sub = style({
  fontSize: vars.fontSize[10],
  color: vars.fg.muted,
  fontFamily: vars.fontFamily.mono,
});

/** .stepper--vertical */
export const vertical = style({
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: vars.space[0],
});

// .stepper--vertical .stepper__step
globalStyle(`${vertical} ${step}`, {
  flex: 'none',
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: vars.space[5],
  textAlign: 'start',
  paddingBlockEnd: vars.stepper.stepPaddingBlockEnd,
});

// .stepper--vertical .stepper__step::before — линия вниз от маркера.
// top: 28px = высота маркера, left: 13px = (28px − 2px) / 2 — центр маркера
// минус половина толщины линии; оба значения выводятся из токенов.
globalStyle(`${vertical} ${step}::before`, {
  insetBlockStart: vars.stepper.markerSize,
  insetInlineStart: `calc((${vars.stepper.markerSize} - ${vars.stepper.connectorThickness}) / 2)`,
  width: vars.stepper.connectorThickness,
  height: `calc(100% - ${vars.stepper.markerSize})`,
});

// .stepper--vertical .stepper__step:first-child::before — в вертикали
// линия принадлежит шагу над ней, поэтому у первого она есть…
globalStyle(`${vertical} ${step}:first-child::before`, {
  display: 'block',
});

// .stepper--vertical .stepper__step:last-child::before — …а у последнего нет.
globalStyle(`${vertical} ${step}:last-child::before`, {
  display: 'none',
});

// .stepper--vertical .stepper__step.is-current::before — линия под текущим
// шагом ещё не пройдена и остаётся нейтральной.
globalStyle(`${vertical} ${stepState.current}::before`, {
  background: vars.border.default,
});

// .stepper--vertical .stepper__labels
globalStyle(`${vertical} ${labels}`, {
  paddingBlockStart: vars.space[2],
});

/**
 * button.stepper__step — кликабельный шаг рендерится настоящей кнопкой,
 * сбрасываем браузерный хром. В порте кнопка — React Aria Button,
 * поэтому :focus-visible из макетов — data-focus-visible.
 */
export const stepButton = style({
  background: 'none',
  border: 0,
  // padding: 0 из макетов — сокращённая запись, обнуляет и блочные,
  // и строчные отступы разом.
  padding: 0,
  font: 'inherit',
  cursor: 'pointer',

  // Системная обводка гасится в базовом стиле, а не под data-focus-visible:
  // при программном возврате фокуса браузер рисует своё кольцо, а React Aria
  // знает про мышь и атрибут не выставляет — правило под атрибутом
  // в этот зазор не попадает.
  outline: 'none',

  selectors: {
    // button.stepper__step:focus-visible
    '&[data-focus-visible]': {
      boxShadow: vars.focus.ring,
      borderRadius: vars.radius.sm,
    },
  },
});
