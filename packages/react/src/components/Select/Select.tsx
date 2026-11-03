'use client';

import { createContext, forwardRef, useContext, useRef, type ReactNode } from 'react';
import {
  Select as RACSelect,
  SelectValue as RACSelectValue,
  SelectStateContext as RACSelectStateContext,
  Button as RACButton,
  Group as RACGroup,
  Popover as RACPopover,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  Label as RACLabel,
  Text as RACText,
  FieldError as RACFieldError,
  TagGroup as RACTagGroup,
  TagList as RACTagList,
  VisuallyHidden as RACVisuallyHidden,
  type SelectProps as RACSelectProps,
  type SelectRenderProps as RACSelectRenderProps,
  type SelectValueRenderProps as RACSelectValueRenderProps,
  type SelectState as RACSelectState,
  type ListBoxItemProps as RACListBoxItemProps,
  type ListBoxItemRenderProps as RACListBoxItemRenderProps,
  type Key as RACKey,
  composeRenderProps,
} from 'react-aria-components';
import clsx from 'clsx';
import { useMessages, useNumberFormatter } from '@neobook/i18n';
import { tokenValues } from '@neobook/tokens';
import { IconCheck, IconChevronDown } from '@neobook/icons';
import { Button } from '../Button/index.js';
import { Tag } from '../Tag/index.js';
import { TruncatedLabel, truncatedLabelClass } from '../TextField/TruncatedLabel.js';
import * as css from './Select.css.js';

export type SelectSize = 'sm' | 'md' | 'lg';

/** Сколько значений можно выбрать. */
export type SelectSelectionMode = 'single' | 'multiple';

/**
 * Зазор между триггером и списком. В reference это `top: calc(100% + 4px)`,
 * React Aria принимает его числом: значение уходит в расчёт позиции,
 * CSS-переменную туда не передать.
 */
const POPOVER_OFFSET = Number.parseFloat(tokenValues['space.2']);

/**
 * Потолок высоты списка. React Aria ставит max-height инлайном по свободному
 * месту на экране, и max-height из класса до поповера не доходит. Проп
 * maxHeight React Aria сравнивает со свободным местом и берёт меньшее.
 */
const POPOVER_MAX_HEIGHT = Number.parseFloat(tokenValues['popover.maxHeight']);

/** Показывать ли галочку у выбранного пункта: задаётся пропсом `showSelectedCheck` у Select. */
const SelectedCheckContext = createContext(true);

export interface SelectProps<T extends object, M extends SelectSelectionMode = 'single'>
  extends Omit<RACSelectProps<T, M>, 'children' | 'className'> {
  label: string;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: { validationErrors: string[] }) => ReactNode);
  /** Текст до выбора. По умолчанию — локализованное «Выберите…». */
  placeholder?: string;
  /**
   * Высота поля. Действует только при выборе одного значения: поле
   * с несколькими значениями растёт под теги.
   *
   * @default 'md'
   */
  size?: SelectSize;
  /**
   * Галочка у выбранного пункта списка.
   * @default true
   */
  showSelectedCheck?: boolean;
  /**
   * Подпись в одну строку с многоточием.
   * @default false
   */
  truncateLabel?: boolean;
  /**
   * Варианты. Передавайте массив вместе с `items` — тогда RAC отрисует
   * только видимую часть длинного списка вместо всех элементов сразу.
   */
  children: ReactNode | ((item: T) => ReactNode);
  items?: Iterable<T>;
  className?: string;
}
/**
 * Выпадающий список с выбором одного или нескольких значений.
 *
 * Варианты передаются детьми — `SelectItem` с уникальным `id`. Для длинных
 * списков используйте `items` вместе с функцией-ребёнком: тогда отрисовывается
 * только видимая часть.
 *
 * `selectionMode="multiple"` показывает выбранное тегами в поле, а пункты
 * списка — с флажками. Список не закрывается после выбора; внизу — счётчик
 * выбранного, «Очистить» и «Применить», которая закрывает список. Значение
 * меняется сразу, при каждом нажатии на пункт или крестик тега.
 *
 * При нуле вариантов список не раскрывается. Для незагруженного справочника
 * задавайте `isDisabled` и поясняйте причину в `description`.
 */
/**
 * Коробка поля с несколькими значениями: кнопка Select, теги выбранного
 * и каретка.
 *
 * Кнопка растянута под коробкой на всю площадь и получает имя от подписи
 * поля и перечня выбранного — «Регион: eu-west-1, us-east-1». Теги стоят
 * поверх неё отдельной TagGroup: внутри кнопки их крестики были бы кнопками
 * в кнопке, а в имени поля скринридер читал бы «Удалить» у каждого.
 */
function MultiTrigger({
  triggerRef,
  buttonRef,
  isInvalid,
  isDisabled,
}: {
  triggerRef: React.Ref<HTMLDivElement>;
  buttonRef: React.ForwardedRef<HTMLButtonElement>;
  isInvalid: boolean;
  isDisabled: boolean;
}) {
  const { t } = useMessages();
  // Тип контекста в поставке React Aria 1.20 теряет параметр режима —
  // значение приводится к состоянию с несколькими значениями.
  const state = useContext(RACSelectStateContext) as RACSelectState<object, 'multiple'> | null;
  const selectedNodes = state?.selectedItems ?? [];

  return (
    <RACGroup
      ref={triggerRef}
      className={clsx(css.multiTrigger, isInvalid && css.multiInvalid)}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
    >
      <RACButton ref={buttonRef} className={css.multiButton}>
        <RACSelectValue
          className={({ isPlaceholder }: RACSelectValueRenderProps<object>) =>
            clsx(css.multiValue, isPlaceholder && css.placeholder)
          }
        >
          {({
            isPlaceholder,
            selectedText,
            defaultChildren,
          }: RACSelectValueRenderProps<object> & { defaultChildren: ReactNode | undefined }) =>
            isPlaceholder ? (
              defaultChildren
            ) : (
              // Видно выбранное по тегам, а скринридер читает его в имени
              // кнопки — перечнем, собранным по правилам языка.
              <RACVisuallyHidden elementType="span">{selectedText}</RACVisuallyHidden>
            )
          }
        </RACSelectValue>
      </RACButton>

      {selectedNodes.length > 0 && (
        <RACTagGroup
          aria-label={t('select.selectedValues')}
          className={css.tagGroup}
          // Крестики недоступны, пока поле отключено.
          {...(isDisabled && { disabledKeys: selectedNodes.map((node) => node.key) })}
          onRemove={(keys: Set<RACKey>) => {
            if (state && Array.isArray(state.value)) {
              state.setValue(state.value.filter((key) => !keys.has(key)));
            }
          }}
        >
          <RACTagList className={css.tagGroup} items={selectedNodes}>
            {(node: (typeof selectedNodes)[number]) => (
              <Tag id={node.key} className={css.multiTag} textValue={node.textValue}>
                {node.textValue}
              </Tag>
            )}
          </RACTagList>
        </RACTagGroup>
      )}

      <span className={css.multiCaret} aria-hidden="true">
        <IconChevronDown />
      </span>
    </RACGroup>
  );
}

/** Подвал списка: «Выбрано 3 из 6», «Очистить» и «Применить». */
function MultiFooter() {
  const { t } = useMessages();
  const number = useNumberFormatter();
  const state = useContext(RACSelectStateContext) as RACSelectState<object, 'multiple'> | null;
  if (!state) return null;

  const count = state.selectedItems.length;
  let total = 0;
  for (const key of state.collection.getKeys()) {
    if (state.collection.getItem(key)?.type === 'item') total++;
  }

  return (
    <>
      <div className={css.footerSeparator} />
      <div className={css.footer}>
        <span className={css.footerCount}>
          {t('select.selectedOfTotal', {
            count,
            selected: number.format(count),
            total: number.format(total),
          })}
        </span>
        <Button variant="ghost" size="xs" onPress={() => state.setValue([])}>
          {t('common.clear')}
        </Button>
        <Button variant="primary" size="xs" onPress={() => state.close()}>
          {t('select.apply')}
        </Button>
      </div>
    </>
  );
}

function SelectInner<T extends object, M extends SelectSelectionMode = 'single'>(
  {
    label,
    description,
    errorMessage,
    placeholder,
    size = 'md',
    showSelectedCheck = true,
    truncateLabel = false,
    children,
    items,
    className,
    ...rest
  }: SelectProps<T, M>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { t } = useMessages();
  const multiTriggerRef = useRef<HTMLDivElement>(null);
  const isMultiple = rest.selectionMode === 'multiple';

  return (
    <RACSelect<T, M>
      validationBehavior="native"
      placeholder={placeholder ?? t('select.placeholder')}
      className={clsx(css.select, className)}
      {...rest}
    >
      {({ isInvalid, isDisabled }: RACSelectRenderProps) => (
        <SelectedCheckContext.Provider value={showSelectedCheck}>
          <RACLabel className={clsx(css.label, truncateLabel && truncatedLabelClass)}>
            {truncateLabel ? <TruncatedLabel>{label}</TruncatedLabel> : label}
          </RACLabel>

          {isMultiple ? (
            <MultiTrigger
              triggerRef={multiTriggerRef}
              buttonRef={ref}
              isInvalid={isInvalid}
              isDisabled={isDisabled}
            />
          ) : (
            <RACButton
              ref={ref}
              className={clsx(css.trigger, css.size[size], isInvalid && css.invalid)}
            >
              {/* Содержимое RACSelectValue не оборачивается: React Aria переносит
                  сюда пункт целиком, вместе с иконкой и колонкой из label
                  и description. Лишний span разорвал бы строку — колонка
                  внутри него встаёт блоком и уводит название под иконку.
                  Поэтому состояние плейсхолдера красится через className. */}
              <RACSelectValue<T>
                className={({ isPlaceholder }: RACSelectValueRenderProps<T>) =>
                  clsx(css.value, isPlaceholder && css.placeholder)
                }
              />
              <IconChevronDown className={clsx(css.chevron, css.chevronSize[size])} />
            </RACButton>
          )}

          {description && (
            <RACText slot="description" className={css.description}>
              {description}
            </RACText>
          )}
          <RACFieldError className={css.errorMessage}>{errorMessage}</RACFieldError>

          {/* renderEmptyState здесь не нужен: при нуле вариантов React Aria
              вообще не раскрывает список — показывать было бы нечего.
              Правильный паттерн для пустого справочника — отключить поле
              через isDisabled и объяснить причину в description,
              иначе пользователь молча кликает по неработающему контролу. */}
          <RACPopover
            className={clsx(css.popover, isMultiple && css.popoverMultiple)}
            offset={POPOVER_OFFSET}
            maxHeight={POPOVER_MAX_HEIGHT}
            // Список встаёт под всей коробкой и берёт её ширину, а не ширину
            // растянутой кнопки внутри — она на рамку уже.
            {...(isMultiple && { triggerRef: multiTriggerRef })}
          >
            <RACListBox
              className={clsx(css.listBox, isMultiple && css.listBoxMultiple)}
              items={items}
            >
              {children}
            </RACListBox>
            {isMultiple && <MultiFooter />}
          </RACPopover>
        </SelectedCheckContext.Provider>
      )}
    </RACSelect>
  );
}

export const Select = forwardRef(SelectInner) as <
  T extends object,
  M extends SelectSelectionMode = 'single',
>(
  props: SelectProps<T, M> & { ref?: React.ForwardedRef<HTMLButtonElement> },
) => ReturnType<typeof SelectInner>;

// Приведение типа стирает имя функции. Без displayName компонент попадает
// в React DevTools и в документацию как текст выражения приведения.
(Select as { displayName?: string }).displayName = 'Select';

export interface SelectItemProps extends Omit<RACListBoxItemProps, 'className'> {
  className?: string;
  /** Вторая строка под названием. В триггер не переносится. */
  description?: ReactNode;
  /** Иконка или аватар перед названием. Показывается и в списке, и в триггере. */
  icon?: ReactNode;
}

/** Пункт списка. */
export function SelectItem({
  className,
  description,
  icon,
  children,
  textValue,
  ...rest
}: SelectItemProps) {
  const showCheck = useContext(SelectedCheckContext);

  return (
    <RACListBoxItem
      className={clsx(css.item, description && css.itemStacked, className)}
      // Обычно RAC берёт строку для поиска по первым буквам из детей,
      // но здесь дети — функция, и вывести её он не может.
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      {...rest}
    >
      {composeRenderProps(
        children,
        (
          content,
          {
            isSelected,
            selectionMode,
          }: RACListBoxItemRenderProps & { defaultChildren: ReactNode | undefined },
        ) => (
          <>
            {/* При выборе нескольких значений отметка — флажок перед
                названием, а не галка в конце. Выбор пункт объявляет сам
                (aria-selected), поэтому флажок для скринридера скрыт. */}
            {selectionMode === 'multiple' && (
              <span className={css.itemCheckbox} aria-hidden="true" />
            )}
            {icon && <span className={css.itemLead}>{icon}</span>}
            <span className={css.optionBody}>
              {/* Слоты label и description — не только вёрстка: скринридер
                  читает описание как пояснение к названию, а не как второй пункт. */}
              <RACText slot="label" className={css.optionLabel}>
                {content}
              </RACText>
              {description && (
                <RACText slot="description" className={css.optionDescription}>
                  {description}
                </RACText>
              )}
            </span>
            {/* В триггере галки нет: RACSelectValue вызывает эту функцию
                с isSelected: false. */}
            {isSelected && showCheck && selectionMode !== 'multiple' && (
              <span className={css.check}>
                <IconCheck />
              </span>
            )}
          </>
        ),
      )}
    </RACListBoxItem>
  );
}

export type { RACKey as Key };
