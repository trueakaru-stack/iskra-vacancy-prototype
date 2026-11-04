'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import {
  Button as RACButton,
  VisuallyHidden as RACVisuallyHidden,
} from 'react-aria-components';
import clsx from 'clsx';
import { useMessages, useNumberFormatter } from '@neobook/i18n';
import { IconCheck, IconX } from '@neobook/icons';
import * as css from './Stepper.css.js';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepState = 'complete' | 'current' | 'upcoming' | 'available' | 'error';

export interface StepperStep {
  /** Короткая подпись шага, одно-два слова. */
  label: ReactNode;
  /**
   * Вторая строка — конкретный результат шага (количество, имя),
   * а не пересказ подписи.
   */
  description?: ReactNode;
  /**
   * Явное состояние. Без него состояние выводится из позиции шага
   * относительно `current`: до него — `complete`, на нём — `current`,
   * после — `upcoming`.
   */
  state?: StepState;
}

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  /** @default 'horizontal' */
  orientation?: StepperOrientation;
  /** Упорядоченный список шагов. */
  steps: StepperStep[];
  /** Индекс активного шага; предыдущие отображаются завершёнными. @default 0 */
  current?: number;
  /**
   * Вызывается с индексом завершённого шага при его активации.
   * Когда обработчик задан, завершённые шаги становятся кнопками —
   * по ним можно вернуться назад. Без обработчика все шаги статичны.
   */
  onStepPress?: (index: number) => void;
}
/**
 * Индикатор прохождения многошагового процесса: мастер импорта,
 * онбординг, оформление.
 *
 * Не навигация: сам по себе шаги не переключает. Текущий шаг задаёт
 * `current`, содержимое шага рендерит вызывающий. Текущий шаг помечается
 * `aria-current="step"`, состояние завершённых и ошибочных шагов
 * дублируется скрытым текстом для скринридера.
 */
export const Stepper = forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  { orientation = 'horizontal', steps, current = 0, onStepPress, className, ...rest },
  ref,
) {
  const { t } = useMessages();
  // Номер шага — это число: в локалях с другой системой цифр
  // (например, ar-EG) он обязан отображаться их цифрами.
  const number = useNumberFormatter();

  return (
    <div
      ref={ref}
      className={clsx(css.stepper, orientation === 'vertical' && css.vertical, className)}
      {...rest}
    >
      {steps.map((stepData, index) => {
        const state: StepState =
          stepData.state ??
          (index < current ? 'complete' : index === current ? 'current' : 'upcoming');
        const isInteractive =
          onStepPress != null && (state === 'complete' || state === 'available');
        const stepClass = clsx(css.step, css.stepState[state]);
        const ariaCurrent = state === 'current' ? ('step' as const) : undefined;

        // Иконки скрыты от скринридера, состояние произносит скрытый текст —
        // он позиционирован абсолютно и на flex-раскладку маркера не влияет.
        const content = (
          <>
            <div className={css.marker}>
              {state === 'complete' ? (
                <IconCheck />
              ) : state === 'error' ? (
                <IconX />
              ) : (
                number.format(index + 1)
              )}
              {state === 'complete' && (
                <RACVisuallyHidden>{t('stepper.completed')}</RACVisuallyHidden>
              )}
              {state === 'error' && <RACVisuallyHidden>{t('stepper.error')}</RACVisuallyHidden>}
            </div>
            <div className={css.labels}>
              <span className={css.label}>{stepData.label}</span>
              {stepData.description != null && (
                <span className={css.sub}>{stepData.description}</span>
              )}
            </div>
          </>
        );

        if (isInteractive) {
          return (
            <RACButton
              key={index}
              className={clsx(stepClass, css.stepButton)}
              data-state={state}
              aria-current={ariaCurrent}
              onPress={() => onStepPress(index)}
            >
              {content}
            </RACButton>
          );
        }

        return (
          <div key={index} className={stepClass} data-state={state} aria-current={ariaCurrent}>
            {content}
          </div>
        );
      })}
    </div>
  );
});
