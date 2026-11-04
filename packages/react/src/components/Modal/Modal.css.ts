import { createVar, keyframes, style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/*
 * Перенос reference/src/components/Modal/Modal.css.
 *
 * Селекторы макета и их судьба:
 *
 * `.modal-backdrop` — перенесён в `backdrop` (ModalOverlay React Aria).
 *   Правила совпадают с `.dialog-backdrop` вплоть до значения, но остаются
 *   своими: подложка описана в CSS каждого компонента отдельно.
 * `.modal` — перенесён в `modal` (Modal React Aria). position: relative
 *   и z-index var(--z-modal) макета сохранены как есть.
 * `.modal:focus-visible, .modal:focus { outline: none }` — перенесён
 *   в `surface`: фокус при открытии React Aria ставит на элемент Dialog
 *   (section внутри коробки), а не на саму коробку. outline: none стоит
 *   в базовом стиле — программный возврат фокуса браузер считает
 *   клавиатурным и иначе рисует своё кольцо.
 * `.modal__head`, `.modal__title`, `.modal__body`, `.modal__foot` —
 *   перенесены одноимёнными стилями ниже.
 * `.modal--sm`, `.modal--md`, `.modal--lg` — перенесены в `size`
 *   (400/480/640px; ширина 480px из базового `.modal` живёт в size.md
 *   и является умолчанием компонента).
 * `@keyframes nb-modal-backdrop-in`, `@keyframes nb-modal-in` —
 *   перенесены в `backdropIn` / `modalIn`.
 *
 * Кнопка закрытия в разметке reference несёт классы из Button.css:
 * `.btn`, `.btn--ghost`, `.btn--icon`, `.btn--sm` — вместе со своими
 * состояниями (`.btn--ghost:hover`, `.btn:disabled`, `.btn:focus-visible`).
 * Сюда они не переносятся: шапка собирается из нашего компонента Button,
 * эти правила уже перенесены в Button.css.ts вместе с состояниями
 * data-hovered / data-pressed / data-focus-visible / data-disabled.
 *
 * `.modal:focus-visible` и `.modal:focus` гасят обводку в обоих
 * состояниях сразу, поэтому селекторы data-focused / data-focus-visible
 * не нужны: outline: none стоит безусловно в базовом стиле `surface`.
 */

const backdropIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const modalIn = keyframes({
  // 4px подъёма из макета лежит на шкале: space.2.
  from: { opacity: 0, transform: `translateY(${vars.space[2]}) scale(0.98)` },
  to: { opacity: 1, transform: 'none' },
});

/** `.modal-backdrop` — фон подложки в макете задан той же формулой,
 *  что и у Dialog (42% fg-default поверх прозрачного): токен
 *  dialog.backdropBg переиспользуется, отдельный не заводится. */
export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: vars.layer.overlay,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space[7],
  background: vars.dialog.backdropBg,
  animation: `${backdropIn} ${vars.duration.base} ${vars.ease.out}`,

  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

/**
 * Подложка по пропсу `backdrop`. Объявлена после `backdrop`: специфичность
 * одинаковая, побеждает нижний. Значения `default` здесь нет — это сам `backdrop`.
 *
 * `blur` — подложка макетов каталога: тот же цвет, что у умолчания, но
 * плотностью `modal.backdropBlurAlpha` (30%) и размытие фона на
 * `modal.backdropBlurRadius` (5px — радиус 10 из эффекта Background blur
 * макета; CSS-эквивалент радиуса Figma — его половина).
 * `transparent` — без затемнения, для верхнего окна стопки.
 */
export const backdropVariant = styleVariants({
  blur: {
    background: `color-mix(in srgb, ${vars.fg.default} ${vars.modal.backdropBlurAlpha}, transparent)`,
    WebkitBackdropFilter: `blur(${vars.modal.backdropBlurRadius})`,
    backdropFilter: `blur(${vars.modal.backdropBlurRadius})`,
  },
  transparent: {
    background: 'transparent',
  },
});

/**
 * Габариты, которые задаёт `Modal` пропсами `width` и `height`. Значение
 * подставляется инлайном; сами размеры `xl` и `full` тоже идут через них.
 */
export const widthVar = createVar();
export const heightVar = createVar();

/** `.modal` — без ширины: она приходит из `size` ниже. */
export const modal = style({
  position: 'relative',
  zIndex: vars.layer.modal,
  background: vars.bg.surface,
  border: `1px solid ${vars.border.subtle}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.xl,
  maxWidth: '100%',
  overflow: 'hidden',
  animation: `${modalIn} ${vars.duration.base} ${vars.ease.out}`,

  // Ширина задана вместе с рамкой 1px; в макетах размер держал
  // глобальный ресет box-sizing, у нас его нет.
  boxSizing: 'border-box',

  // Оверлей уходит порталом на body: наследовать типографику не от кого,
  // база задаётся явно (в макетах приходила со страницы). Кегль и цвет —
  // плотная база текста макетов; заголовок и тело перекрывают своими.
  fontFamily: vars.fontFamily.sans,
  fontSize: vars.fontSize[13],
  lineHeight: vars.lineHeight.normal,
  color: vars.fg.default,

  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

/** `.modal--sm` / `.modal--md` / `.modal--lg` — 400/480/640px. */
export const size = styleVariants({
  sm: { width: vars.modal.width.sm },
  md: { width: vars.modal.width.md },
  lg: { width: vars.modal.width.lg },
  // 1296px — ширина большого окна макетов каталога, токен modal.width.xl.
  xl: { width: vars.modal.width.xl },
  // Во всю область подложки (внутри её полей) по обеим осям.
  full: {
    vars: { [widthVar]: '100%', [heightVar]: '100%' },
    width: widthVar,
    height: heightVar,
  },
});

/** Ширина из пропса `width`. Объявлена после `size`: побеждает нижний. */
export const customWidth = style({
  width: widthVar,
});

/**
 * Высота из пропса `height`. Коробка больше не растёт по содержимому,
 * но и не вылезает за подложку.
 */
export const customHeight = style({
  height: heightVar,
  maxHeight: '100%',
});

/** Скругление коробки: ступени шкалы `radius`, умолчание — `lg`. */
export const radius = styleVariants({
  none: { borderRadius: '0px' },
  xs: { borderRadius: vars.radius.lg },
  sm: { borderRadius: vars.radius.lg },
  md: { borderRadius: vars.radius.lg },
  lg: { borderRadius: vars.radius.lg },
  xl: { borderRadius: vars.radius.lg },
  '2xl': { borderRadius: vars.radius.lg },
});

/** `.modal:focus-visible, .modal:focus` — outline: none. Элемент Dialog
 *  React Aria (section) получает фокус при открытии вместо коробки макета. */
export const surface = style({
  outline: 'none',
});

/**
 * Окно фиксированной высоты: поверхность растягивается на коробку, тело
 * (`bodyFill` ниже) забирает остаток и прокручивается внутри, шапка и подвал
 * на месте. Объявлен после `surface`: побеждает нижний.
 */
export const surfaceFill = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

/** `.modal__head` — padding 14px 18px: вертикальные 14px и горизонтальные
 *  18px не лежат на шкале space — токены modal.headPaddingBlock
 *  и modal.paddingInline. */
export const head = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBlock: vars.modal.headPaddingBlock,
  paddingInline: vars.modal.paddingInline,
  borderBlockEnd: `1px solid ${vars.border.subtle}`,
});

/** `.modal__title` — рендерится заголовком (Heading slot="title", h2),
 *  браузерные поля заголовка обнуляются — в макетах был div без полей. */
export const title = style({
  fontSize: vars.fontSize[15],
  fontWeight: vars.fontWeight.semibold,
  margin: 0,
});

/** `.modal__body` — padding 16px 18px: вертикальные 16px — space.6,
 *  горизонтальные — modal.paddingInline. Прокрутка внутри, не выше 70vh. */
export const body = style({
  paddingBlock: vars.space[6],
  paddingInline: vars.modal.paddingInline,
  fontSize: vars.fontSize[13],
  color: vars.fg.secondary,
  lineHeight: vars.lineHeight.relaxed,
  maxHeight: vars.modal.bodyMaxHeight,
  overflowY: 'auto',
});

/** Тело окна фиксированной высоты. Объявлено после `body`: побеждает нижний. */
export const bodyFill = style({
  flex: '1 1 auto',
  minHeight: 0,
  maxHeight: 'none',
});

/** `.modal__foot` — padding 12px 18px: вертикальные 12px — space.5,
 *  горизонтальные — modal.paddingInline; зазор 8px — space.4. */
export const foot = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space[4],
  paddingBlock: vars.space[5],
  paddingInline: vars.modal.paddingInline,
  borderBlockStart: `1px solid ${vars.border.subtle}`,
  background: vars.bg.subtle,
});
