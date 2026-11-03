import { style, styleVariants, globalStyle } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/**
 * Перенос reference/src/components/Input/Input.css (.input, .field) один в один.
 * Значения дизайнеров не меняются; технические отличия подписаны по месту.
 */

/** .field { display:flex; flex-direction:column; gap:5px; min-width:200px } */
export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.fieldGap.default,
  minWidth: 200, // .field { min-width: 200px } — структурный минимум формы, не шкала
  fontFamily: vars.fontFamily.sans,
});

/** .field__label — цвет fg-default, а не fg-secondary. */
export const label = style({
  fontSize: vars.fontSize[12],
  fontWeight: vars.fontWeight.medium,
  color: vars.fg.default,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  // width:fit-content — иначе клик по пустому месту справа от подписи
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
 * .input — обёртка вокруг поля.
 *
 * В reference стили висят прямо на <input>, а состояния описаны через
 * :hover/:focus/:disabled. Здесь коробка вынесена в обёртку (нужна для
 * префиксов и суффиксов), а состояния читаются с вложенного input через
 * :has() и data-атрибуты React Aria — они отличают наведение мышью
 * от касания пальцем.
 */
export const inputWrapper = style({
  // В макетах действует глобальный box-sizing: border-box (global.css),
  // у системы своего ресета нет — без этого высота 30px превращается в 32px.
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[3],
  height: vars.controlHeight.md,
  paddingInline: vars.fieldPaddingInline.md,
  width: '100%',
  background: vars.bg.surface,
  border: `1px solid ${vars.border.default}`,
  borderRadius: vars.radius.sm,
  color: vars.fg.default,

  transitionProperty: 'border-color, box-shadow',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.ease.out,

  selectors: {
    '&:has(input[data-hovered])': { borderColor: vars.border.strong },
    '&:has(input[data-focused])': {
      borderColor: vars.border.focus,
      boxShadow: vars.focus.ring,
    },
    // .input:disabled { background: var(--bg-subtle) }
    '&:has(input[data-disabled])': {
      background: vars.bg.subtle,
      color: vars.fg.disabled,
      cursor: 'not-allowed',
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});

/** .input.is-invalid */
export const invalid = style({
  borderColor: vars.status.negative.fg,
  selectors: {
    // borderColor повторён: базовый селектор &:has(input[data-focused])
    // специфичнее класса (0,2,1 против 0,1,0) и без повтора перекрашивает
    // рамку невалидного поля в цвет фокуса. В макетах .is-invalid:focus
    // остаётся красным (Input.css:19,21).
    '&:has(input[data-focused])': {
      borderColor: vars.status.negative.fg,
      boxShadow: vars.focus.ringDanger,
    },
  },
});

export const size = styleVariants({
  sm: {
    height: vars.controlHeight.sm,
    fontSize: vars.fontSize[12],
    paddingInline: vars.fieldPaddingInline.sm,
  },
  md: {
    height: vars.controlHeight.md,
    fontSize: vars.fontSize[13],
    paddingInline: vars.fieldPaddingInline.md,
  },
  lg: {
    height: vars.controlHeight.lg,
    fontSize: vars.fontSize[14],
    paddingInline: vars.fieldPaddingInline.lg,
  },
});

export const input = style({
  flex: 1,
  minWidth: 0,
  height: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  fontWeight: vars.fontWeight.regular,
  lineHeight: 1,

  '::placeholder': {
    color: vars.fg.muted,
  },

  selectors: {
    '&[data-disabled]': {
      cursor: 'not-allowed',
      // WebKit игнорирует color на disabled input без этого свойства.
      WebkitTextFillColor: vars.fg.disabled,
    },
  },
});

/** Моноширинный режим для сумм, идентификаторов и кодов. */
export const inputMono = style({
  fontFamily: vars.fontFamily.mono,
  fontVariantNumeric: 'tabular-nums',
});

/** .field__hint */
export const description = style({
  fontSize: vars.fontSize[11],
  color: vars.fg.muted,
});

/** .field__hint.is-error */
export const errorMessage = style({
  fontSize: vars.fontSize[11],
  color: vars.status.negative.fg,
});

/**
 * .input-affix — префикс и суффикс внутри поля.
 *
 * В макетах аффикс лежит абсолютом поверх поля: `.input-wrap` служит
 * системой координат, аффикс прижат к началу строки на 10px, а место под
 * него освобождает `.input-wrap .input` отступом padding-left в 30px;
 * для суффикса те же числа зеркалятся вручную — `.input-wrap.has-suffix`
 * переносит отступ на padding-right, а аффикс к концу строки.
 *
 * Здесь аффикс — обычный элемент flex-строки inputWrapper. Поэтому правила
 * `.input-wrap`, `.input-wrap .input` и обе ветки `.input-wrap.has-suffix`
 * не переносятся: их геометрию даёт раскладка. Числа те же —
 * 10px fieldPaddingInline.md + 14px iconSize.md + 6px space[3] = 30px
 * до текста, одинаково с любой стороны и без ручного зеркалирования на RTL.
 */
export const affix = style({
  display: 'inline-flex',
  alignItems: 'center',
  color: vars.fg.muted,
  flex: 'none',
  pointerEvents: 'none',
});

// .input-wrap .input-affix svg — 14px из макетов, iconSize.md.
globalStyle(`${affix} svg`, {
  width: vars.iconSize.md,
  height: vars.iconSize.md,
});
