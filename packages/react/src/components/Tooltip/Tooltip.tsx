'use client';

import { forwardRef, type ReactNode } from 'react';
import {
  TooltipTrigger as RACTooltipTrigger,
  Tooltip as RACTooltip,
  OverlayArrow as RACOverlayArrow,
} from 'react-aria-components';
import clsx from 'clsx';
import { tokenValues } from '@neobook/tokens';
import * as css from './Tooltip.css.js';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';

/**
 * Зазор между триггером и коробкой. В reference это `calc(100% + 4px)`
 * в правилах `.tip--*`; React Aria принимает зазор числом — значение уходит
 * в расчёт позиции, CSS-переменную туда не передать. Без явного offset
 * React Aria подставил бы 0.
 */
const TOOLTIP_OFFSET = Number.parseFloat(tokenValues['space.2']);

/*
 * Умолчания поведения — из reference/src/components/Tooltip/Tooltip.tsx:
 * задержка показа при наведении 400 мс (фокус показывает сразу), грация
 * закрытия интерактивного тултипа 150 мс. У React Aria свои умолчания —
 * 1500 и 500 мс — их перекрывают значения макетов. На шкале duration
 * этих значений нет: это JS-тайминги поведения, а не CSS-анимации.
 */
const SHOW_DELAY = 400;
const INTERACTIVE_CLOSE_DELAY = 150;

export interface TooltipProps {
  /**
   * Единственный элемент-триггер. Компоненты системы (Button и остальные)
   * подходят как есть; произвольный элемент или сторонний компонент
   * оборачивается в `Focusable` — он реэкспортируется рядом с Tooltip.
   */
  children: ReactNode;
  /**
   * Содержимое подсказки. Короткий текст; всё, что сложнее пары строк
   * и одной ссылки, — Popover.
   */
  content: ReactNode;
  /**
   * Сторона появления. `start` и `end` зеркалятся в RTL, `left` и `right` —
   * физические. При нехватке места у края экрана сторона меняется
   * на противоположную.
   * @default 'top'
   */
  placement?: TooltipPlacement;
  /**
   * Задержка показа при наведении, мс. Фокус с клавиатуры показывает сразу.
   * @default 400
   */
  delay?: number;
  /**
   * Не закрывать подсказку, пока указатель движется к ней и находится
   * над ней, — ссылка или кнопка внутри остаются кликабельными.
   * @default false
   */
  isInteractive?: boolean;
  /**
   * Подавляет показ подсказки; триггер продолжает работать.
   * @default false
   */
  isDisabled?: boolean;
  /** Ограничение ширины в пикселях. @default 240 — токен tooltip.maxWidth */
  maxWidth?: number;
  /** Открытость под внешним управлением. */
  isOpen?: boolean;
  /** Открыта при первом рендере; дальше живёт своей жизнью. */
  defaultOpen?: boolean;
  /** Вызывается при каждом открытии и закрытии. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Класс коробки подсказки. */
  className?: string;
}

/**
 * Всплывающая подсказка — появляется по наведению и по фокусу с клавиатуры,
 * закрывается по Escape.
 *
 * Описывает триггер для скринридера через aria-describedby. На сенсорных
 * экранах не показывается — интерфейс обязан быть понятен и без подсказок.
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {
    children,
    content,
    placement = 'top',
    delay = SHOW_DELAY,
    isInteractive = false,
    isDisabled = false,
    maxWidth,
    isOpen,
    defaultOpen,
    onOpenChange,
    className,
  },
  ref,
) {
  return (
    <RACTooltipTrigger
      delay={delay}
      // В reference без interactive подсказка гаснет сразу при уходе
      // указателя, с ним — через 150 мс, чтобы указатель успел дойти
      // до содержимого. closeDelay <= 0 React Aria закрывает немедленно.
      closeDelay={isInteractive ? INTERACTIVE_CLOSE_DELAY : 0}
      isDisabled={isDisabled}
      // exactOptionalPropertyTypes: RAC не принимает isOpen={undefined},
      // непереданные пропсы не передаются вовсе.
      {...(isOpen !== undefined && { isOpen })}
      {...(defaultOpen !== undefined && { defaultOpen })}
      {...(onOpenChange !== undefined && { onOpenChange })}
    >
      {children}
      <RACTooltip
        ref={ref}
        placement={placement}
        offset={TOOLTIP_OFFSET}
        className={clsx(css.tooltip, className)}
        style={maxWidth === undefined ? undefined : { maxWidth }}
      >
        <RACOverlayArrow>
          <div className={css.arrowGlyph} />
        </RACOverlayArrow>
        {content}
      </RACTooltip>
    </RACTooltipTrigger>
  );
});
