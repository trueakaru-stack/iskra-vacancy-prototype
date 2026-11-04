import { style, styleVariants, globalStyle } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/*
 * Перенос reference/src/components/NumberInput/NumberInput.css.
 *
 * Селекторы макета и их судьба:
 *
 * `.num-field`                      → `group`
 * `.num-field:hover`                → `group`, `&[data-hovered]`
 * `.num-field:focus-within`         → `group`, `&[data-focus-within]`
 * `.num-field.is-invalid`           → `invalid`
 * `.num-field.is-disabled`          → `group`, `${field}[data-disabled] &`
 * `.num-field__btn`                 → `stepperButton`
 * `.num-field__btn:hover`           → `stepperButton`, `&[data-hovered]`
 * `.num-field__btn:active`          → `stepperButton`, `&[data-pressed]`
 * `.num-field__btn:disabled`        → `stepperButton`, `&[data-disabled]`
 * `.num-field__btn .ti`             → globalStyle от `stepperButton`
 * `.num-field__input`               → `input`
 * `.num-field__input:disabled`      → `input`, `&[data-disabled]`
 * `.num-field__affix`               → `affix`
 * `.num-field__affix--prefix`       → `affixPrefix`
 * `.num-field__affix--suffix`       → `affixSuffix`
 * `.num-field--currency .num-field__input` → `inputCurrency`
 * `.num-field--sm`                  → `size.sm`
 * `.num-field--sm .num-field__btn`  → `buttonSize.sm`
 * `.num-field--sm .num-field__input`→ `inputSize.sm`
 * `.num-field--lg`                  → `size.lg`
 * `.num-field--lg .num-field__btn`  → `buttonSize.lg`
 * `.num-field--lg .num-field__input`→ `inputSize.lg`
 *
 * Размеры в макетах заданы вложенными селекторами от модификатора коробки.
 * Здесь размер знает сам компонент, поэтому вместо каскада — три набора
 * вариантов, которые вешаются прямо на нужный элемент.
 *
 * Подпись, подсказка и текст ошибки в макетах NumberInput не описаны — поле
 * там живёт без обвязки, а в витрине стоит внутри `.field`. Анатомия взята
 * из .field (Input.css), как у TextField, Select и Combobox: подпись 12px
 * medium, подсказка 11px, шаг fieldGap.
 */

/** .field (Input.css) — вертикальная анатомия блока поля. */
export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.fieldGap.default,
  // .field { min-width: 200px } — структурный минимум формы, не шкала.
  // Коробка поля внутри уже: она обнимает содержимое (width: max-content).
  minWidth: 200,
  // Коробка не растягивается на всю колонку: в макетах у неё max-content.
  alignItems: 'flex-start',
  fontFamily: vars.fontFamily.sans,
});

/** .field__label (Input.css) — как у TextField, Select и Combobox. */
export const label = style({
  fontSize: vars.fontSize[12],
  fontWeight: vars.fontWeight.medium,
  color: vars.fg.default,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  // width: fit-content — иначе клик по пустому месту справа от подписи
  // фокусирует поле, что на широких формах читается как случайное срабатывание.
  width: 'fit-content',
});

/** .field__label .req */
export const requiredMark = style({
  color: vars.status.negative.fg,
});

/** .field__opt (FormLayout.css) */
export const optionalMark = style({
  color: vars.fg.muted,
  fontWeight: vars.fontWeight.regular,
  fontSize: vars.fontSize[11],
});

/**
 * .num-field — коробка поля: кнопки, аффиксы и число в одной рамке.
 *
 * Наведение и фокус читаются с data-атрибутов RACGroup: `data-hovered`
 * отличает мышь от касания, `data-focus-within` совпадает с `:focus-within`
 * макетов — рамка загорается и при работе мышью, как у остальных полей.
 * Отключённое состояние React Aria ставит на корень NumberField,
 * поэтому читается оттуда.
 */
export const group = style({
  // В макетах действует глобальный ресет box-sizing: border-box, у системы
  // своего ресета нет — без этого высота 30px превращается в 32px.
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'stretch',
  width: 'max-content',
  height: vars.controlHeight.md,
  background: vars.bg.surface,
  border: `1px solid ${vars.border.default}`,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',

  transitionProperty: 'border-color, box-shadow',
  transitionDuration: vars.duration.fast,
  // Кривая в макетах не задана (умолчание браузера) — ease.out не подставляем.

  selectors: {
    '&[data-hovered]': { borderColor: vars.border.strong },
    '&[data-focus-within]': {
      borderColor: vars.border.focus,
      boxShadow: vars.focus.ring,
    },
    // .num-field.is-disabled — в макетах класс на самой коробке, у React Aria
    // состояние живёт на корне NumberField.
    [`${field}[data-disabled] &`]: {
      background: vars.bg.subtle,
      opacity: 0.7,
      pointerEvents: 'none',
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});

/**
 * .num-field.is-invalid
 *
 * Рамка остаётся красной и под фокусом: в макетах `.is-invalid` (0,2,0)
 * перебивает `:focus-within` (0,1,1). borderColor повторён — селектор
 * с data-атрибутом специфичнее одиночного класса. Кольцо при этом остаётся
 * синим: красного кольца, как у `.input.is-invalid:focus`, в макетах
 * числового поля нет (записано в DESIGN.md).
 */
export const invalid = style({
  borderColor: vars.status.negative.fg,
  selectors: {
    '&[data-focus-within]': { borderColor: vars.status.negative.fg },
  },
});

/** .num-field--sm / --lg — высота коробки. md — база макетов. */
export const size = styleVariants({
  sm: { height: vars.controlHeight.sm },
  md: { height: vars.controlHeight.md },
  lg: { height: vars.controlHeight.lg },
});

/** .num-field__btn — кнопки шага. */
export const stepperButton = style({
  // Размер вместе с рамкой: у кнопки её нет, но width соседствует
  // с браузерными умолчаниями — фиксируем явно.
  boxSizing: 'border-box',
  flex: 'none',
  width: vars.numberInput.buttonWidth.md,
  border: 0,
  // В макетах отступ кнопки не задан вовсе, и остаётся браузерный (1px 6px
  // в Chrome, шире в Firefox). Он съедает ширину под глиф: на размере sm
  // содержимое кнопки становится уже объявленных 15px, и глиф сжимается.
  // Обнуляем, чтобы глиф был ровно 15px на всех размерах и во всех браузерах.
  padding: 0,
  background: 'transparent',
  color: vars.fg.muted,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  // React Aria возвращает фокус программно; браузер рисует своё кольцо
  // там, где data-focus-visible не выставляется. Гасим в базовом стиле.
  outline: 'none',

  selectors: {
    '&[data-hovered]': { background: vars.bg.hover, color: vars.fg.default },
    '&[data-pressed]': { background: vars.bg.active },
    '&[data-disabled]': {
      opacity: 0.4,
      cursor: 'not-allowed',
      background: 'transparent',
    },
  },
});

/** .num-field--sm / --lg .num-field__btn */
export const buttonSize = styleVariants({
  sm: { width: vars.numberInput.buttonWidth.sm },
  md: { width: vars.numberInput.buttonWidth.md },
  lg: { width: vars.numberInput.buttonWidth.lg },
});

// .num-field__btn .ti — глиф 15×15px. flex: none обязателен: без него глиф
// сжимается под ширину кнопки, как это происходит в макетах на размере sm.
globalStyle(`${stepperButton} svg`, {
  width: vars.numberInput.buttonIconSize,
  height: vars.numberInput.buttonIconSize,
  flex: 'none',
});

/** .num-field__input — число. Моноширинный шрифт с табличными цифрами. */
export const input = style({
  boxSizing: 'border-box',
  flex: 1,
  minWidth: 0,
  width: vars.numberInput.inputWidth.default,
  border: 0,
  outline: 0,
  // В макетах отступ поля не задан и остаётся браузерный (1px 2px). Обнуляем:
  // при центрированном числе он симметричен и невиден, а у валютного варианта
  // конечный отступ задан явно — оставлять начальный на усмотрение движка
  // значит получить разную вёрстку в разных браузерах.
  padding: 0,
  background: 'transparent',
  textAlign: 'center',
  color: vars.fg.default,
  fontFamily: vars.fontFamily.mono,
  fontSize: vars.fontSize[13],
  fontVariantNumeric: 'tabular-nums',

  selectors: {
    // .num-field__input:disabled
    '&[data-disabled]': {
      color: vars.fg.disabled,
      cursor: 'not-allowed',
      // WebKit игнорирует color на disabled input без этого свойства.
      WebkitTextFillColor: vars.fg.disabled,
    },
  },
});

/**
 * Проп `textAlign`. Не reference: там выравнивание задано вариантом.
 * Объявлен после `inputCurrency` и перебивает его. Отступ у `start` и `end` —
 * как у `TextField`, иначе число прилипает к рамке или к аффиксу;
 * у `center` он нулевой, как у базового поля.
 */
export const inputAlign = styleVariants({
  start: { textAlign: 'start', paddingInline: vars.fieldPaddingInline.md },
  center: { textAlign: 'center', paddingInline: 0 },
  end: { textAlign: 'end', paddingInline: vars.fieldPaddingInline.md },
});

/** .num-field--sm / --lg .num-field__input */
export const inputSize = styleVariants({
  sm: { fontSize: vars.fontSize[12] },
  md: { fontSize: vars.fontSize[13] },
  lg: { fontSize: vars.fontSize[14] },
});

/**
 * .num-field--currency .num-field__input — шире, число прижато к концу строки.
 * Объявлен после `input` и `inputSize`: в макетах правило стоит после базового
 * и перебивает его ширину и выравнивание.
 */
export const inputCurrency = style({
  width: vars.numberInput.inputWidth.currency,
  // text-align: right → логическое end: на RTL число прижимается к своему краю.
  textAlign: 'end',
  paddingInlineEnd: vars.numberInput.currencyPaddingInlineEnd,
});

/** .num-field__affix — валютный знак или единица. В значение не входит. */
export const affix = style({
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: 0,
  paddingInline: vars.numberInput.affixPaddingInline,
  flex: 'none',
  color: vars.fg.muted,
  fontSize: vars.fontSize[12],
  background: vars.bg.subtle,
});

/** .num-field__affix--prefix — border-right → логический borderInlineEnd. */
export const affixPrefix = style({
  borderInlineEnd: `1px solid ${vars.border.subtle}`,
});

/** .num-field__affix--suffix — border-left → логический borderInlineStart. */
export const affixSuffix = style({
  borderInlineStart: `1px solid ${vars.border.subtle}`,
});

/** .field__hint (Input.css) */
export const description = style({
  fontSize: vars.fontSize[11],
  color: vars.fg.muted,
});

/** .field__hint.is-error */
export const errorMessage = style({
  fontSize: vars.fontSize[11],
  color: vars.status.negative.fg,
});
