import { style, styleVariants, keyframes, globalStyle } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';
import { CHECK_GLYPH } from '../Checkbox/Checkbox.css.js';

/**
 * Перенос reference/src/components/Select/Select.css (.dd, .dd__trigger,
 * .dd__pop, .popover__item) один в один.
 *
 * Триггер в reference повторяет коробку .input — здесь так же.
 * Позиционирование поповера отдано React Aria: он переворачивает список
 * у края экрана и учитывает скролл-контейнеры, чего absolute из reference
 * не делает. Размеры, цвета, тени и скругления при этом сохранены.
 */

export const select = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.fieldGap.default,
  minWidth: 0,
  fontFamily: vars.fontFamily.sans,
});

/** .dd__trigger — та же коробка, что и .input */
export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space[3],
  height: vars.controlHeight.md,
  paddingInline: vars.fieldPaddingInline.md,
  width: '100%',
  background: vars.bg.surface,
  border: `1px solid ${vars.border.default}`,
  borderRadius: vars.radius.sm,
  color: vars.fg.default,
  fontFamily: 'inherit',
  fontSize: vars.fontSize[13],
  fontWeight: vars.fontWeight.regular,
  lineHeight: 1,
  // text-align: left → start, иначе на RTL значение прижимается не к той стороне
  textAlign: 'start',
  cursor: 'pointer',

  // outline: none из .input:focus, но без привязки к состоянию: React Aria
  // возвращает фокус на триггер программно, когда список закрывается,
  // и браузер в этот момент рисует своё кольцо поверх нашего.
  outline: 'none',

  transitionProperty: 'border-color, box-shadow',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.ease.out,

  selectors: {
    '&[data-hovered]': { borderColor: vars.border.strong },
    // .input:focus, .input:focus-within — кольцо на любом фокусе, а не только
    // на клавиатурном: триггер повторяет коробку поля, а поля в макетах
    // подсвечиваются и по клику мышью. data-focus-visible здесь не подходит —
    // с ним подсветка пропадает ровно тогда, когда список раскрыт кликом.
    '&[data-focused]': {
      borderColor: vars.border.focus,
      boxShadow: vars.focus.ring,
    },
    // Пока список раскрыт, фокус стоит на пункте, и data-focused с триггера
    // снимается. В reference фокус с кнопки не уходил вовсе — там список
    // лежит в той же разметке, а перебор идёт через aria-activedescendant, —
    // и поле оставалось подсвеченным всё время, пока список открыт.
    // Состояние берётся с data-open: его React Aria ставит на корень Select.
    [`${select}[data-open] &`]: {
      borderColor: vars.border.focus,
      boxShadow: vars.focus.ring,
    },
    '&[data-disabled]': {
      background: vars.bg.subtle,
      color: vars.fg.disabled,
      cursor: 'not-allowed',
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});

/**
 * .dd__trigger.is-invalid
 *
 * Рамка остаётся красной и под фокусом: в макетах `.dd__trigger.is-invalid`
 * весомее, чем `.input:focus`, и перебивает `--border-focus`. Здесь тот же
 * порядок держится тем, что этот блок объявлен после trigger.
 */
export const invalid = style({
  borderColor: vars.status.negative.fg,
  selectors: {
    // .input.is-invalid:focus — тоже на любом фокусе
    '&[data-focused]': {
      borderColor: vars.status.negative.fg,
      boxShadow: vars.focus.ringDanger,
    },
    [`${select}[data-open] &`]: {
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

/** .dd__value */
export const value = style({
  flex: 1,
  minWidth: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[4],
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

/** .dd__placeholder */
export const placeholder = style({
  color: vars.fg.muted,
});

/** .dd__chevron */
export const chevron = style({
  display: 'block',
  alignSelf: 'center',
  color: vars.fg.muted,
  flex: 'none',
  transitionProperty: 'transform',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.ease.out,

  selectors: {
    // Поворот берётся от родителя-триггера: RAC ставит на него data-open.
    '[data-open] &': { transform: 'rotate(180deg)' },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});

/**
 * Размер шеврона. В reference он задан не в CSS, а в разметке:
 * `size={size === 'lg' ? 16 : 14}`.
 */
export const chevronSize = styleVariants({
  sm: { width: vars.iconSize.md, height: vars.iconSize.md },
  md: { width: vars.iconSize.md, height: vars.iconSize.md },
  lg: { width: vars.iconSize.lg, height: vars.iconSize.lg },
});

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

/**
 * .dd__pop
 *
 * Типографика задана явно, хотя в reference у .dd__pop её нет. Там поповер
 * лежит внутри .dd и наследует шрифт от него. React Aria рендерит его
 * в портал на уровне body — наследовать становится не от чего, и список
 * подхватывает шрифт страницы потребителя.
 *
 * То же правило действует для любого портируемого содержимого:
 * Popover, Modal, Tooltip, Menu.
 */
export const popover = style({
  fontFamily: vars.fontFamily.sans,
  fontSize: vars.fontSize[13],
  lineHeight: vars.lineHeight.normal,
  color: vars.fg.default,

  // В макетах border-box стоит глобально на `*`. Без него рамка и поля
  // прибавлялись к габаритам: список выходил на 10px шире триггера,
  // а потолок высоты — на 10px выше 240px.
  boxSizing: 'border-box',
  // min-width:100% из reference. Переменную --trigger-width проставляет RAC.
  minWidth: 'var(--trigger-width)',
  width: 'max-content',
  maxWidth: vars.popover.maxWidth,
  // max-height: 240px из reference здесь не задаётся: React Aria пишет
  // max-height инлайном — по свободному месту на экране, — и класс
  // проигрывает всегда. Потолок уходит в проп maxHeight поповера
  // (Select.tsx), React Aria берёт меньшее из двух.
  overflow: 'auto',
  padding: vars.space[2],
  background: vars.bg.surface,
  border: `1px solid ${vars.border.subtle}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.lg,
  // Слой из общей шкалы, а не магическое число.
  zIndex: vars.layer.dropdown,

  selectors: {
    '&[data-entering]': {
      animation: `${fadeIn} ${vars.duration.fast} ${vars.ease.out}`,
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

export const listBox = style({
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
});

/** .popover__item */
export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[4],
  paddingBlock: vars.space[3],
  paddingInline: vars.fieldPaddingInline.md,
  fontSize: vars.fontSize[13],
  color: vars.fg.default,
  cursor: 'pointer',
  borderRadius: vars.radius.xs,
  outline: 'none',

  selectors: {
    // data-focused покрывает и наведение мышью, и перемещение стрелками —
    // в reference это два отдельных состояния (:hover и .is-highlighted).
    '&[data-focused]': { background: vars.bg.hover },
    '&[data-selected]': {
      background: vars.action.primary.bgSubtle,
      color: vars.action.primary.fg,
    },
    '&[data-disabled]': { opacity: 0.45, pointerEvents: 'none' },
  },
});

/** .popover__item--stacked — пункт с описанием: строка выше и выключка по верху */
export const itemStacked = style({
  alignItems: 'flex-start',
  paddingBlock: vars.space[4],
});

/** .popover__item__lead — слот под иконку или аватар перед названием */
export const itemLead = style({
  display: 'inline-flex',
  width: vars.iconSize.lg,
  flex: 'none',
  justifyContent: 'center',
});

/** .dd__option-body */
export const optionBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[1],
  minWidth: 0,
  flex: 1,
});

/** .dd__option-label */
export const optionLabel = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',

  selectors: {
    // .popover__item--stacked .dd__option-label
    [`${itemStacked} &`]: { fontWeight: vars.fontWeight.medium },
  },
});

/** .dd__option-desc */
export const optionDescription = style({
  fontSize: vars.fontSize[11],
  color: vars.fg.muted,

  selectors: {
    // .popover__item.is-selected .dd__option-desc
    [`${item}[data-selected] &`]: {
      color: vars.action.primary.fg,
      opacity: 0.7,
    },
  },
});

/** .dd__check — отметка выбранного пункта */
export const check = style({
  // margin-left: auto → логическое свойство: на RTL галка должна уходить влево
  marginInlineStart: 'auto',
  display: 'inline-flex',
  color: vars.action.primary.fg,
  flex: 'none',
});

export const label = style({
  fontSize: vars.fontSize[12],
  fontWeight: vars.fontWeight.medium,
  color: vars.fg.default,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  width: 'fit-content',
});

export const description = style({
  fontSize: vars.fontSize[11],
  color: vars.fg.muted,
});

export const errorMessage = style({
  fontSize: vars.fontSize[11],
  color: vars.status.negative.fg,
});

// Иконки, которые потребитель кладёт прямо в пункт. Вложенные в itemLead
// не трогаем: там свой слот шириной 16px, и содержимое приходит со своим
// размером — аватар в reference крупнее иконки.
globalStyle(`${item} > svg`, {
  width: vars.iconSize.md,
  height: vars.iconSize.md,
  flex: 'none',
});

globalStyle(`${check} svg`, {
  width: vars.iconSize.md,
  height: vars.iconSize.md,
});

// Описание пункта показывается только в списке. В триггер React Aria
// переносит содержимое выбранного пункта целиком — в reference там
// стоял один label.
globalStyle(`${value} [slot="description"]`, {
  display: 'none',
});

/* ================== Выбор нескольких значений ================== */

/*
 * Раздел «Multi-select» витрины, пример «Default — tags inside trigger».
 * Классов у примера нет: триггер, теги, флажки и подвал списка заданы
 * инлайновыми стилями поверх .tag, .check, .popover, .popover__item,
 * .popover__sep и .btn. Значения ниже взяты из этих инлайнов.
 *
 * Разметка разошлась с витриной в одном месте. Там триггер — один
 * `<div role="button">`, и теги с крестиками лежат внутри него: кнопка
 * в кнопке, крестики недоступны с клавиатуры (tabindex="-1"). Здесь коробка —
 * Group React Aria, кнопка Select растянута под ней на всю площадь,
 * а теги — TagGroup поверх кнопки: крестик и Delete работают с клавиатуры,
 * а нажатие в любое место коробки вне крестика по-прежнему открывает список.
 */

/**
 * Коробка мульти-триггера. Состояния повторяют одиночный триггер (.input):
 * у примера витрины наведение, фокус, ошибка и отключение не описаны вовсе —
 * вопрос записан в DESIGN.md.
 */
export const multiTrigger = style({
  // В макетах border-box стоит глобально: min-height 30px — вместе с рамкой.
  boxSizing: 'border-box',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: vars.space[2],
  minHeight: vars.controlHeight.md,
  // padding: 4px 30px 4px 8px — конечное поле держит место под каретку.
  paddingBlock: vars.space[2],
  paddingInlineStart: vars.space[4],
  paddingInlineEnd: vars.select.multiPaddingInlineEnd,
  width: '100%',
  background: vars.bg.surface,
  border: `1px solid ${vars.border.default}`,
  borderRadius: vars.radius.sm,
  color: vars.fg.default,
  fontSize: vars.fontSize[13],
  cursor: 'pointer',

  transitionProperty: 'border-color, box-shadow',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.ease.out,

  selectors: {
    '&[data-hovered]': { borderColor: vars.border.strong },
    // Фокус может стоять и на кнопке, и на теге — коробка подсвечивается
    // в обоих случаях, как .input:focus-within.
    '&[data-focus-within]': {
      borderColor: vars.border.focus,
      boxShadow: vars.focus.ring,
    },
    // Пока список раскрыт, фокус в нём, а не в коробке. См. trigger.
    [`${select}[data-open] &`]: {
      borderColor: vars.border.focus,
      boxShadow: vars.focus.ring,
    },
    '&[data-disabled]': {
      background: vars.bg.subtle,
      color: vars.fg.disabled,
      cursor: 'not-allowed',
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});

/** Ошибка мульти-триггера — как `invalid` у одиночного. */
export const multiInvalid = style({
  borderColor: vars.status.negative.fg,
  selectors: {
    '&[data-focus-within]': {
      borderColor: vars.status.negative.fg,
      boxShadow: vars.focus.ringDanger,
    },
    [`${select}[data-open] &`]: {
      borderColor: vars.status.negative.fg,
      boxShadow: vars.focus.ringDanger,
    },
  },
});

/**
 * Кнопка Select, растянутая на всю коробку. Своего вида у неё нет: видна
 * только подсказка до выбора, а выбранные значения показывают теги поверх.
 * Поля повторяют поля коробки, чтобы подсказка встала там же, где первый тег.
 */
export const multiButton = style({
  position: 'absolute',
  insetBlock: 0,
  insetInline: 0,
  display: 'flex',
  alignItems: 'center',
  margin: 0,
  paddingBlock: 0,
  paddingInlineStart: vars.space[4],
  paddingInlineEnd: vars.select.multiPaddingInlineEnd,
  border: 0,
  borderRadius: 'inherit',
  background: 'transparent',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 1,
  textAlign: 'start',
  cursor: 'inherit',
  // Кольцо фокуса рисует коробка — см. multiTrigger.
  outline: 'none',
});

/** Подсказка до выбора. Выбранные значения здесь только для скринридера. */
export const multiValue = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

/**
 * Обёртки TagGroup и TagList. Их нет в разметке витрины — теги там прямые
 * дети коробки, и `gap` с переносом строк действуют на каждый тег.
 */
export const tagGroup = style({
  display: 'contents',
});

/**
 * .tag в триггере: height 20px, padding 0 4px 0 8px и font-size 11px инлайном
 * поверх 22px и 12px базового тега.
 */
export const multiTag = style({
  minHeight: vars.select.multiTagHeight,
  // Вертикальные поля обнулены инлайном витрины; у базового тега они есть —
  // с ними тег выходил 22px вместо 20px.
  paddingBlock: 0,
  fontSize: vars.fontSize[11],
  // Кнопка Select лежит под тегами: позиционированный элемент без z-index
  // рисуется поверх непозиционированных соседей, и без relative она
  // закрыла бы теги.
  position: 'relative',
  // Нажатие на подпись тега проходит к кнопке под ним и открывает список,
  // как нажатие в любое место коробки в витрине. Крестик нажатие ловит сам.
  pointerEvents: 'none',
});

globalStyle(`${multiTag} button`, {
  pointerEvents: 'auto',
});

/**
 * Каретка расположена по центру высоты поля, в том числе при переносе тегов.
 */
export const multiCaret = style({
  position: 'absolute',
  insetInlineEnd: vars.fieldPaddingInline.md,
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: vars.iconSize.md,
  height: vars.iconSize.md,
  color: vars.fg.muted,
  pointerEvents: 'none',
});

globalStyle(`${multiCaret} > svg`, {
  width: vars.iconSize.md,
  height: vars.iconSize.md,
});

/**
 * .popover с padding 4px, растянутый по триггеру от края до края.
 * Ограничения ширины .dd__pop к нему не относятся: ширину задаёт триггер.
 *
 * Прокручивается список, а не поповер: подвал со счётчиком и кнопками
 * остаётся на месте — так устроен пример «With search, select-all, members»
 * того же раздела, где у поповера flex-колонка и прокрутка у списка.
 */
export const popoverMultiple = style({
  width: 'var(--trigger-width)',
  minWidth: vars.popover.minWidth,
  maxWidth: 'none',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const listBoxMultiple = style({
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
});

/**
 * .check в пункте: 14×14px и margin-right 2px инлайном поверх 16px
 * базового флажка. Коробка — знак у пункта списка, а не отдельный флажок:
 * пункт сам объявляет выбор скринридеру (aria-selected).
 */
export const itemCheckbox = style({
  boxSizing: 'border-box',
  width: vars.select.multiCheckSize,
  height: vars.select.multiCheckSize,
  marginInlineEnd: vars.space[1],
  border: `1.5px solid ${vars.border.strong}`,
  borderRadius: vars.checkbox.radius,
  background: vars.bg.surface,
  flex: 'none',

  transitionProperty: 'background, border-color',
  transitionDuration: vars.duration.fast,

  selectors: {
    // .check:hover — наведение на строку, как у Checkbox.
    [`${item}[data-hovered] &`]: { borderColor: vars.action.primary.bg },
    // .check:checked
    [`${item}[data-selected] &`]: {
      backgroundColor: vars.action.primary.bg,
      borderColor: vars.action.primary.bg,
      backgroundImage: CHECK_GLYPH,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: `${vars.checkbox.glyphSize} ${vars.checkbox.glyphSize}`,
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});

/** .popover__sep над подвалом. */
export const footerSeparator = style({
  // height: 1px → blockSize: линия обязана остаться поперёк письма
  blockSize: '1px',
  flex: 'none',
  background: vars.border.subtle,
  marginBlock: vars.space[2],
});

/** Подвал: padding 6px 10px, flex, gap 8px. */
export const footer = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[4],
  flex: 'none',
  paddingBlock: vars.space[3],
  paddingInline: vars.fieldPaddingInline.md,
});

/** «3 of 6 selected» — .muted, 11px, flex: 1. */
export const footerCount = style({
  flex: 1,
  minWidth: 0,
  fontSize: vars.fontSize[11],
  color: vars.fg.muted,
});
