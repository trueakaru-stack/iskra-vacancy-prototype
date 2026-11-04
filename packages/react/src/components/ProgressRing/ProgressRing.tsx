'use client';

import { forwardRef, type ReactNode } from 'react';
import {
  ProgressBar as RACProgressBar,
  type ProgressBarProps as RACProgressBarProps,
  type ProgressBarRenderProps as RACProgressBarRenderProps,
} from 'react-aria-components';
import clsx from 'clsx';
import * as css from './ProgressRing.css.js';

type ProgressVariant = keyof typeof css.fillVariant;
export type ProgressRingSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Окружность нормирована на 100 единиц: при `r = 15.9155` длина дуги равна
 * доле в процентах, и `stroke-dasharray` принимает её без пересчёта.
 */
const RING_RADIUS = 15.9155;

/** Центр и сторона `viewBox` кольца. */
const RING_CENTER = 18;
const RING_VIEW_BOX = 36;

/**
 * Пропсы React Aria, которые компонент раздаёт сам: разметку он строит
 * целиком, поэтому `children`, `className` и `style` наружу не выпускает.
 * `isIndeterminate` закрыт — вида ожидания у кольца в макетах нет,
 * дуга осталась бы неподвижной на нуле.
 */
type RACBase = Omit<
  RACProgressBarProps,
  'children' | 'className' | 'style' | 'valueLabel' | 'isIndeterminate'
>;

export interface ProgressRingProps extends RACBase {
  /** Цвет дуги. Выбирается по смыслу метрики, а не по её значению. @default 'primary' */
  variant?: ProgressVariant;
  /** Диаметр: 52, 72, 104 или 140px. @default 'md' */
  size?: ProgressRingSize;
  /**
   * Текст в центре вместо автоматической доли. Строку компонент отдаёт
   * и скринридеру (`aria-valuetext`); разметку — только глазам.
   *
   * Для абсолютного отсчёта здесь стоит счётчик, а знаменатель уходит
   * в `subLabel`.
   */
  valueLabel?: ReactNode;
  /** Приглушённая строка под значением: «из 25 мест», «SLA выдержан». */
  subLabel?: ReactNode;
  /** Название метрики для скринридера. В центре кольца стоит значение, а не подпись. */
  'aria-label': string;
  className?: string | undefined;
}

/**
 * Круговая полоса выполнения: доля пройденного в компактном следе —
 * для плиток дашборда.
 *
 * Дуга всегда кодирует долю `value` от `maxValue`, даже когда в центре стоит
 * абсолютный счётчик. Видимой подписи у кольца нет, поэтому `aria-label`
 * обязателен.
 */
export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(function ProgressRing(
  { variant = 'primary', size = 'md', valueLabel, subLabel, className, ...rest },
  ref,
) {
  // React Aria кладёт valueLabel в aria-valuetext. Разметка туда попасть
  // не может — отдаём только строку, остальное остаётся форматированным
  // значением.
  const racValueLabel = typeof valueLabel === 'string' ? valueLabel : undefined;

  return (
    <RACProgressBar
      ref={ref}
      className={clsx(css.base, css.sizeVariant[size], className)}
      valueLabel={racValueLabel}
      {...rest}
    >
      {({ percentage, valueText }: RACProgressBarRenderProps) => (
        <>
          <svg
            className={css.canvas}
            viewBox={`0 0 ${RING_VIEW_BOX} ${RING_VIEW_BOX}`}
            aria-hidden="true"
          >
            <circle className={css.track} cx={RING_CENTER} cy={RING_CENTER} r={RING_RADIUS} />
            <circle
              className={clsx(css.fill, css.fillVariant[variant])}
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              style={{ strokeDasharray: `${percentage ?? 0} 100` }}
            />
          </svg>

          <div className={css.center}>
            <span className={clsx(css.value, css.valueSize[size])}>{valueLabel ?? valueText}</span>
            {subLabel !== undefined && <span className={css.sub}>{subLabel}</span>}
          </div>
        </>
      )}
    </RACProgressBar>
  );
});
