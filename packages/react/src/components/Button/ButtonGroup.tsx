'use client';

import { forwardRef, type ReactNode } from 'react';
import { Group as RACGroup, type GroupProps as RACGroupProps } from 'react-aria-components';
import clsx from 'clsx';
import { buttonGroup } from './Button.css.js';

export type ButtonGroupProps = Omit<RACGroupProps, 'children' | 'className' | 'role'> & {
  children: ReactNode;
  className?: string;
  /** Обязателен: группа без имени для скринридера — просто набор кнопок. */
  'aria-label': string;
};

/**
 * Визуально объединяет несколько кнопок в один блок.
 *
 * Для независимых действий: каждая кнопка остаётся отдельной целью для Tab.
 * Для взаимоисключающего выбора нужен ToggleButtonGroup.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { className, children, ...rest },
  ref,
) {
  // RACGroup из React Aria: role="group" по умолчанию, плюс data-hovered,
  // data-focus-within и data-focus-visible на самой группе.
  return (
    <RACGroup ref={ref} className={clsx(buttonGroup, className)} {...rest}>
      {children}
    </RACGroup>
  );
});
