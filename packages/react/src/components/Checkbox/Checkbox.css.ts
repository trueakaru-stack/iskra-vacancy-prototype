import { style } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/**
 * Перенос reference/src/components/Checkbox/Checkbox.css (.check, .check--mixed,
 * .check-row) один в один. Значения дизайнеров не меняются; технические
 * отличия подписаны по месту.
 */

/**
 * Глифы галки и черты — из макетов дословно, вместе с белой обводкой.
 * В reference она задана литералом `stroke='white'`, а не переменной: глиф
 * лежит на сплошной заливке primary и в светлой, и в тёмной теме. Заменить
 * литерал токеном нельзя технически — внутри data-URI подстановка var()
 * не работает.
 *
 * Галка экспортируется: её же рисует флажок в пункте Select с выбором
 * нескольких значений — там коробка не RAC Checkbox, а знак у пункта списка.
 */
export const CHECK_GLYPH = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Cpath%20d='M3.5%208.4l2.9%202.9L12.5%205'%20fill='none'%20stroke='white'%20stroke-width='2.2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3C/svg%3E")`;

const MIXED_GLYPH = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Cpath%20d='M4%208h8'%20fill='none'%20stroke='white'%20stroke-width='2.2'%20stroke-linecap='round'/%3E%3C/svg%3E")`;

/**
 * Технической обёртки в макетах нет: там флажок — один `<label class="check-row">`.
 * React Aria держит состояние в CheckboxField и раздаёт его через контекст,
 * без него CheckboxButton не работает. Поэтому обёртка есть, но своей
 * геометрии не создаёт: inline-flex по содержимому, как у `.check-row`.
 *
 * Здесь же лежат data-selected, data-indeterminate, data-disabled,
 * data-readonly, data-invalid и data-required — на корне, а не на строке.
 */
export const field = style({
  display: 'inline-flex',
});

/**
 * .check-row { display: inline-flex; align-items: center; gap: 8px;
 *              font-size: var(--fs-13); cursor: pointer; white-space: nowrap }
 *
 * Объявлена раньше коробки, потому что селекторы состояний коробки на неё
 * ссылаются. На каскад это не влияет: правила относятся к разным элементам.
 */
export const row = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[4],
  fontSize: vars.fontSize[13],
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  // В макетах семейство приходит с body из их глобальных стилей. Дизайн-система
  // своего ресета потребителю не ставит — задаём явно, как в Badge и TextField.
  fontFamily: vars.fontFamily.sans,
});

/**
 * .check — коробка флажка.
 *
 * В макетах стили висят на `<input type="checkbox">` с `appearance: none`.
 * React Aria прячет настоящий input через VisuallyHidden и оставляет
 * `<label><span/>подпись</label>`, поэтому коробка здесь — span, а
 * `appearance: none` и `-webkit-appearance: none` не переносятся: у span
 * нет вида, который они гасят.
 *
 * Состояния читаются с `row`: React Aria держит data-hovered,
 * data-focus-visible, data-selected, data-indeterminate и data-disabled
 * на `<label>`, а не на коробке.
 */
export const box = style({
  // В макетах действует глобальный box-sizing: border-box, поэтому 16px —
  // размер вместе с рамкой. Без явного border-box коробка вырастает до 19px.
  boxSizing: 'border-box',
  width: vars.checkbox.size,
  height: vars.checkbox.size,
  margin: 0,
  border: `1.5px solid ${vars.border.strong}`,
  borderRadius: vars.checkbox.radius,
  background: vars.bg.surface,
  cursor: 'pointer',
  position: 'relative',
  flex: 'none',
  // .check:focus-visible { outline: none } перенесено в базовый стиль:
  // React Aria возвращает фокус программно, браузер считает такой фокус
  // клавиатурным и рисует своё кольцо, а data-focus-visible уже снят.
  outline: 'none',

  // transition: background var(--dur-fast), border-color var(--dur-fast).
  // Кривая в макетах не задана — остаётся браузерная ease.
  transitionProperty: 'background, border-color',
  transitionDuration: vars.duration.fast,

  selectors: {
    // .check:hover { border-color: var(--primary-500) }
    // Примитив --primary-500 в обеих темах равен семантическому
    // action.primary.bg, которым в макетах залит выбранный флажок.
    [`${row}[data-hovered] &`]: {
      borderColor: vars.action.primary.bg,
    },

    // .check:focus-visible { box-shadow: var(--focus-ring) }
    [`${row}[data-focus-visible] &`]: {
      boxShadow: vars.focus.ring,
    },

    // .check:checked, .check--mixed, .check:indeterminate
    [`${row}[data-selected] &, ${row}[data-indeterminate] &`]: {
      backgroundColor: vars.action.primary.bg,
      borderColor: vars.action.primary.bg,
    },

    // .check:checked { background-image: <галка> }
    [`${row}[data-selected] &`]: {
      backgroundImage: CHECK_GLYPH,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: `${vars.checkbox.glyphSize} ${vars.checkbox.glyphSize}`,
    },

    // .check--mixed, .check:indeterminate { background-image: <черта> }
    // Объявлено после галки — как в макетах: у флажка, отмеченного
    // и выбранным, и промежуточным, побеждает черта.
    [`${row}[data-indeterminate] &`]: {
      backgroundImage: MIXED_GLYPH,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: `${vars.checkbox.glyphSize} ${vars.checkbox.glyphSize}`,
    },

    // .check:disabled { opacity: 0.5; cursor: not-allowed }
    // Гасится только коробка: подпись в макетах остаётся обычной.
    [`${row}[data-disabled] &`]: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});
