'use client';

import { forwardRef, type ReactNode } from 'react';
import {
  TagGroup as RACTagGroup,
  TagList as RACTagList,
  Tag as RACTag,
  Button as RACButton,
  Label as RACLabel,
  Text as RACText,
  type TagGroupProps as RACTagGroupProps,
  type TagListProps as RACTagListProps,
  type TagProps as RACTagProps,
} from 'react-aria-components';
import clsx from 'clsx';
import { IconX } from '@neobook/icons';
import * as css from './Tag.css.js';

export type TagVariant = 'neutral';
interface TagGroupBaseProps<T extends object>
  extends Omit<
      RACTagGroupProps,
      | 'children'
      | 'className'
      // Выбор тегов в макетах не описан: отмеченный тег выглядел бы как обычный.
      // Пропсы скрыты, пока дизайнеры не зададут вид, — см. DESIGN.md, раздел Tag.
      | 'selectionMode'
      | 'selectionBehavior'
      | 'selectedKeys'
      | 'defaultSelectedKeys'
      | 'onSelectionChange'
      | 'disallowEmptySelection'
      | 'shouldSelectOnPressUp'
      | 'onAction'
    >,
    Pick<RACTagListProps<T>, 'items'> {
  /** Подсказка под рядом. */
  description?: ReactNode;
  /**
   * Теги — `Tag` с уникальным `id`. Для длинных наборов передавайте `items`
   * вместе с функцией-ребёнком. Ряд без тегов допустим: он остаётся
   * в разметке и в порядке обхода.
   */
  children?: ReactNode | ((item: T) => ReactNode);
  className?: string;
}

interface TagGroupLabelledProps {
  /** Подпись над рядом тегов. */
  label: ReactNode;
}

interface TagGroupBareProps {
  label?: undefined;
  /** Обязателен: без подписи ряд тегов для скринридера безымянный. */
  'aria-label': string;
}

export type TagGroupProps<T extends object> = TagGroupBaseProps<T> &
  (TagGroupLabelledProps | TagGroupBareProps);

/**
 * Ряд тегов — меток, категорий, ключевых слов, применённых фильтров.
 *
 * Теги передаются детьми — `Tag` с уникальным `id`. Ряд обязателен даже
 * для одного тега: перебор стрелками, удаление с клавиатуры и объявление
 * скринридеру живут на нём, а не на отдельном теге.
 *
 * `onRemove` задаётся здесь и приходит множеством ключей: удалять можно
 * и мышью по крестику, и клавишей Delete на теге в фокусе. Без `onRemove`
 * крестик не рисуется — тег становится статическим.
 *
 * Подпись задаётся через `label`. Без неё обязателен `aria-label`.
 */
function TagGroupInner<T extends object>(
  { label, description, children, items, className, ...rest }: TagGroupProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <RACTagGroup ref={ref} className={clsx(css.group, className)} {...rest}>
      {label && <RACLabel className={css.label}>{label}</RACLabel>}

      <RACTagList<T> className={css.list} items={items}>
        {children}
      </RACTagList>

      {description && (
        <RACText slot="description" className={css.description}>
          {description}
        </RACText>
      )}
    </RACTagGroup>
  );
}

export const TagGroup = forwardRef(TagGroupInner) as <T extends object>(
  props: TagGroupProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof TagGroupInner>;

// Приведение типа стирает имя функции. Без displayName компонент попадает
// в React DevTools и в документацию как текст выражения приведения.
(TagGroup as { displayName?: string }).displayName = 'TagGroup';

export interface TagProps
  extends Omit<
    RACTagProps,
    | 'className'
    // Ссылочный тег в макетах не описан, а вид перехода задавать нечем.
    | 'href'
    | 'hrefLang'
    | 'target'
    | 'rel'
    | 'download'
    | 'ping'
    | 'referrerPolicy'
    | 'routerOptions'
    // Нажатие на сам тег в макетах ничего не делает: действие только у крестика.
    | 'onAction'
  > {
  /**
   * Визуальная трактовка. Названа как у Badge — одинаковый смысл,
   * одинаковое имя.
   *
   * @default 'neutral'
   */
  variant?: TagVariant;
  className?: string;
}

/**
 * Тег внутри `TagGroup`.
 *
 * Крестик появляется сам, когда у `TagGroup` задан `onRemove`, и получает
 * локализованную подпись от React Aria — своей не нужно.
 */
export const Tag = forwardRef<HTMLDivElement, TagProps>(function Tag(
  { variant = 'neutral', className, children, textValue, ...rest },
  ref,
) {
  return (
    <RACTag
      ref={ref}
      className={clsx(css.base, css.variant[variant], className)}
      // Обычно RAC берёт строку для поиска по первым буквам из детей,
      // но ниже дети — функция, и вывести её он не может.
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      {...rest}
    >
      {(renderProps) => (
        // Обёртки вокруг содержимого нет намеренно: подпись и крестик лежат
        // в макетах прямыми детьми тега, то есть двумя флекс-элементами.
        // Общий span склеил бы их в один, и gap между ними исчез бы.
        <>
          {typeof children === 'function' ? children(renderProps) : children}
          {renderProps.allowsRemoving && (
            <RACButton slot="remove" className={css.close}>
              <IconX className={css.closeIcon} />
            </RACButton>
          )}
        </>
      )}
    </RACTag>
  );
});
