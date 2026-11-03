'use client';

import { forwardRef, type ForwardRefExoticComponent, type ReactNode, type RefAttributes, type SVGAttributes } from 'react';
import * as css from './icon.css.js';

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  /**
   * Отражать ли глиф по горизонтали при `dir="rtl"`.
   *
   * По умолчанию берётся из паспорта иконки: шевроны, стрелка вправо,
   * выход, отправка и внешняя ссылка отражаются, остальные — нет.
   * Отражение приезжает таблицей стилей пакета; без неё глиф
   * остаётся как нарисован.
   */
  isMirroredInRtl?: boolean;
}

export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

export interface CreateIconOptions {
  /** Отражать ли глиф в RTL по умолчанию. @default false */
  mirrorInRtl?: boolean;
}

/**
 * Собирает компонент иконки из контуров.
 *
 * Атрибуты корня — правило `.ti` витрины: сетка 24×24, обводка 2px
 * со скруглёнными концами, заливки нет, цвет наследуется от текста.
 * Они заданы атрибутами, а не стилями, чтобы иконка не зависела
 * от подключённой таблицы стилей.
 *
 * Доступность: иконка рядом с подписью — оформление, и по умолчанию
 * скрыта от скринридера. Появился `aria-label` или `aria-labelledby` —
 * значит иконка несёт смысл сама, и тогда она становится `role="img"`
 * и читается.
 */
export function createIcon(name: string, children: ReactNode, options: CreateIconOptions = {}): IconComponent {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(props, ref) {
    const { isMirroredInRtl = options.mirrorInRtl ?? false, className, ...rest } = props;
    const labelled = rest['aria-label'] != null || rest['aria-labelledby'] != null;

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        role={labelled ? 'img' : undefined}
        aria-hidden={labelled ? undefined : true}
        data-nb-icon={name}
        data-rtl-mirror={isMirroredInRtl ? true : undefined}
        className={className ? `${css.icon} ${className}` : css.icon}
        {...rest}
      >
        {children}
      </svg>
    );
  });

  Icon.displayName = `Icon${name.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())}`;

  return Icon;
}
