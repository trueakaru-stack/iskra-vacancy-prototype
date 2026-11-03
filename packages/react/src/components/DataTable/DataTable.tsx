'use client';

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Table as RACTable,
  TableHeader as RACTableHeader,
  Column as RACColumn,
  TableBody as RACTableBody,
  Row as RACRow,
  Cell as RACCell,
  Button as RACButton,
  Link as RACLink,
  DropIndicator as RACDropIndicator,
  type TableProps as RACTableProps,
  type TableHeaderProps as RACTableHeaderProps,
  type ColumnProps as RACColumnProps,
  type ColumnRenderProps as RACColumnRenderProps,
  type TableBodyProps as RACTableBodyProps,
  type RowProps as RACRowProps,
  type CellProps as RACCellProps,
  type CellRenderProps as RACCellRenderProps,
  type LinkProps as RACLinkProps,
  type DropTarget as RACDropTarget,
} from 'react-aria-components';
import clsx from 'clsx';
import { useMessages } from '@neobook/i18n';
import { IconChevronRight, IconChevronUp, IconDrag, IconSelector } from '@neobook/icons';
import { varName } from '../../utils/varName.js';
import * as css from './DataTable.css.js';

/** Высота строки. */
export type DataTableDensity = 'compact' | 'dense' | 'cozy';

/** Выравнивание содержимого колонки и её ячеек. Свойства логические:
 *  `start` — левый край на латинице и правый на арабском. */
export type DataTableAlign = 'start' | 'center' | 'end';

/** Семантический вид значения ячейки. */
export type DataTableVariant = 'positive' | 'negative';

interface DataTableContextValue {
  density: DataTableDensity;
  isRich: boolean;
  isStickyHeader: boolean;
  /** Таблица принимает перетаскивание строк — аналог класса `.dt-reorder`
   *  макетов, который там навешивается на всю таблицу. */
  isReorderable: boolean;
}

const DataTableContext = createContext<DataTableContextValue>({
  density: 'dense',
  isRich: false,
  isStickyHeader: true,
  isReorderable: false,
});

// --- Таблица ---------------------------------------------------------------

export interface DataTableProps extends Omit<RACTableProps, 'className' | 'style'> {
  /** Высота строки. Колонки и кегль от неё не зависят. */
  density?: DataTableDensity | undefined;
  /**
   * Строка растёт под содержимое в две строки вместо фиксированной высоты.
   * Ячейки в этой подаче содержимое не обрезают: длинный текст кладите
   * в `DataTableText` или `DataTableUser` — они обрезают его многоточием сами.
   */
  isRich?: boolean | undefined;
  /** Шапка прилипает к верху области прокрутки. */
  isStickyHeader?: boolean | undefined;
  /**
   * Минимальная ширина таблицы, меньше которой появляется прокрутка.
   * @default 820
   */
  minInlineSize?: number | string | undefined;
  /** Полоса над таблицей: поиск, фильтры, переключатель плотности, экспорт. */
  toolbar?: ReactNode | undefined;
  /** Полоса под таблицей: слева состояние, справа один основной элемент
   *  управления — пагинация или действие режима. */
  footer?: ReactNode | undefined;
  className?: string | undefined;
  /** Стили обёртки — например, ограничение высоты, при котором шапка
   *  начинает прилипать. */
  style?: CSSProperties | undefined;
}

/**
 * Ширины колонок, собранные из шапки, — для `<colgroup>`.
 *
 * При `table-layout: fixed` браузер читает `min-width` только с `<col>`:
 * у `<th>` он его игнорирует, и колонка, у которой задан лишь минимум,
 * схлопывается в ноль, как только заданные ширины соседей перестают
 * помещаться в контейнер. Содержимое такой колонки вылезает на соседнюю.
 * В макетах ширины и стоят на `<col>` — здесь ровно то же.
 *
 * Разбирается статическая шапка и динамическая (`columns` + функция).
 * Если разобрать не удалось, `<colgroup>` не отрисовывается вовсе
 * и остаются ширины на `<th>` — они работают, не работает только минимум.
 */
function collectColumnSizes(children: ReactNode): ColumnSize[] | null {
  const header = Children.toArray(children).find(
    (child): child is ReactElement<DataTableHeaderProps<object>> =>
      isValidElement(child) && child.type === DataTableHeader,
  );
  if (!header) return null;

  const { children: headerChildren, columns } = header.props;

  const elements =
    typeof headerChildren === 'function'
      ? columns
        ? [...columns].map((item) => headerChildren(item))
        : null
      : Children.toArray(headerChildren);

  if (!elements) return null;

  return elements.map((element) => {
    if (!isValidElement<DataTableColumnProps>(element)) return {};
    const { width, minWidth } = element.props;
    return {
      ...(width === undefined ? {} : { width }),
      ...(minWidth === undefined ? {} : { minWidth }),
    };
  });
}

interface ColumnSize {
  width?: string | number;
  minWidth?: string | number;
}

/**
 * Таблица данных — строки однородных записей, которые сортируют, выделяют
 * и разворачивают.
 *
 * Собирается из частей: `DataTableHeader` с `DataTableColumn`,
 * `DataTableBody` со строками `DataTableRow` и ячейками `DataTableCell`.
 * Ключ строки задаётся `id` — он же приходит в `selectedKeys`,
 * `expandedKeys` и `onRowAction`.
 *
 * Числовые колонки помечаются `isNumeric` и у колонки, и у ячейки: шапка
 * и тело — разные элементы, общего описания колонки у таблицы нет.
 *
 * `ref` указывает на обёртку с рамкой, а не на `<table>`.
 */
export const DataTable = forwardRef<HTMLDivElement, DataTableProps>(function DataTable(
  {
    density = 'dense',
    isRich = false,
    isStickyHeader = true,
    minInlineSize,
    toolbar,
    footer,
    className,
    style,
    ...rest
  },
  ref,
) {
  const scrollStyle: CSSProperties | undefined =
    minInlineSize === undefined
      ? undefined
      : ({
          [varName(css.minInlineSizeVar)]:
            typeof minInlineSize === 'number' ? `${minInlineSize}px` : minInlineSize,
        } as CSSProperties);
  const columnSizes = useMemo(() => collectColumnSizes(rest.children), [rest.children]);

  return (
    <div ref={ref} className={clsx(css.root, className)} style={style}>
      {toolbar ? <div className={css.toolbar}>{toolbar}</div> : null}
      <div className={css.scroll} style={scrollStyle}>
        <DataTableContext.Provider
          value={{
            density,
            isRich,
            isStickyHeader,
            isReorderable: rest.dragAndDropHooks !== undefined,
          }}
        >
          <RACTable
            className={css.table}
            {...(columnSizes
              ? {
                  render: ({
                    children: tableChildren,
                    ...tableProps
                  }: ComponentPropsWithoutRef<'table'>) => (
                    <table {...tableProps}>
                      <colgroup>
                        {columnSizes.map((size, index) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <col key={index} style={size} />
                        ))}
                      </colgroup>
                      {tableChildren}
                    </table>
                  ),
                }
              : {})}
            {...rest}
          />
        </DataTableContext.Provider>
      </div>
      {footer ? <div className={css.footer}>{footer}</div> : null}
    </div>
  );
});

// --- Шапка -----------------------------------------------------------------

export interface DataTableHeaderProps<T extends object>
  extends Omit<RACTableHeaderProps<T>, 'className' | 'style'> {
  // Omit строит Pick, а через него TypeScript вывод обобщённого типа
  // не протаскивает: без повтора `columns` тип элемента в функции-ребёнке
  // становится any.
  columns?: Iterable<T>;
  className?: string | undefined;
}

/** Шапка таблицы. Прилипание включается пропом `isStickyHeader` таблицы. */
export function DataTableHeader<T extends object>({ className, ...rest }: DataTableHeaderProps<T>) {
  const { isStickyHeader } = useContext(DataTableContext);

  return (
    <RACTableHeader className={clsx(isStickyHeader && css.stickyHeader, className)} {...rest} />
  );
}

// --- Колонка ---------------------------------------------------------------

export interface DataTableColumnProps
  extends Omit<
    RACColumnProps,
    'className' | 'style' | 'children' | 'width' | 'minWidth' | 'maxWidth' | 'defaultWidth'
  > {
  children?: ReactNode | undefined;
  /** Правый край, моноширинные цифры одной ширины. Ставится и у ячеек этой
   *  колонки — `DataTableCell` о соседях по колонке не знает. */
  isNumeric?: boolean | undefined;
  /** Выравнивание нечисловой колонки. */
  align?: DataTableAlign | undefined;
  /** Ширина колонки. Таблица разложена по `table-layout: fixed`,
   *  поэтому ширину задаёт шапка. */
  width?: string | number | undefined;
  /** Минимальная ширина — для основной, растягивающейся колонки. */
  minWidth?: string | number | undefined;
  className?: string | undefined;
}

/**
 * Колонка таблицы. `allowsSorting` добавляет индикатор сортировки
 * и обработку нажатия; направление приходит в `sortDescriptor` таблицы.
 */
export function DataTableColumn({
  children,
  isNumeric = false,
  align,
  width,
  minWidth,
  className,
  textValue,
  ...rest
}: DataTableColumnProps) {
  return (
    <RACColumn
      className={clsx(
        css.column,
        isNumeric && css.columnNumeric,
        !isNumeric && align && css.align[align],
        className,
      )}
      style={{ width, minWidth }}
      // Подпись сортируемой колонки уходит в функцию, и вывести из неё
      // текст для скринридера React Aria уже не может.
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      {...rest}
    >
      {({ allowsSorting }: RACColumnRenderProps) =>
        allowsSorting ? (
          <span className={clsx(css.sortLabel, isNumeric && css.sortLabelNumeric)}>
            {children}
            <span className={css.sortIcons}>
              <IconSelector className={clsx(css.sortIcon, css.sortIconNeutral)} />
              <IconChevronUp className={clsx(css.sortIcon, css.sortIconDir)} />
            </span>
          </span>
        ) : (
          children
        )
      }
    </RACColumn>
  );
}

// --- Тело ------------------------------------------------------------------

export interface DataTableBodyProps<T extends object>
  extends Omit<RACTableBodyProps<T>, 'className' | 'style'> {
  /** Повтор ради вывода типа — см. DataTableHeaderProps. */
  items?: Iterable<T>;
  className?: string | undefined;
}

/**
 * Тело таблицы. Когда строк нет, показывается `renderEmptyState`; без него —
 * встроенная подпись «Нет записей».
 */
export function DataTableBody<T extends object>({
  className,
  renderEmptyState,
  ...rest
}: DataTableBodyProps<T>) {
  const { t } = useMessages();

  return (
    <RACTableBody
      className={clsx(css.body, className)}
      renderEmptyState={
        renderEmptyState ?? (() => <span className={css.emptyMessage}>{t('dataTable.empty')}</span>)
      }
      {...rest}
    />
  );
}

// --- Строка ----------------------------------------------------------------

export interface DataTableRowProps<T extends object>
  extends Omit<RACRowProps<T>, 'className' | 'style'> {
  /** Повтор ради вывода типа — см. DataTableHeaderProps. */
  columns?: Iterable<T>;
  className?: string | undefined;
}

/** Строка таблицы. Вложенные `DataTableRow` образуют ветку дерева. */
export function DataTableRow<T extends object>({ className, ...rest }: DataTableRowProps<T>) {
  const { isReorderable } = useContext(DataTableContext);

  return (
    <RACRow className={clsx(css.row, isReorderable && css.draggableRow, className)} {...rest} />
  );
}

// --- Ячейка ----------------------------------------------------------------

export interface DataTableCellProps extends Omit<RACCellProps, 'className' | 'style' | 'children'> {
  children?: ReactNode | undefined;
  /** Правый край, моноширинные цифры одной ширины. */
  isNumeric?: boolean | undefined;
  /** Выравнивание нечисловой ячейки. */
  align?: DataTableAlign | undefined;
  /** Семантический цвет значения. Красится ячейка, а не строка. */
  variant?: DataTableVariant | undefined;
  /** Ячейка с ручкой перетаскивания: узкие поля под `DataTableDragHandle`. */
  isDragHandle?: boolean | undefined;
  /** Ячейка порядкового номера строки: приглушённые моноширинные цифры. */
  isRank?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Ячейка таблицы. В колонке дерева (`treeColumn`) сама добавляет отступ
 * уровня и кнопку раскрытия ветки.
 */
export function DataTableCell({
  children,
  isNumeric = false,
  align,
  variant,
  isDragHandle = false,
  isRank = false,
  className,
  ...rest
}: DataTableCellProps) {
  const { density, isRich } = useContext(DataTableContext);
  // Строка или число прямо в children — текст, которому многоточие нужно.
  // Иначе ячейка отдаёт решение стилю: там видно, одна ли в ней графика.
  const hasText = Children.toArray(children).some(
    (child) => typeof child === 'string' || typeof child === 'number',
  );

  return (
    <RACCell
      className={clsx(
        css.cell,
        !hasText && css.cellWithoutText,
        isRich ? css.richDensity[density] : css.density[density],
        isNumeric && css.cellNumeric,
        !isNumeric && align && css.align[align],
        variant && css.variant[variant],
        isDragHandle && css.dragHandleCell,
        isRank && css.rankCell,
        className,
      )}
      {...rest}
    >
      {(renderProps: RACCellRenderProps) =>
        renderProps.isTreeColumn ? (
          <TreeCellContent {...renderProps}>{children}</TreeCellContent>
        ) : (
          children
        )
      }
    </RACCell>
  );
}

/**
 * Содержимое ячейки в колонке дерева: отступ уровня, кнопка раскрытия
 * и само значение. Разметка повторяет `.dt-tree-cell` макетов.
 */
function TreeCellContent({
  level,
  hasChildItems,
  children,
}: RACCellRenderProps & { children: ReactNode }) {
  return (
    <div className={css.treeCell}>
      <span
        className={css.treeIndent}
        style={{ inlineSize: `calc(${css.TREE_INDENT_STEP} * ${level - 1})` }}
      />
      {hasChildItems ? (
        // Локализованную подпись кнопке даёт React Aria вместе со слотом:
        // «Развернуть» / «Свернуть» на 30 языках. Само состояние ветки
        // объявляется на строке — aria-expanded и aria-level стоят на <tr>,
        // как того требует паттерн treegrid.
        <RACButton slot="chevron" className={css.treeToggle}>
          <IconChevronRight className={css.treeToggleIcon} isMirroredInRtl={false} />
        </RACButton>
      ) : level > 1 ? (
        <span className={css.treeLeaf} aria-hidden="true">
          &middot;
        </span>
      ) : (
        <span className={css.treeToggle} aria-hidden="true" style={{ visibility: 'hidden' }} />
      )}
      <span className={css.treeContent}>{children}</span>
    </div>
  );
}

// --- Перетаскивание строк --------------------------------------------------

export interface DataTableDragHandleProps {
  className?: string | undefined;
}

/**
 * Ручка перетаскивания строки. Кладётся в ячейку с `isDragHandle`,
 * работает только когда таблице передан `dragAndDropHooks`.
 *
 * Подпись приходит от React Aria и локализована ею; перетаскивание
 * запускается мышью, касанием, клавиатурой (Enter — взять, Tab — выбрать
 * место, Enter — положить, Escape — отменить) и скринридером.
 */
export function DataTableDragHandle({ className }: DataTableDragHandleProps) {
  return (
    <RACButton slot="drag" className={clsx(css.dragHandle, className)}>
      <IconDrag className={css.dragHandleIcon} />
    </RACButton>
  );
}

export interface DataTableDropIndicatorProps {
  target: RACDropTarget;
  className?: string | undefined;
}

/**
 * Линия места вставки. Передаётся в `renderDropIndicator` хуков
 * перетаскивания:
 *
 * ```tsx
 * useDragAndDrop({
 *   renderDropIndicator: (target) => <DataTableDropIndicator target={target} />,
 * })
 * ```
 */
export function DataTableDropIndicator({ target, className }: DataTableDropIndicatorProps) {
  return <RACDropIndicator target={target} className={clsx(css.dropIndicator, className)} />;
}

// --- Содержимое ячеек ------------------------------------------------------

export interface DataTableUserProps {
  /** Ведущий знак: аватар, логотип, иконка. */
  icon?: ReactNode | undefined;
  /** Название в первой строке. */
  name: ReactNode;
  /** Вторая строка помельче: домен, роль, идентификатор. */
  description?: ReactNode | undefined;
  className?: string | undefined;
}

/** Ячейка объекта: знак слева, название и вторая строка справа. */
export function DataTableUser({ icon, name, description, className }: DataTableUserProps) {
  return (
    <div className={clsx(css.user, className)}>
      {icon}
      <div className={css.userMeta}>
        <span className={css.userName}>{name}</span>
        {description == null ? null : <span className={css.userSub}>{description}</span>}
      </div>
    </div>
  );
}

export interface DataTableTextProps {
  /** Первая строка. */
  title: ReactNode;
  /** Вторая строка помельче. */
  description?: ReactNode | undefined;
  className?: string | undefined;
}

/** Ячейка в две строки: заголовок и пояснение под ним. */
export function DataTableText({ title, description, className }: DataTableTextProps) {
  return (
    <div className={clsx(css.text, className)}>
      <span className={css.textTitle}>{title}</span>
      {description == null ? null : <span className={css.textSub}>{description}</span>}
    </div>
  );
}

export interface DataTableInlineProps {
  /** Знак перед текстом. Размер задаёт таблица. */
  icon?: ReactNode | undefined;
  children?: ReactNode | undefined;
  className?: string | undefined;
}

/**
 * Значение со знаком в строку: тип, план, состояние. Рассчитано на короткие
 * значения: длинный текст обрезается по краю ячейки без многоточия.
 */
export function DataTableInline({ icon, children, className }: DataTableInlineProps) {
  return (
    <span className={clsx(css.inline, className)}>
      {icon}
      {children}
    </span>
  );
}

export interface DataTableLinkProps extends Omit<RACLinkProps, 'className' | 'style'> {
  className?: string | undefined;
}

/** Ссылка внутри ячейки. */
export const DataTableLink = forwardRef<HTMLAnchorElement, DataTableLinkProps>(
  function DataTableLink({ className, ...rest }, ref) {
    return <RACLink ref={ref} className={clsx(css.link, className)} {...rest} />;
  },
);

export interface DataTableTimeProps {
  /** Первая строка — обычно относительное время: «2 мин назад». */
  value: ReactNode;
  /** Вторая строка моноширинным — точная отметка: «14:32 UTC». */
  description?: ReactNode | undefined;
  className?: string | undefined;
}

/** Ячейка времени в две строки, прижатая к правому краю. */
export function DataTableTime({ value, description, className }: DataTableTimeProps) {
  return (
    <div className={clsx(css.time, className)}>
      <span className={css.timeRelative}>{value}</span>
      {description == null ? null : <span className={css.timeAbsolute}>{description}</span>}
    </div>
  );
}
