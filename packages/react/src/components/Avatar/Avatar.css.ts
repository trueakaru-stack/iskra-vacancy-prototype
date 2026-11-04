import { style, styleVariants, globalStyle } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/*
 * Перенос reference/src/components/Avatar/Avatar.css.
 *
 * Кастом-свойства --avatar-c1..c5 из макетов (блоки :root / [data-theme])
 * переехали в токены: vars.avatar.c1..c5. Светлая тема — те же literal-значения,
 * тёмная — те же color-mix поверх живого bg.surface. В компоненте палитра
 * применяется вариантами `palette` ниже.
 */

/** .avatar */
export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  // В макетах действует глобальный box-sizing: border-box. В стеке аватар
  // получает рамку 2px, и без явного border-box вырос бы с 28 до 32px.
  boxSizing: 'border-box',
  width: vars.avatar.size.md,
  height: vars.avatar.size.md,
  borderRadius: '50%',
  // --primary-bg-subtle / --primary-fg из макетов.
  background: vars.action.primary.bgSubtle,
  color: vars.action.primary.fg,
  // В макетах шрифт задан сокращённо: font: <вес> <кегль>/1 <семейство>.
  // Сокращение сбрасывает ещё и начертание с растяжением — переносим
  // все longhand'ы, иначе аватар внутри <em> наклонится.
  fontFamily: vars.fontFamily.sans,
  fontSize: vars.avatar.fontSize.md,
  fontWeight: vars.fontWeight.semibold,
  lineHeight: '1',
  fontStyle: 'normal',
  fontVariant: 'normal',
  fontStretch: 'normal',
  textTransform: 'uppercase',
  // Шкалы межбуквенных интервалов в токенах нет; значение из .avatar.
  letterSpacing: '0.04em',
  flex: 'none',
  position: 'relative',
});

/** .avatar--sm / --md / --lg / --xl. Кегль инициалов привязан к размеру. */
export const size = styleVariants({
  sm: {
    width: vars.avatar.size.sm,
    height: vars.avatar.size.sm,
    fontSize: vars.avatar.fontSize.sm,
  },
  // .avatar--md повторяет базовые значения .avatar — переопределять нечего.
  md: {},
  lg: {
    width: vars.avatar.size.lg,
    height: vars.avatar.size.lg,
    fontSize: vars.avatar.fontSize.lg,
  },
  xl: {
    width: vars.avatar.size.xl,
    height: vars.avatar.size.xl,
    fontSize: vars.avatar.fontSize.xl,
  },
});

/** .avatar--square — воркспейсы и проекты; круг остаётся людям. */
export const square = style({
  borderRadius: vars.radius.lg,
});

// .avatar > img — картинка заполняет весь аватар и наследует скругление.
globalStyle(`${base} > img`, {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 'inherit',
  display: 'block',
});

/**
 * .avatar__status — точка статуса поверх нижнего края.
 *
 * В макетах позиция задана физически: right/bottom −1px. Здесь — логические
 * свойства: на RTL точка уходит к нижнему началу строки вместе с остальной
 * вёрсткой. Расхождение записано в DESIGN.md.
 */
export const status = style({
  position: 'absolute',
  insetInlineEnd: '-1px',
  insetBlockEnd: '-1px',
  width: vars.avatar.statusSize,
  height: vars.avatar.statusSize,
  // 8px в макетах — размер вместе с рамкой 2px (глобальный border-box):
  // без явного border-box точка раздувается до 12px.
  boxSizing: 'border-box',
  borderRadius: '50%',
  background: vars.status.positive.fg,
  border: `2px solid ${vars.bg.surface}`,
});

/**
 * .avatar__status--online / --busy / --offline.
 *
 * В макетах — примитивы --pos-500 / --warn-500 / --neutral-400. Здесь
 * семантика с теми же значениями: status.positive.fg, status.warning.fg
 * и avatar.statusOffline — примитив в компоненте не пережил бы тему
 * потребителя. В отличие от макетов цвета не переворачиваются конвенцией
 * data-direction="ea":
 * в системе направление меняет только trend.*, статусы стабильны.
 * Вопрос дизайнерам — в DESIGN.md.
 */
export const statusVariant = styleVariants({
  online: { background: vars.status.positive.fg },
  busy: { background: vars.status.warning.fg },
  offline: { background: vars.avatar.statusOffline },
});

/** .avatar-stack — перекрывающийся ряд аватаров. */
export const stack = style({
  display: 'inline-flex',
});

// .avatar-stack .avatar — рамка цвета подложки отделяет аватары,
// перекрытие −8px задаёт шаг ряда. margin-left из макетов — логическим
// свойством, чтобы ряд зеркалился на арабском.
globalStyle(`${stack} ${base}`, {
  border: `2px solid ${vars.bg.surface}`,
  marginInlineStart: `calc(${vars.space[4]} * -1)`,
});

// .avatar-stack .avatar:first-child — первый в ряду без сдвига.
globalStyle(`${stack} ${base}:first-child`, {
  marginInlineStart: '0',
});

/** .avatar--c1..--c5 — палитра идентичности, значения в vars.avatar. */
export const palette = styleVariants({
  c1: { background: vars.avatar.c1.bg, color: vars.avatar.c1.fg },
  c2: { background: vars.avatar.c2.bg, color: vars.avatar.c2.fg },
  c3: { background: vars.avatar.c3.bg, color: vars.avatar.c3.fg },
  c4: { background: vars.avatar.c4.bg, color: vars.avatar.c4.fg },
  c5: { background: vars.avatar.c5.bg, color: vars.avatar.c5.fg },
});
