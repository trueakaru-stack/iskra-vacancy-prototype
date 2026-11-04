import { globalStyle, style, styleVariants, keyframes } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/**
 * Перенос reference/src/components/Button/Button.css один в один.
 *
 * Значения не меняются: цвета, отступы, скругления, тени и длительности —
 * ровно те, что задали дизайнеры. Отличия только там, где это требуется
 * технически, и каждое подписано:
 *
 *   — физические свойства заменены логическими (padding-inline вместо
 *     padding-left/right), иначе интерфейс рассыпается на RTL;
 *   — :hover/:active заменены на data-атрибуты React Aria, которые
 *     отличают мышь от касания;
 *   — добавлен блок prefers-reduced-motion.
 *
 * Порядок объявлений повторяет порядок правил в макетах: размеры, затем
 * варианты, затем иконочная кнопка. У классов одинаковая специфичность,
 * побеждает объявленный ниже — ровно как в исходном CSS, где .btn--link
 * стоит после .btn--md и обнуляет его padding и height.
 *
 * Варианты — через styleVariants из ядра, а не через @vanilla-extract/recipes:
 * рецепт отдаёт функцию, которой нужна регистрация сериализатора, а в браузерном
 * условии резолва (так собирает Storybook) регистрация вырезается.
 */
export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space[3],
  height: vars.controlHeight.md,
  // В макетах padding задан сокращённо — `padding: 0 12px`, — и обнуляет
  // в том числе вертикальный. Без явного нуля у <button> остаётся
  // браузерный padding-block: 1px; на вариантах с фиксированной высотой
  // он незаметен, а у link, где height: auto, добавляет 2px.
  paddingBlock: 0,
  paddingInline: vars.buttonPaddingInline.md,
  border: '1px solid transparent',
  borderRadius: vars.radius.lg,
  fontFamily: vars.fontFamily.sans,
  fontSize: vars.fontSize[13],
  fontWeight: vars.fontWeight.medium,
  lineHeight: 1,
  letterSpacing: '-0.005em',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  userSelect: 'none',
  background: 'transparent',
  color: vars.fg.default,
  position: 'relative',

  // Системная обводка гасится всегда, а не только вместе с нашим кольцом:
  // когда фокус возвращается на кнопку программно — после закрытия диалога
  // или поповера, — браузер считает его клавиатурным и рисует своё кольцо,
  // а React Aria знает про мышь и data-focus-visible не выставляет.
  outline: 'none',

  // Кривая в макетах не задана: там сокращённая запись transition без
  // timing-function, то есть ease. Здесь она тоже не задаётся.
  transitionProperty: 'background-color, border-color, color',
  transitionDuration: vars.duration.fast,

  selectors: {
    '&[data-focus-visible]': {
      boxShadow: vars.focus.ring,
    },
    // .btn:disabled { opacity: 0.5; pointer-events: none }
    '&[data-disabled]': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
    // В reference у .btn--loading тоже стоит pointer-events: none, но там это
    // был единственный способ заблокировать клик. React Aria блокирует нажатие
    // в JS и при этом НАМЕРЕННО сохраняет события наведения — чтобы во время
    // операции продолжали работать тултипы. CSS-правило их убило бы, поэтому
    // здесь только курсор: pointer-events: none в макетах отдаёт курсор
    // родителя, то есть обычную стрелку, — её и воспроизводим.
    '&[data-pending]': {
      cursor: 'default',
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0ms',
    },
  },
});

export const size = styleVariants({
  xs: {
    height: vars.controlHeight.xs,
    paddingInline: vars.buttonPaddingInline.xs,
    fontSize: vars.fontSize[11],
    borderRadius: vars.radius.lg,
    gap: vars.space[2],
  },
  sm: {
    height: vars.controlHeight.sm,
    paddingInline: vars.buttonPaddingInline.sm,
    fontSize: vars.fontSize[12],
  },
  md: {
    height: vars.controlHeight.md,
    paddingInline: vars.buttonPaddingInline.md,
    fontSize: vars.fontSize[13],
  },
  lg: {
    height: vars.controlHeight.lg,
    paddingInline: vars.buttonPaddingInline.lg,
    fontSize: vars.fontSize[14],
  },
});

/**
 * Кегль подписи отдельно от размера. Размер задаёт геометрию — высоту
 * и отступы, — а `textSize` меняет только кегль, поэтому кнопка
 * не перерисовывается. В макетах такого пропса нет: ступени взяты из шкалы
 * `fontSize`. Объявлен после `size`: специфичность одинаковая, побеждает
 * нижний.
 */
export const textSize = styleVariants({
  10: { fontSize: vars.fontSize[10] },
  12: { fontSize: vars.fontSize[12] },
  14: { fontSize: vars.fontSize[14] },
  16: { fontSize: vars.fontSize[16] },
});

/**
 * Начертание подписи отдельно от размера. По умолчанию — `medium` из `base`;
 * `regular` нужен там, где макет рисует обычное начертание (кнопки мастеров).
 * Объявлен после `size` по той же причине, что и `textSize`.
 */
export const textWeight = styleVariants({
  regular: { fontWeight: vars.fontWeight.regular },
  medium: { fontWeight: vars.fontWeight.medium },
});

/**
 * Зазор между иконкой и подписью отдельно от размера. Ключи — пиксели,
 * значения — ступени шкалы `space`.
 */
export const gap = styleVariants({
  4: { gap: vars.space[2] },
  6: { gap: vars.space[3] },
  8: { gap: vars.space[4] },
});

/**
 * Состояние нажатия в макетах описано только у primary и secondary
 * (.btn--primary:active, .btn--secondary:active). Остальным вариантам оно
 * достроено по той же шкале, что и у описанных: заливка — на шаг темнее
 * наведения, у link — цвет текста. Значения берутся из токенов `bgActive`
 * и `fgActive`, там же записано, что в макетах их нет.
 */
export const variant = styleVariants({
  primary: {
    background: vars.action.primary.bg,
    color: vars.fg.onPrimary,
    selectors: {
      '&[data-hovered]': { background: vars.action.primary.bgHover },
      '&[data-pressed]': { background: vars.action.primary.bgActive },
    },
  },

  secondary: {
    background: vars.bg.surface,
    borderColor: vars.border.default,
    color: vars.fg.default,
    selectors: {
      '&[data-hovered]': { background: vars.bg.hover, borderColor: vars.border.strong },
      '&[data-pressed]': { background: vars.bg.active },
    },
  },
  ghost: {
    color: vars.fg.secondary,
    selectors: {
      '&[data-hovered]': { background: vars.bg.hover, color: vars.fg.default },
      '&[data-pressed]': { background: vars.bg.active, color: vars.fg.default },
    },
  },


});

/** Квадратная кнопка: ширина равна высоте своего размера. */
export const iconOnly = styleVariants({
  xs: { paddingInline: 0, width: vars.controlHeight.xs },
  sm: { paddingInline: 0, width: vars.controlHeight.sm },
  md: { paddingInline: 0, width: vars.controlHeight.md },
  lg: { paddingInline: 0, width: vars.controlHeight.lg },
});

export const fullWidth = style({ width: '100%' });

/**
 * Обёртка содержимого. Нужна только для того, чтобы гасить подпись
 * на время загрузки, и потому не создаёт собственного бокса: в макетах
 * иконка и подпись — прямые дети кнопки, то есть отдельные флекс-элементы.
 * Любой другой display склеил бы их в один элемент, и тогда до них
 * не доходят ни gap, ни align-items: center — иконка садится на базовую
 * линию текста.
 */
export const content = style({
  display: 'contents',
});

/**
 * Содержимое кнопки во время загрузки.
 *
 * В reference применён `color: transparent !important`. Визуально результат
 * тот же, но для скринридера подпись остаётся видимой — при этом её не видно
 * глазами. visibility даёт идентичную картинку и убирает содержимое
 * из дерева доступности. Наследуется вглубь, поэтому работает и на обёртке
 * без бокса. Ширина кнопки в обоих случаях сохраняется, поэтому форма
 * при нажатии не прыгает.
 */
export const contentPending = style({
  visibility: 'hidden',
});

const spin = keyframes({ to: { transform: 'rotate(360deg)' } });

/**
 * Спиннер. Значения из reference: 14px, рамка 2px, 0.6s linear.
 * border-right-color заменён на логический borderInlineEndColor —
 * иначе на RTL спиннер крутится «разорванным» не с той стороны.
 */
export const pendingOverlay = style({
  position: 'absolute',
  insetInlineStart: '50%',
  insetBlockStart: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'inline-flex',
});

export const pendingSpinner = style({
  // Цвет спиннера в макетах задан отдельно от цвета кнопки: по умолчанию
  // fg.onPrimary, у secondary и ghost — fg.default. Для link макеты
  // оставляют умолчание, то есть белый на прозрачном фоне.
  color: vars.fg.onPrimary,
  // ProgressBar из RAC — обычный блок, и <span> внутри него остаётся
  // строчным. К строчному элементу width и height не применяются:
  // рамка схлопывается в вертикальную дугу вместо круга.
  display: 'block',
  // В макетах действует глобальный box-sizing: border-box, поэтому 14px —
  // внешний диаметр вместе с рамкой. Дизайн-система своего ресета
  // на страницу потребителя не ставит, значит нужно задать здесь:
  // без этого круг вырастает до 18px.
  boxSizing: 'border-box',
  width: vars.iconSize.md,
  height: vars.iconSize.md,
  border: '2px solid currentColor',
  borderInlineEndColor: 'transparent',
  borderRadius: '50%',
  animation: `${spin} 0.6s linear infinite`,

  selectors: {
    [`${variant.secondary} &`]: { color: vars.fg.default },
    [`${variant.ghost} &`]: { color: vars.fg.default },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
      borderInlineEndColor: 'currentColor',
      opacity: 0.5,
    },
  },
});

/** .btn-group — сомкнутый ряд кнопок. */
export const buttonGroup = style({
  display: 'inline-flex',
});

// .btn-group .btn — стыковка кнопок в группе: vanilla-extract намеренно
// запрещает целиться в потомков из style(), поэтому здесь globalStyle.
// Селектор берёт любого потомка, а не только кнопку: в группу кладут
// и ToggleButton, и ссылку. Радиусы и отрицательный отступ переведены
// в логические свойства — на RTL скругления сами переезжают на нужную
// сторону. Внешние углы в макетах заданы жёстко radius.sm, независимо
// от размера кнопки.
globalStyle(`${buttonGroup} > *`, {
  borderRadius: 0,
  marginInlineStart: -1,
});

// .btn-group .btn:first-child — внешние углы в начале ряда.
globalStyle(`${buttonGroup} > *:first-child`, {
  borderStartStartRadius: vars.radius.lg,
  borderEndStartRadius: vars.radius.lg,
  marginInlineStart: 0,
});

// .btn-group .btn:last-child — внешние углы в конце ряда.
globalStyle(`${buttonGroup} > *:last-child`, {
  borderStartEndRadius: vars.radius.lg,
  borderEndEndRadius: vars.radius.lg,
});

globalStyle(`${base} svg`, {
  width: vars.iconSize.md,
  height: vars.iconSize.md,
});
