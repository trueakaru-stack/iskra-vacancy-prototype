import { style } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/*
 * Перенос reference/src/components/Tooltip/Tooltip.css.
 *
 * Селекторы макета и их судьба:
 *
 * `.tip-wrap` — не переносится. Это якорь рукописного позиционирования:
 *   position: relative и inline-flex вокруг триггера. React Aria выносит
 *   тултип порталом на уровень body и считает позицию сам, обёртка вокруг
 *   триггера не нужна.
 *
 * `.tip` — перенесён в `tooltip` ниже. Из базового правила не переносятся
 *   position: absolute (позицию React Aria задаёт инлайн-стилями),
 *   opacity: 0, visibility: hidden и pointer-events: none — скрытого
 *   состояния в порте нет: закрытый тултип размонтирован.
 *
 * `.tip.is-open` — класс открытого состояния не переносится по той же
 *   причине; появление и исчезание закрыты [data-entering]/[data-exiting].
 *
 * `.tip--top`, `.tip--bottom`, `.tip--right`, `.tip--left` — позиция коробки
 *   не переносится: зазор 4px задан пропом offset в Tooltip.tsx значением
 *   из макетов, центрирование по оси триггера — расчёт позиции React Aria.
 *
 * `.tip::after` и четыре правила `.tip--*::after` — перенесены в `arrowGlyph`:
 *   тот же квадрат 8×8 с поворотом 45°, утопленный в коробку на полразмера.
 *   Край и центрирование по оси задаёт контейнер OverlayArrow (React Aria
 *   ставит их инлайн-стилями), полусдвиг внутрь — через translate, потому что
 *   физические поля из макетов запрещены проверкой, а логические зеркалятся
 *   в RTL и разъехались бы с физическим data-placement.
 */

/** `.tip` */
export const tooltip = style({
  // Оверлей уходит порталом на body: наследовать шрифт не от кого, вся
  // типографика задаётся явно. В макетах то же самое давал шорткат font:.
  fontFamily: vars.fontFamily.sans,
  fontSize: vars.fontSize[11],
  lineHeight: vars.lineHeight.snug,
  fontWeight: vars.fontWeight.medium,
  color: vars.fg.inverse,

  background: vars.bg.inverse,
  paddingBlock: vars.tooltip.paddingBlock,
  paddingInline: vars.space[4],
  borderRadius: vars.radius.xs,
  boxShadow: vars.shadow.md,
  whiteSpace: 'normal',
  maxWidth: vars.tooltip.maxWidth,
  zIndex: vars.layer.tooltip,

  // В макетах transition идёт ещё и по visibility — здесь незачем:
  // скрытого состояния нет, размонтирование ждёт конца перехода opacity.
  transition: `opacity ${vars.duration.fast}`,

  selectors: {
    '&[data-entering], &[data-exiting]': { opacity: 0 },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

/** Полусдвиг стрелки внутрь коробки — эквивалент margin -4px из макетов. */
const arrowInsetIn = `calc(${vars.tooltip.arrowSize} / -2)`;
const arrowInsetOut = `calc(${vars.tooltip.arrowSize} / 2)`;

/** `.tip::after` — стрелка: квадрат 8×8, повёрнутый на 45°, цвета коробки. */
export const arrowGlyph = style({
  width: vars.tooltip.arrowSize,
  height: vars.tooltip.arrowSize,
  background: vars.bg.inverse,
  transform: 'rotate(45deg)',

  selectors: {
    // data-placement стоит на контейнере OverlayArrow — прямом родителе.
    // Сторона названа по положению тултипа: при data-placement='top' тултип
    // над триггером, стрелка на нижнем краю коробки, сдвиг — вверх.
    "[data-placement='top'] > &": {
      transform: `translateY(${arrowInsetIn}) rotate(45deg)`,
    },
    "[data-placement='bottom'] > &": {
      transform: `translateY(${arrowInsetOut}) rotate(45deg)`,
    },
    "[data-placement='left'] > &": {
      transform: `translateX(${arrowInsetIn}) rotate(45deg)`,
    },
    "[data-placement='right'] > &": {
      transform: `translateX(${arrowInsetOut}) rotate(45deg)`,
    },
  },
});
