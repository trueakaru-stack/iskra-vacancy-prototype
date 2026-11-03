'use client';

import { forwardRef, type ReactNode } from 'react';
import {
  ProgressBar as RACProgressBar,
  Label as RACLabel,
  type ProgressBarProps as RACProgressBarProps,
  type ProgressBarRenderProps as RACProgressBarRenderProps,
} from 'react-aria-components';
import clsx from 'clsx';
import * as css from './Progress.css.js';

export type ProgressVariant =
  | 'primary'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'info'
  | 'neutral';

export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';

export type ProgressReadout = 'percentage' | 'absolute';

/**
 * Пропсы React Aria, которые компонент раздаёт сам: разметку он строит
 * целиком, поэтому `children`, `className` и `style` наружу не выпускает.
 */
type RACBase = Omit<RACProgressBarProps, 'children' | 'className' | 'style' | 'valueLabel'>;

interface ProgressBaseProps extends RACBase {
  /**
   * Цвет заливки. Выбирается по смыслу метрики, а не по её значению:
   * загрузка на 96% — не ошибка.
   *
   * @default 'primary'
   */
  variant?: ProgressVariant;
  /** Высота дорожки: 4, 6, 8 или 12px. @default 'md' */
  size?: ProgressSize;
  /**
   * Текст справа в строке подписи вместо автоматического. Строку компонент
   * отдаёт и скринридеру (`aria-valuetext`); разметку — только глазам,
   * скринридер в этом случае читает значение, отформатированное
   * по `formatOptions`.
   *
   * Приглушённый знаменатель набирается `ProgressUnit`.
   */
  valueLabel?: ReactNode;
  /**
   * Что показать справа, когда `valueLabel` не задан.
   *
   * `percentage` — долю, отформатированную по правилам локали.
   * `absolute` — ничего: абсолютный отсчёт передаётся через `valueLabel`.
   *
   * Голая полоса без строки подписи — это `absolute` без `label`
   * и без `valueLabel`.
   *
   * @default 'percentage'
   */
  readout?: ProgressReadout;
  /** Диагональная штриховка на заливке. @default false */
  striped?: boolean;
  /** Движение штриховки. Действует только вместе со `striped`. @default false */
  animated?: boolean;
  className?: string | undefined;
}

/**
 * Полоса без видимой подписи обязана нести `aria-label` — иначе для
 * скринридера она безымянна. Это выражено типами, а не документацией.
 */
export type ProgressProps =
  | (ProgressBaseProps & {
      /** Подпись слева в строке над дорожкой. */
      label: ReactNode;
    })
  | (ProgressBaseProps & { label?: undefined; 'aria-label': string });

/**
 * Приглушённый знаменатель внутри `valueLabel`: `340 <ProgressUnit>/ 500 ГБ</ProgressUnit>`.
 *
 * Потреблённая величина остаётся акцентом, единица измерения уходит на
 * второй план.
 */
export function ProgressUnit({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <span className={clsx(css.unit, className)}>{children}</span>;
}

/**
 * Полоса выполнения: доля пройденного у задачи или квоты с известным
 * пределом.
 *
 * Доля считается от `value` в границах `minValue`/`maxValue` — умножать
 * на сто самому не нужно. Когда предел неизвестен, ставится
 * `isIndeterminate`: бегунок ездит по дорожке, а `value` не читается.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    variant = 'primary',
    size = 'md',
    label,
    valueLabel,
    readout = 'percentage',
    striped = false,
    animated = false,
    className,
    ...rest
  },
  ref,
) {
  // React Aria кладёт valueLabel в aria-valuetext. Разметка туда попасть
  // не может — отдаём только строку, остальное остаётся форматированным
  // значением.
  const racValueLabel = typeof valueLabel === 'string' ? valueLabel : undefined;

  return (
    <RACProgressBar
      ref={ref}
      className={clsx(css.base, className)}
      valueLabel={racValueLabel}
      {...rest}
    >
      {({ percentage, valueText, isIndeterminate }: RACProgressBarRenderProps) => {
        const readoutNode = valueLabel ?? (readout === 'percentage' ? valueText : undefined);

        return (
          <>
            {(label !== undefined || readoutNode !== undefined) && (
              <div className={css.meta}>
                {label !== undefined && <RACLabel className={css.label}>{label}</RACLabel>}
                {readoutNode !== undefined && <span className={css.value}>{readoutNode}</span>}
              </div>
            )}

            <div className={clsx(css.track, css.trackSize[size])}>
              <div
                className={clsx(
                  css.fill,
                  css.fillVariant[variant],
                  striped && css.striped,
                  striped && animated && css.animated,
                  isIndeterminate && css.indeterminateFill,
                )}
                style={isIndeterminate ? undefined : { width: `${percentage ?? 0}%` }}
              />
            </div>
          </>
        );
      }}
    </RACProgressBar>
  );
});
