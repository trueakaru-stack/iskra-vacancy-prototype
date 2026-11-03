import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@neobook/tokens/contract';

/*
 * Перенос reference/src/components/Tag/Tag.css.
 *
 * Селекторы макета и их судьба:
 *
 * `.tag`                    → `base`
 * `.tag--primary`           → `variant.primary`
 * `.tag--accent`            → `variant.accent`
 * `.tag__close`             → `close`
 * `.tag__close:hover`       → `close`, селектор `&[data-hovered]`
 * `.tag--primary .tag__close` → `close`, селектор от `variant.primary`
 * `.tag--accent .tag__close`  → `close`, селектор от `variant.accent`
 *
 * Тот же набор правил продублирован в reference/src/components/Combobox/Combobox.css
 * (`.tag`, `.tag__close`, `.tag__close:hover`) — значения совпадают до символа,
 * переносить второй раз нечего. Правила `.combobox--multi .tag` и
 * `.combobox--multi .tag > :first-child` (flex: none, max-width 140px, обрезка
 * подписи многоточием) относятся к окружению внутри поля Combobox, а не к тегу:
 * они переедут вместе с Combobox.
 *
 * Порядок блоков повторяет порядок правил в макете: база → варианты → кнопка
 * закрытия. В vanilla-extract специфичность у классов одинаковая, и при равной
 * специфичности решает порядок объявления. Это существенно для цвета глифа:
 * в макетах `.tag--primary .tag__close` (0,2,0) стоит после `.tag__close:hover`
 * (0,1,1) и перебивает его — у цветного тега наведение меняет только подложку,
 * а цвет крестика остаётся тоновым.
 */

/** `.tag` */
export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[2],

  // В макетах действует глобальный ресет box-sizing: border-box, поэтому 22px —
  // высота вместе с рамкой. Дизайн-система своего ресета потребителю не ставит:
  // без явного border-box тег вырастает до 24px.
  boxSizing: 'border-box',
  /*
   * .tag { height: 22px } — то же значение, что у controlHeight.xs.
   *
   * Взято минимумом, а не фиксированной высотой. `white-space` и `overflow`
   * в макетах не заданы, поэтому подпись длиннее строки переносится, а коробка
   * при жёсткой высоте остаётся 22px: текст вылезал за неё на 3px сверху
   * и снизу (замер — 42→70 при коробке 45→67).
   *
   * На однострочном теге разницы нет: 12px строки + 8px полей + 2px рамки
   * дают ровно 22px, минимум не срабатывает. Расхождение вынесено
   * дизайнерам — см. DESIGN.md, раздел Tag.
   */
  minHeight: vars.controlHeight.xs,

  // padding: 0 4px 0 8px — крестик прижат к концу плотнее подписи.
  // Логические свойства: на арабском отступы зеркалятся сами.
  // Тег без крестика получает 8px с обеих сторон — см. селектор ниже.
  paddingInlineStart: vars.space[4],
  paddingInlineEnd: vars.space[2],
  /*
   * В макетах вертикальные поля обнулены сокращённой записью, а зазор
   * над подписью и под ней получался сам — из разницы между высотой 22px
   * и содержимым. Высоту содержимого держит не строка (12px), а крестик:
   * он выше — 16px. Отсюда (22 − 2 рамки − 16) / 2 = 2px, ровно space[1].
   */
  paddingBlock: vars.space[1],

  borderRadius: vars.radius.xs,

  // font: var(--fw-medium) var(--fs-12)/1 var(--font-sans)
  fontFamily: vars.fontFamily.sans,
  fontSize: vars.fontSize[12],
  fontWeight: vars.fontWeight.medium,
  /*
   * В макетах межстрочный — 1, то есть 12px при глифовом боксе 16px.
   * На одной строке это ни на что не влияет: высоту содержимого держит
   * крестик (16px), а не строка. На перенесённой подписи строки налезают
   * друг на друга на 4px и упираются в рамку.
   *
   * Взято ровно 16px — натуральный строчный бокс шрифта на этом кегле.
   * Тогда строчный бокс совпадает с глифовым, и подпись стоит симметрично:
   * зазор до рамки 2px сверху и снизу и на одной строке, и на двух.
   * Множители со шкалы не подходят: 1.3 оставляет налезание 0.41px и уводит
   * подпись на 0.6px вверх, 1.45 растягивает однострочный тег до 23.4px.
   *
   * Значение из макетов, поэтому расхождение согласовано и вынесено
   * дизайнерам — см. DESIGN.md, раздел Tag.
   */
  lineHeight: vars.tag.lineHeight,
  // Сокращение font: обнуляет ещё и начертание с растяжением. Без этого тег
  // внутри <em> или курсивной ячейки таблицы наклоняется, а в макетах нет.
  fontStyle: 'normal',
  fontVariant: 'normal',
  fontStretch: 'normal',

  background: vars.bg.muted,
  color: vars.fg.default,
  border: `1px solid ${vars.border.subtle}`,

  // В макетах тег — <span>, он не фокусируется, и вида фокуса у него нет.
  // React Aria делает тег элементом коллекции с roving tabindex: он попадает
  // в порядок обхода, и без видимого фокуса это нарушение WCAG 2.4.7.
  // Взято системное кольцо focus.ring, тем же токеном, что у флажка и поля.
  // Вопрос вынесен дизайнерам — см. DESIGN.md, раздел Tag.
  //
  // outline: none — в базовом стиле, а не внутри селектора состояния:
  // React Aria возвращает фокус программно, браузер считает такой фокус
  // клавиатурным и рисует своё кольцо, а data-focus-visible при этом снят.
  outline: 'none',

  selectors: {
    /*
     * Тег без крестика — подпись по центру.
     *
     * В макетах `padding: 0 4px 0 8px` стоит на `.tag` без условий, хотя
     * узкое поле в 4px существует только под крестик. Статический тег
     * получал те же 8px в начале и 4px в конце, и подпись стояла не по
     * центру — замер: зазор 8px слева, 4px справа при коробке 86.59×22.
     * В песочнице макетов ровно то же самое (`internal`, `production`,
     * `needs-review` — крестика нет, поля 4px/8px).
     *
     * data-allows-removing React Aria ставит на тег, когда у ряда задан
     * onRemove, — то есть ровно тогда, когда крестик отрисован.
     * Специфичность (0,2,0) выше базовой, порядок объявления не важен.
     * Расхождение вынесено дизайнерам — см. DESIGN.md, раздел Tag.
     */
    '&:not([data-allows-removing])': {
      paddingInlineEnd: vars.space[4],
    },

    '&[data-focus-visible]': {
      borderColor: vars.border.focus,
      boxShadow: vars.focus.ring,
    },
  },
});

/**
 * `.tag--primary`, `.tag--accent`.
 *
 * В макетах вариант задан именами тона `primary`/`accent`; проп в порте
 * называется `variant`, как у Badge.
 */
export const variant = styleVariants({
  // `.tag` без модификатора.
  neutral: {},

  // .tag--primary { border-color: var(--primary-border) }
  primary: {
    background: vars.action.primary.bgSubtle,
    color: vars.action.primary.fg,
    borderColor: vars.action.primary.border,
  },

  // .tag--accent { border-color: var(--accent-bg) } — именно bg, а не border:
  // рамка у акцентного тега насыщеннее, чем у основного. Перенесено как есть,
  // расхождение вынесено дизайнерам — см. DESIGN.md, раздел Tag.
  accent: {
    background: vars.action.accent.bgSubtle,
    color: vars.action.accent.fg,
    borderColor: vars.action.accent.bg,
  },
});

/** `.tag__close` */
export const close = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',

  // Размер задан вместе с рамкой — см. комментарий о ресете выше.
  boxSizing: 'border-box',
  width: vars.tag.closeSize,
  height: vars.tag.closeSize,
  // В макетах кнопке оставлены браузерные поля (1px 6px): при border-box
  // коробка остаётся 16×16, а глиф 10px не сжимается ниже своего размера
  // и лежит по центру, выходя за поля. Дизайн-система ресета не ставит,
  // и полагаться на это нельзя — обнуляем явно, вид не меняется.
  padding: 0,

  borderRadius: vars.tag.closeRadius,
  cursor: 'pointer',
  color: vars.fg.muted,
  background: 'transparent',
  border: 0,
  flex: 'none',

  // Кнопка внутри тега фокус на себя не берёт: React Aria водит фокус
  // по тегам, а крестик достаётся с самого тега. Системное кольцо здесь
  // гасится, чтобы не спорить с кольцом тега.
  outline: 'none',

  selectors: {
    // .tag__close:hover { background: var(--bg-active); color: var(--fg-default) }
    '&[data-hovered]': {
      background: vars.bg.active,
      color: vars.fg.default,
    },

    // .tag--primary .tag__close, .tag--accent .tag__close — объявлены после
    // наведения, как в макетах: у цветного тега крестик тон не теряет.
    [`${variant.primary} &`]: { color: vars.action.primary.fg },
    [`${variant.accent} &`]: { color: vars.action.accent.fg },
  },
});

/** Глиф крестика. В макетах размер приходит пропом: `<IconX size={10} />`. */
export const closeIcon = style({
  width: vars.tag.closeIconSize,
  height: vars.tag.closeIconSize,
  flex: 'none',
});

/*
 * Ниже — то, чего в макетах нет вовсе: там тег стоял в разметке сам по себе,
 * а ряд тегов собирал вызывающий. React Aria требует обёртки TagGroup/TagList,
 * иначе не работают ни перебор стрелками, ни удаление с клавиатуры.
 * Значения взяты не с потолка, а из паттерна, где ряд тегов уже описан
 * дизайнерами: reference/src/patterns/FilterBar/FilterBar.css, `.filter-bar__chips`
 * (ряд активных фильтров) и `.field`/`.field__label`/`.field__hint`
 * из reference/src/components/Input/Input.css (подпись и подсказка над блоком).
 */

/** Блок целиком: подпись, ряд тегов, подсказка. Шаг — от `.field`. */
export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.fieldGap.default,
  fontFamily: vars.fontFamily.sans,
});

/** Подпись над рядом. Значения `.field__label`. */
export const label = style({
  fontSize: vars.fontSize[12],
  fontWeight: vars.fontWeight.medium,
  color: vars.fg.default,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  width: 'fit-content',
});

/** Подсказка под рядом. Значения `.field__hint`. */
export const description = style({
  fontSize: vars.fontSize[11],
  color: vars.fg.muted,
});

/** Ряд тегов. Значения `.filter-bar__chips`. */
export const list = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: vars.space[3],
  // React Aria делает контейнер видимой областью прокрутки коллекции
  // и фокусирует его, пока в ряду нет ни одного тега.
  outline: 'none',
});
