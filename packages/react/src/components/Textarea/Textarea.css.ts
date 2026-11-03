import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/**
 * Перенос reference/src/components/Textarea/Textarea.css один в один.
 * Обрамление поля — подпись, подсказка, ошибка — приходит из
 * reference/src/components/Input/Input.css (.field, .field__label,
 * .field__hint), как у TextField, Select и Radio: в макетах многострочное
 * поле стоит внутри такого же блока поля (patterns/CreateObject).
 *
 * Значения дизайнеров не меняются; технические отличия подписаны по месту.
 */

/** .field { display:flex; flex-direction:column; gap:5px; min-width:200px } */
export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.fieldGap.default,
  minWidth: 200, // .field { min-width: 200px } — структурный минимум формы, не шкала
  // В макетах семейство приходит с body из их общих стилей. Дизайн-система
  // своего ресета потребителю не ставит — задаём явно, как в TextField.
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
  // width:fit-content — как в TextField: иначе клик по пустому месту справа
  // от подписи фокусирует поле.
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
 * .textarea — базовое правило. Размер md, в макетах отдельного
 * `.textarea--md` нет.
 *
 * Состояния читаются с самого элемента: React Aria ставит data-hovered,
 * data-focused, data-focus-visible, data-disabled и data-invalid прямо
 * на <textarea>, поэтому обёртка, как у однострочного поля, не нужна.
 */
export const textarea = style({
  // В макетах действует глобальный box-sizing: border-box из их общих
  // стилей, у системы своего ресета нет — без этого min-height 80px
  // превращается в 82px, а авторост обрезает последнюю строку.
  boxSizing: 'border-box',
  width: '100%',
  minHeight: vars.textarea.minHeight.md,
  paddingBlock: vars.space[4],
  paddingInline: vars.fieldPaddingInline.md,
  background: vars.bg.surface,
  border: `1px solid ${vars.border.default}`,
  borderRadius: vars.radius.sm,

  // font: var(--fw-regular) var(--fs-13)/var(--lh-normal) var(--font-sans)
  fontFamily: vars.fontFamily.sans,
  fontSize: vars.fontSize[13],
  fontWeight: vars.fontWeight.regular,
  lineHeight: vars.lineHeight.normal,
  color: vars.fg.default,

  resize: 'vertical',

  // outline:none в базовом стиле, а не в состоянии: React Aria возвращает
  // фокус программно, браузер считает такой фокус клавиатурным и рисует
  // своё кольцо поверх тени из макетов.
  outline: 'none',

  // transition: border-color var(--dur-fast), box-shadow var(--dur-fast)
  // Кривая не задаётся намеренно: в макетах её нет, значит действует
  // браузерная ease. У TextField на этом месте стоит ease.out — это
  // расхождение с макетами, оно ждёт правки, и повторять его не нужно.
  transitionProperty: 'border-color, box-shadow',
  transitionDuration: vars.duration.fast,

  '::placeholder': {
    color: vars.fg.muted,
  },

  selectors: {
    // .textarea:hover
    '&[data-hovered]': { borderColor: vars.border.strong },

    // .textarea:focus — поле подсвечивается и при работе мышью,
    // поэтому data-focused, а не data-focus-visible.
    '&[data-focused]': {
      borderColor: vars.border.focus,
      boxShadow: vars.focus.ring,
    },

    // .textarea:disabled
    '&[data-disabled]': {
      background: vars.bg.subtle,
      color: vars.fg.disabled,
      cursor: 'not-allowed',
      // WebKit игнорирует color на disabled поле без этого свойства.
      WebkitTextFillColor: vars.fg.disabled,
    },

    // .textarea.is-invalid
    '&[data-invalid]': { borderColor: vars.status.negative.fg },

    // .textarea.is-invalid:focus — в макетах рамка под фокусом остаётся
    // красной. Селектор из двух атрибутов специфичнее одиночного
    // &[data-focused] и перебивает его независимо от порядка объявления.
    '&[data-invalid][data-focused]': {
      borderColor: vars.status.negative.fg,
      boxShadow: vars.focus.ringDanger,
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});

/*
 * .textarea.is-valid { border-color: var(--pos-500) } — не перенесено.
 *
 * Класс описан в макетах, но не ставится ни разметкой самого Textarea,
 * ни паттернами; состояния «проверено и верно» нет ни у одного другого
 * поля системы, и React Aria такого состояния не даёт. Вопрос вынесен
 * в DESIGN.md — вид и способ включения задают дизайнеры.
 */

/**
 * Размеры. Порядок повторяет макет: правила размеров идут после базового
 * и после состояний.
 *
 * .textarea--lg переопределяет только высоту и кегль — горизонтальный
 * отступ остаётся как у md (10px), а не растёт до 12px, как у однострочного
 * поля. Поэтому здесь fieldPaddingInline.md, а не .lg.
 */
export const size = styleVariants({
  sm: {
    minHeight: vars.textarea.minHeight.sm,
    fontSize: vars.fontSize[12],
    paddingBlock: vars.space[3],
    paddingInline: vars.fieldPaddingInline.sm,
  },
  md: {
    minHeight: vars.textarea.minHeight.md,
    fontSize: vars.fontSize[13],
    paddingBlock: vars.space[4],
    paddingInline: vars.fieldPaddingInline.md,
  },
  lg: {
    minHeight: vars.textarea.minHeight.lg,
    fontSize: vars.fontSize[14],
    paddingBlock: vars.space[4],
    paddingInline: vars.fieldPaddingInline.md,
  },
});

/** .textarea--auto — высота считается в JS, ручное растягивание выключено. */
export const autoGrow = style({
  resize: 'none',
  overflow: 'hidden',
});

/** .textarea-wrap */
export const wrap = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
});

/** .textarea__foot */
export const foot = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space[5],
  marginBlockStart: vars.fieldGap.default,
});

/** .field__hint */
export const description = style({
  fontSize: vars.fontSize[11],
  color: vars.fg.muted,
});

/** .textarea__foot .field__hint { flex: 1; min-width: 0 } */
export const footDescription = style({
  flex: 1,
  minWidth: 0,
});

/** .field__hint.is-error */
export const errorMessage = style({
  fontSize: vars.fontSize[11],
  color: vars.status.negative.fg,
});

/** .textarea__count */
export const count = style({
  marginInlineStart: 'auto',
  fontFamily: vars.fontFamily.mono,
  fontSize: vars.fontSize[10],
  color: vars.fg.muted,
  flex: 'none',
  whiteSpace: 'nowrap',
});

/** .textarea__count.is-over */
export const countOver = style({
  color: vars.status.negative.fg,
});
