import { createVar, fallbackVar, style, styleVariants, globalStyle } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';
import * as checkboxCss from '../Checkbox/Checkbox.css.js';
import * as avatarCss from '../Avatar/Avatar.css.js';

/*
 * Перенос раздела «Data Table» собранной витрины макетов; вторая форма
 * спецификации — reference/src/components/DataTable/DataTable.css.
 * Формы разошлись в девяти местах — все записаны в DESIGN.md, раздел
 * DataTable. Там, где расхождение есть, взята витрина.
 *
 * Селекторы макета и их судьба:
 *
 * `.dt-wrap`                          → `root`
 * `.dt-scroll`                        → `scroll`
 * `.dt-scroll > .dt`                  → `table` (min-inline-size; только витрина)
 * `.dt`                               → `table`
 * `.dt thead th`                      → `column`
 * `.dt thead th.num`                  → `column`, вариант `numeric`
 * `.dt thead.is-sticky`               → `stickyHeader`
 * `.dt thead th .sort`                → `sortLabel`
 * `.dt thead th.num .sort`            → `sortLabel`, вариант `numeric`
 * `.dt thead th .sort .ti`            → `sortIcon`
 * `.sort-ic`                          → `sortIcons`
 * `.sort-ic .ti`                      → `sortIcon`
 * `.sort-ic__dir`                     → `sortIconDir`
 * `.dt thead th.sortable`             → `column`, селектор `[data-allows-sorting]`
 * `.dt thead th.sortable:hover`       → `column`, селектор `[data-allows-sorting][data-hovered]`
 * `.dt thead th.sortable .sort-ic__neutral`       → `sortIconNeutral`
 * `.dt thead th.sortable:hover .sort-ic__neutral` → `sortIconNeutral`, селектор `[data-hovered] &`
 * `.dt thead th.sortable.is-sorted .sort-ic__neutral` → `sortIconNeutral`, селектор `[data-sort-direction] &`
 * `.dt thead th.sortable.is-sorted .sort-ic__dir`     → `sortIconDir`, селектор `[data-sort-direction] &`
 * `.dt thead th.sortable.sort-desc .sort-ic__dir`     → `sortIconDir`, селектор `[data-sort-direction="descending"] &`
 * `.dt thead th.sortable:focus-visible`               → `column`, селектор `[data-focus-visible]`
 * `.dt-tree-cell`                     → `treeCell`
 * `.dt-tree-indent`                   → `treeIndent`
 * `.dt-tree-toggle`                   → `treeToggle`
 * `.dt-tree-toggle:hover`             → `treeToggle`, селектор `[data-hovered]`
 * `.dt-tree-toggle:focus-visible`     → `treeToggle`, селектор `[data-focus-visible]`
 * `.dt-tree-toggle .ti`               → `treeToggleIcon`
 * `.dt tr.is-expanded > td .dt-tree-toggle .ti` → `treeToggleIcon`, селектор `[data-expanded] &`
 * `.dt-tree-leaf`                     → `treeLeaf`
 * `.dt tr.dt-child > td`              → `cell`, селектор `[data-level]:not([data-level='1'])`
 * `.dt tr.dt-child:hover > td`        → `cell`, тот же селектор под `[data-hovered]` строки
 * `.dt tbody td`                      → `cell`
 * `.dt th:has(> .check)` → `column`, селектор `&:has(> ...)`
 * `.dt td:has(> .check)` → `cell`, селектор `&:has(> ...)`
 * `.dt--compact tbody td`             → `density.compact`
 * `.dt--dense tbody td`               → `density.dense`
 * `.dt--cozy tbody td`                → `density.cozy`
 * `.dt tbody td.num`                  → `cellNumeric`
 * `.dt tbody tr:hover`                → `row`, селектор `[data-hovered]`
 * `.dt tbody tr.is-selected`          → `row`, селектор `[data-selected]`
 * `.dt tbody tr:last-child td`        → `cell`, селектор `:last-child`
 * `.dt tbody tr.is-clickable`         → `row`, селектор `[data-hovered]` (курсор)
 * `.dt tbody tr.is-clickable:focus-visible` → `row`, селектор `[data-focus-visible]`
 * `.dt .pos`                          → `variant.positive`
 * `.dt .neg`                          → `variant.negative`
 * `.dt--rich tbody td`                → `richDensity.*`
 * `.dt--rich.dt--dense tbody td`      → `richDensity.dense`
 * `.dt--rich.dt--cozy tbody td`       → `richDensity.cozy`
 * `.dt-user`                          → `user`
 * `.dt-user__meta`                    → `userMeta`
 * `.dt-user__name`                    → `userName`
 * `.dt-user__sub`                     → `userSub`
 * `.dt-cell`                          → `text`
 * `.dt-cell__title`                   → `textTitle`
 * `.dt-cell__sub`                     → `textSub`
 * `.dt-inline`                        → `inline`
 * `.dt-inline > .ti`                  → `globalStyle` на прямую иконку
 * `.dt-link`                          → `link`
 * `.dt-link:hover`                    → `link`, селектор `[data-hovered]`
 * `.dt-link .ti`                      → `globalStyle` на глиф внутри ссылки
 * `.dt-time`                          → `time`
 * `.dt-time__rel`                     → `timeRelative`
 * `.dt-time__abs`                     → `timeAbsolute`
 * `.dt-toolbar`                       → `toolbar`
 * `.dt-footer`                        → `footer`
 * `.dt-empty`                         → `globalStyle` на ячейку тела с `data-empty`
 * `.dt-empty__msg`                    → `emptyMessage`
 * `.dt-reorder tbody tr`              → `draggableRow`
 * `.dt-reorder tbody tr.is-dragging`  → `draggableRow`, селектор `[data-dragging]`
 * `.dt-reorder tbody tr.is-dragging .dt-grip` → `dragHandle`, селектор `${draggableRow}[data-dragging] &`
 * `.dt-reorder td.dt-handle`          → `dragHandleCell`
 * `.dt-reorder .dt-grip`              → `dragHandle`
 * `.dt-reorder .dt-grip:hover`        → `dragHandle`, селектор `[data-hovered]`
 * `.dt-reorder .dt-grip .ti`          → `dragHandleIcon`
 * `.dt-reorder svg.dt-grip`           → `dragHandle` (размер и поля) + `dragHandleIcon`
 * `.dt-reorder td.dt-rank`            → `rankCell`
 *
 * Не переносится:
 *
 * `.dt tr.dt-child`, `.dt tr.dt-child.is-visible` — свёрнутая ветка прячется
 * через `display: none`. Так устроена статичная витрина: все строки лежат
 * в разметке сразу, скрипт страницы переключает класс. React Aria свёрнутых
 * потомков не отрисовывает вовсе — прятать нечего. Тон самой строки-потомка
 * (`.dt tr.dt-child > td`) перенесён.
 *
 * `.dt tbody tr.is-removing` — исчезновение строки после действия в меню.
 * Поведение демонстрации витрины, а не компонента: ни в таблице Props,
 * ни в reference/src его нет. Кто удаляет строку, тот и анимирует.
 *
 * `.dt tbody tr.is-menu-open` — подсветка строки, пока открыто её меню
 * действий. Состояние принадлежит меню, а не таблице: строка о нём
 * не знает. Записано в DESIGN.md как вопрос.
 *
 * `.dt th:has(> .radio)`, `.dt td:has(> .radio)` — вторая половина правила
 * про колонку выделения. Выбор одной строки React Aria строит на том же
 * флажке, что и выбор многих: переключателя в его табличном API нет.
 * Записано в DESIGN.md как расхождение.
 *
 * `.dt tbody td.time` — правая колонка времени: `text-align: right`,
 * `tabular-nums`, `white-space: nowrap`. Только витрина, и это набор
 * из `align="end"` у колонки и блока `.dt-time`, а не отдельная сущность.
 *
 * `.dt-toolbar__left`, `.dt-toolbar__right` — левая и правая группы панели.
 * Только витрина. Панель и подвал принимаются узлами (`toolbar`, `footer`),
 * и что в них лежит — дело вызывающего: `justify-content: space-between`
 * разводит два узла по краям без дополнительных классов.
 *
 * `.dt .actions` — колонка действий, 64px и выравнивание по краю.
 * Значение живёт в токене `dataTable.actionsColumnWidth` и приходит
 * пропсами колонки: `<DataTableColumn width={…} align="end">`.
 * Отдельного класса компонент не ставит — в композиции колонка действий
 * ничем не отличается от любой другой узкой колонки.
 *
 * `.dt-demo …` — два правила витрины на цвет иконки сортировки. `.dt-demo`
 * принадлежит странице витрины, а не таблице; значения совпадают
 * с `.sort-ic` и повторять их нечем.
 *
 * `.dt-reorder.is-reordering` — запрет выделения текста на время
 * перетаскивания. Витрина ставит класс своим скриптом на всю таблицу;
 * React Aria гасит выделение сама, пока идёт перетаскивание.
 *
 * `.dt td.dt-edit…` и `.dt-edit-pop…` (18 правил), `.sort-handle`,
 * `.dt-mini-spark` — правка ячейки на месте и общая ручка сортировки
 * списков. Демонстрации есть на витрине, но ни одного пропса под них
 * таблица Props не объявляет, и в reference/src их нет. Записано
 * в DESIGN.md как «осталось за кадром».
 *
 * Что добавлено сверх правил `.dt*` — с причинами:
 *
 * 1. `box-sizing: border-box` у кнопки-шеврона дерева. Глобальные стили
 *    макетов объявляют его на `*`, в системе такого сброса нет: 18×18px
 *    вместе с рамкой дали бы больше 18px. Рамки у кнопки нет, но размер
 *    задан явно — правило страхует от рамки, приехавшей из темы потребителя.
 *
 * 2. Наведение на строку продублировано под `@media (hover: hover)`.
 *    React Aria ставит `data-hovered` только там, где строка что-то делает:
 *    есть выделение или `onRowAction`. В макетах `.dt tbody tr:hover`
 *    без условий, и таблица только для чтения тоже подсвечивает строку
 *    под курсором. Медиазапрос возвращает подсветку, не возвращая
 *    залипание на касании.
 *
 * 3. `outline: none` в базовом стиле всех семи элементов, которые могут
 *    получить фокус или несут собственную обводку: колонки, строки, ячейки,
 *    кнопки-шеврона, ссылки, ручки переноса и линии места вставки.
 *    Фокус, возвращённый программно, браузер считает клавиатурным
 *    и рисует своё кольцо, а React Aria `data-focus-visible` не выставляет.
 *
 * 4. Кольцо фокуса у ячейки. В макетах `<td>` не фокусируется вовсе, и вида
 *    для него нет. React Aria делает ячейку основной целью перебора
 *    стрелками и ставит на неё `data-focus-visible` — без кольца таблица
 *    перестаёт показывать, где находится клавиатурный фокус (WCAG 2.4.7).
 *    Значение взято то же, каким макеты красят два других фокусируемых
 *    элемента таблицы, — `inset 0 0 0 2px var(--primary-500)`. Записано
 *    в DESIGN.md вопросом.
 *
 * 5. Кольцо фокуса у ссылки в ячейке. У `.dt-link` в макетах есть только
 *    наведение, а в порядок обхода ссылка попадает. Взято системное
 *    `focus.ring` — то же, что у кнопки копирования Kv. Записано
 *    в DESIGN.md вопросом.
 *
 * 6. Межстрочный интервал у таблицы и обёртки. В макетах его задаёт
 *    типографика страницы витрины (1.45 — `--lh-normal`), и `.dt` наследует
 *    её; система глобальных стилей потребителю не навязывает, и на
 *    браузерном `normal` шапка теряла 3,6px высоты, а ячейка со ссылкой
 *    или знаком — 3,8px.
 */

/** Ширина шага отступа дерева. Макеты пишут `calc(var(--space-7) * depth)`. */
export const TREE_INDENT_STEP = vars.space[7];

// --- Обёртка ---------------------------------------------------------------

/*
 * `display: flex` сверх макетов. Прилипание шапки считается от ближайшего
 * предка с прокруткой, а это всегда `.dt-scroll`: `overflow-x: auto`
 * делает его прокручиваемым и по вертикали. Высота `.dt-scroll` изнутри
 * не задаётся, и без колонки флексов ограничение высоты, поставленное
 * на обёртку, до него не доходит — шапка липнет к области, которая
 * не прокручивается, то есть не липнет вовсе. Витрина обходит это иначе:
 * в её демонстрации прилипания `.dt-scroll` нет совсем, а высота стоит
 * на `.dt-wrap`. Записано в DESIGN.md.
 */
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  // Панель и подвал лежат вне `.dt` и межстрочный от таблицы не наследуют.
  lineHeight: vars.lineHeight.normal,
  border: `1px solid ${vars.border.subtle}`,
  borderRadius: vars.radius.lg,
  background: vars.bg.surface,
  overflow: 'hidden',
});

/**
 * Минимальная ширина таблицы в области прокрутки, которую задаёт проп
 * `minInlineSize`. Без пропса значения нет, и работает токен.
 */
export const minInlineSizeVar = createVar();

export const scroll = style({
  overflowX: 'auto',
  // Флекс-элемент по умолчанию не сжимается меньше содержимого.
  minHeight: 0,
});

export const toolbar = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBlock: vars.space[4],
  paddingInline: vars.space[5],
  borderBlockEnd: `1px solid ${vars.border.subtle}`,
  background: vars.bg.surface,
  gap: vars.space[4],
});

/*
 * Подвал — полоса из двух областей, и переносить её на вторую строку нельзя:
 * витрина говорит об этом прямо. Зазора у неё нет — узлы разводит
 * `space-between`; в reference/src стоит `gap: 8px` и `flex-wrap: wrap`,
 * расхождение записано в DESIGN.md.
 */
export const footer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBlock: vars.space[4],
  paddingInline: vars.space[5],
  borderBlockStart: `1px solid ${vars.border.subtle}`,
  background: vars.bg.subtle,
  fontSize: vars.fontSize[12],
  color: vars.fg.muted,
});

// --- Таблица ---------------------------------------------------------------

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.fontSize[13],
  lineHeight: vars.lineHeight.normal,
  tableLayout: 'fixed',

  selectors: {
    // Витрина не даёт таблице в области прокрутки сжиматься уже 820px.
    // Правило общее, а не демонстрационное: в reference/src его нет вовсе —
    // расхождение записано в DESIGN.md вопросом.
    [`${scroll} > &`]: {
      minWidth: fallbackVar(minInlineSizeVar, vars.dataTable.scrollMinInlineSize),
    },
  },
});

export const stickyHeader = style({
  position: 'sticky',
  insetBlockStart: 0,
  zIndex: vars.layer.sticky,
});

// --- Шапка -----------------------------------------------------------------

export const column = style({
  background: vars.bg.subtle,
  fontFamily: vars.fontFamily.sans,
  fontWeight: vars.fontWeight.medium,
  fontSize: vars.fontSize[12],
  color: vars.fg.secondary,
  textAlign: 'start',
  paddingBlock: vars.space[4],
  paddingInline: vars.space[5],
  borderBlockEnd: `1px solid ${vars.border.subtle}`,
  whiteSpace: 'nowrap',
  position: 'relative',
  userSelect: 'none',
  outline: 'none',

  selectors: {
    // Колонка выделения: 12px по краям не оставляют места 16-пиксельному
    // флажку, поэтому поля обнуляются, а содержимое встаёт по центру.
    [`&:has(> ${checkboxCss.field})`]: {
      paddingInline: 0,
      textAlign: 'center',
      overflow: 'visible',
      textOverflow: 'clip',
    },

    // `data-allows-sorting` React Aria ставит там, где в макетах стоял
    // класс `.sortable`; `data-hovered` — только на такой колонке,
    // наведение на несортируемую React Aria не отслеживает.
    '&[data-allows-sorting]': {
      cursor: 'pointer',
      transition: `background ${vars.duration.fast}, color ${vars.duration.fast}`,
    },
    '&[data-allows-sorting][data-hovered]': {
      background: vars.bg.muted,
      color: vars.fg.default,
    },
    '&[data-focus-visible]': {
      boxShadow: `inset 0 0 0 2px ${vars.action.primary.bg}`,
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      selectors: { '&[data-allows-sorting]': { transition: 'none' } },
    },
  },
});

export const columnNumeric = style({
  textAlign: 'end',
});

/** Подпись сортируемой колонки вместе с индикатором. */
export const sortLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[2],
  cursor: 'pointer',
});

/** У числовой колонки индикатор уходит влево от подписи. */
export const sortLabelNumeric = style({
  flexDirection: 'row-reverse',
});

export const sortIcons = style({
  display: 'inline-flex',
  alignItems: 'center',
});

export const sortIcon = style({
  width: vars.iconSize.sm,
  height: vars.iconSize.sm,
  color: vars.fg.muted,
  flex: 'none',
});

/**
 * Нейтральный индикатор — двойная стрелка. Видим постоянно и исчезает,
 * когда колонка отсортирована.
 */
export const sortIconNeutral = style({
  opacity: 0.75,
  transition: `opacity ${vars.duration.fast}`,

  selectors: {
    '[data-allows-sorting][data-hovered] &': { opacity: 1 },
    '[data-sort-direction] &': { display: 'none' },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

/** Направление сортировки — стрелка, перевёрнутая при убывании. */
export const sortIconDir = style({
  display: 'none',

  selectors: {
    '[data-sort-direction] &': {
      display: 'inline-flex',
      color: vars.action.primary.fg,
    },
    '[data-sort-direction="descending"] &': { transform: 'rotate(180deg)' },
  },
});

// --- Строки ----------------------------------------------------------------

export const row = style({
  outline: 'none',

  selectors: {
    '&[data-hovered]': {
      background: vars.bg.hover,
      cursor: 'pointer',
    },
    '&[data-selected]': { background: vars.action.primary.bgSubtle },
    '&[data-focus-visible]': {
      boxShadow: `inset 0 0 0 2px ${vars.action.primary.bg}`,
    },
  },

  '@media': {
    // Строка без выделения и без действия `data-hovered` не получает,
    // а подсветка под курсором в макетах безусловная.
    '(hover: hover)': {
      selectors: {
        '&:hover': { background: vars.bg.hover },
      },
    },
  },
});

export const cell = style({
  /*
   * Высота ячейки соседствует с рамкой, а глобального сброса у системы нет:
   * на `content-box` 32px строки превращались в 33px, и каждая строка
   * росла на толщину рамки. В макетах это закрывает сброс страницы.
   */
  boxSizing: 'border-box',
  paddingBlock: 0,
  paddingInline: vars.space[5],
  height: vars.rowHeight.dense,
  borderBlockEnd: `1px solid ${vars.border.subtle}`,
  color: vars.fg.default,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  verticalAlign: 'middle',
  outline: 'none',

  selectors: {
    [`&:has(> ${checkboxCss.field})`]: {
      paddingInline: 0,
      textAlign: 'center',
      overflow: 'visible',
      textOverflow: 'clip',
    },

    // Строки-потомки в дереве идут приглушённой подложкой; под курсором
    // она уступает общей подсветке строки. `data-level` React Aria
    // считает от единицы, поэтому корень — это `1`.
    '&[data-level]:not([data-level="1"])': { background: vars.bg.subtle },
    '[data-hovered] &[data-level]:not([data-level="1"])': { background: vars.bg.hover },

    'tr:last-child > &': { borderBlockEnd: 0 },

    // Ячейка — основная цель перебора стрелками у React Aria. В макетах
    // она не фокусируется, поэтому кольцо взято то же, каким они красят
    // сортируемый заголовок и кликабельную строку.
    '&[data-focus-visible]': {
      boxShadow: `inset 0 0 0 2px ${vars.action.primary.bg}`,
    },
  },
});

/**
 * Ячейка без текста прямо в `children` — класс ставит `DataTableCell`:
 * текстовых узлов селектор не видит.
 *
 * Если внутри одни иконки, картинки, кнопки и аватары, многоточие ячейки
 * гасится. Заменять ему нечего, а браузер всё равно рисует «…» рядом
 * с иконкой, как только она шире места между полями: в колонке 40px
 * под содержимое остаётся 16px, и иконка 20px уже получает многоточие.
 * Макеты гасят его так же, но только у флажка и радио — правило в `cell`;
 * здесь то же гашение распространено на графику, без смены полей
 * и выравнивания. Графика шире самой ячейки обрезается по её краю.
 */
const GRAPHIC = `svg, img, button, ${avatarCss.base}`;

export const cellWithoutText = style({
  selectors: {
    [`&:has(> :is(${GRAPHIC})):not(:has(> :not(${GRAPHIC})))`]: {
      textOverflow: 'clip',
    },
  },
});

/** Числовая ячейка: моноширинная, по правому краю, цифры одной ширины. */
export const cellNumeric = style({
  fontFamily: vars.fontFamily.mono,
  textAlign: 'end',
  fontVariantNumeric: 'tabular-nums',
  fontSize: vars.fontSize[12],
});

export const align = styleVariants({
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
});

/**
 * Семантический цвет накладывается на ячейку, а не на строку — так велит
 * раздел «Guidance» витрины. Тон берётся из `trend.*`, а не из `status.*`:
 * в макетах это `--pos-500` / `--neg-500`, которые локаль
 * `data-direction="ea"` меняет местами, а `--status-*` не трогает.
 */
export const variant = styleVariants({
  positive: { color: vars.trend.up.fg },
  negative: { color: vars.trend.down.fg },
});

// --- Плотность -------------------------------------------------------------

export const density = styleVariants({
  compact: { height: vars.rowHeight.compact },
  dense: { height: vars.rowHeight.dense },
  cozy: { height: vars.rowHeight.cozy },
});

/**
 * Насыщенная подача: строка растёт под содержимое в две строки, высоту
 * задаёт вертикальное поле, а не фиксированное число. Объявлена после
 * `density`: в макетах `.dt--rich tbody td` стоит ниже `.dt--<плотность>`
 * и перебивает её высоту.
 */
export const richDensity = styleVariants({
  compact: {
    height: 'auto',
    paddingBlock: vars.space[4],
    verticalAlign: 'middle',
    overflow: 'visible',
  },
  dense: {
    height: 'auto',
    paddingBlock: vars.space[3],
    verticalAlign: 'middle',
    overflow: 'visible',
  },
  cozy: {
    height: 'auto',
    paddingBlock: vars.space[5],
    verticalAlign: 'middle',
    overflow: 'visible',
  },
});

// --- Дерево ----------------------------------------------------------------

export const treeCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
});

export const treeIndent = style({
  flex: 'none',
});

export const treeToggle = style({
  flex: 'none',
  boxSizing: 'border-box',
  width: vars.dataTable.treeToggleSize,
  height: vars.dataTable.treeToggleSize,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 0,
  padding: 0,
  margin: 0,
  background: 'transparent',
  color: vars.fg.muted,
  borderRadius: vars.radius.lg,
  cursor: 'pointer',
  outline: 'none',

  selectors: {
    '&[data-hovered]': { background: vars.bg.hover, color: vars.fg.default },
    '&[data-focus-visible]': { boxShadow: vars.focus.ring },
  },

  transition: `background ${vars.duration.fast}, color ${vars.duration.fast}`,

  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

export const treeToggleIcon = style({
  width: vars.iconSize.md,
  height: vars.iconSize.md,
  transition: `transform ${vars.duration.fast}`,

  selectors: {
    // Витрина поворачивает шеврон от класса раскрытой строки
    // (`.dt tr.is-expanded > td …`), а не от `aria-expanded` кнопки.
    '[data-expanded] &': { transform: 'rotate(90deg)' },
    // В RTL закрытая ветка смотрит влево — к началу строки. Отражение
    // свойством `scale`, чтобы не затирать поворот раскрытой ветки.
    '[dir="rtl"] &': { scale: '-1 1' },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

/** Место шеврона у листа ветки — точка-соединитель. */
export const treeLeaf = style({
  flex: 'none',
  width: vars.dataTable.treeToggleSize,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.border.strong,
});

/** Содержимое ячейки дерева обрезается многоточием само: у ячейки
 *  `overflow: hidden` перестаёт работать, как только в ней флекс. */
export const treeContent = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

// --- Содержимое ячеек ------------------------------------------------------

export const user = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.dataTable.userGap,
  minWidth: 0,
});

export const userMeta = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  lineHeight: vars.lineHeight.snug,
});

export const userName = style({
  fontWeight: vars.fontWeight.medium,
  color: vars.fg.default,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const userSub = style({
  fontSize: vars.fontSize[12],
  color: vars.fg.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const text = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  lineHeight: vars.dataTable.cellLineHeight,
});

export const textTitle = style({
  fontWeight: vars.fontWeight.medium,
  color: vars.fg.default,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const textSub = style({
  fontSize: vars.fontSize[12],
  color: vars.fg.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const inline = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[3],
  minWidth: 0,
});

// Иконка приходит от вызывающего прямым потомком, как в разметке макетов.
globalStyle(`${inline} > svg`, {
  width: vars.dataTable.inlineIconSize,
  height: vars.dataTable.inlineIconSize,
  color: vars.fg.muted,
  flex: 'none',
});

export const link = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.dataTable.linkGap,
  color: vars.action.primary.fg,
  fontWeight: vars.fontWeight.medium,
  textDecoration: 'none',
  outline: 'none',

  selectors: {
    '&[data-hovered]': { textDecoration: 'underline' },
    '&[data-focus-visible]': { boxShadow: vars.focus.ring },
  },
});

globalStyle(`${link} svg`, {
  width: vars.iconSize.sm,
  height: vars.iconSize.sm,
  flex: 'none',
});

export const time = style({
  display: 'flex',
  flexDirection: 'column',
  lineHeight: vars.lineHeight.snug,
  alignItems: 'flex-end',
});

export const timeRelative = style({
  color: vars.fg.default,
});

export const timeAbsolute = style({
  fontSize: vars.fontSize[11],
  color: vars.fg.muted,
  fontFamily: vars.fontFamily.mono,
  fontVariantNumeric: 'tabular-nums',
});

// --- Перетаскивание строк --------------------------------------------------

/*
 * `.dt-reorder tbody tr` и `.dt-reorder tbody tr.is-dragging`. Порядок
 * блоков повторяет порядок правил витрины: строка, ячейка ручки, сама
 * ручка, её глиф, номер строки.
 *
 * Признак перетаскивания React Aria ставит на строку сама — `data-dragging`.
 */
export const draggableRow = style({
  transition: `background ${vars.duration.fast}, opacity ${vars.duration.fast}`,

  selectors: {
    // Шкалы прозрачности в системе нет — литерал, как у неактивного
    // индикатора сортировки.
    '&[data-dragging]': { opacity: 0.45 },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

/*
 * Ячейка с ручкой: `.dt-reorder td.dt-handle`. Правое поле обнуляется,
 * левое — 8px вместо общих 12px.
 */
export const dragHandleCell = style({
  paddingInlineStart: vars.space[4],
  paddingInlineEnd: 0,
});

/*
 * Ручка перетаскивания: `.dt-reorder .dt-grip`. В макетах это `<svg>`
 * с собственным обработчиком указателя; здесь — `<Button slot="drag">`
 * React Aria, поэтому добавлены сброс кнопочных умолчаний и `box-sizing`
 * (в макетах он приходит из глобального сброса страницы, а размер задан
 * вместе с полями). Взамен ручка попадает в порядок обхода и умеет
 * запускать перенос с клавиатуры и скринридера.
 */
export const dragHandle = style({
  // В макетах ручка — `<svg>` и шрифт наследует; `<button>` React Aria
  // без этого берёт умолчание браузера.
  font: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  width: vars.dataTable.dragHandleSize,
  height: vars.dataTable.dragHandleSize,
  padding: vars.space[2],
  border: 0,
  margin: 0,
  background: 'transparent',
  borderRadius: vars.radius.lg,
  color: vars.fg.muted,
  cursor: 'grab',
  touchAction: 'none',
  outline: 'none',
  transition: `background ${vars.duration.fast}, color ${vars.duration.fast}`,

  selectors: {
    '&[data-hovered]': { color: vars.fg.default, background: vars.bg.hover },
    // Кольца фокуса у ручки в макетах нет — там она вовсе не фокусируется.
    // Взято системное, как у ссылки в ячейке. Записано в DESIGN.md.
    '&[data-focus-visible]': { boxShadow: vars.focus.ring },
    // `.dt-reorder tbody tr.is-dragging .dt-grip`
    [`${draggableRow}[data-dragging] &`]: {
      cursor: 'grabbing',
      color: vars.action.primary.fg,
      background: vars.action.primary.bgSubtle,
    },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

/* `.dt-reorder .dt-grip .ti` — точки ручки залиты, а не обведены. */
export const dragHandleIcon = style({
  width: vars.iconSize.lg,
  height: vars.iconSize.lg,
  fill: 'currentcolor',
  stroke: 'none',
});

/* `.dt-reorder td.dt-rank` — порядковый номер строки. */
export const rankCell = style({
  color: vars.fg.muted,
  fontFamily: vars.fontFamily.mono,
  fontVariantNumeric: 'tabular-nums',
});

/*
 * Линия места вставки. В макетах её нет: витрина двигает строки прямо
 * во время переноса и указателя не рисует. React Aria строит его отдельной
 * строкой и без вида не показывает ничего — клавиатурный пользователь
 * остаётся без обратной связи вовсе. Цвет и толщина взяты те же, что
 * у кольца фокуса колонки в макетах. Записано в DESIGN.md.
 */
export const dropIndicator = style({
  height: 0,
  outline: 'none',

  selectors: {
    '&[data-drop-target]': {
      outline: `2px solid ${vars.action.primary.bg}`,
      outlineOffset: -1,
    },
  },
});

// --- Пустое состояние ------------------------------------------------------

export const body = style({});

/*
 * Ячейку пустого состояния React Aria строит сам: строка на всю ширину
 * с `colSpan` по числу колонок. Класс ей не передать, поэтому отступы
 * `.dt-empty` приходят с тела таблицы, помеченного `data-empty`.
 */
globalStyle(`${body}[data-empty] > tr > td`, {
  textAlign: 'center',
  paddingBlock: vars.space[9],
  paddingInline: vars.space[6],
});

export const emptyMessage = style({
  color: vars.fg.muted,
  fontSize: vars.fontSize[13],
});
