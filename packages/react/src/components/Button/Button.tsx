'use client';

import { forwardRef, type ReactNode } from 'react';
import {
  Button as RACButton,
  ProgressBar as RACProgressBar,
  type ButtonProps as RACButtonProps,
  type ButtonRenderProps as RACButtonRenderProps,
} from 'react-aria-components';
import clsx from 'clsx';
import { useMessages } from '@neobook/i18n';
import * as css from './Button.css.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonTextSize = 10 | 12 | 14 | 16;
export type ButtonTextWeight = 'regular' | 'medium';
export type ButtonGap = 4 | 6 | 8;

interface ButtonOwnProps {
  /**
   * Визуальная иерархия. На одной поверхности — не больше одной кнопки
   * `primary`.
   *
   * @default 'secondary'
   */
  variant?: ButtonVariant;
  /** Соответствует токенам `controlHeight.*`. @default 'md' */
  size?: ButtonSize;
  /**
   * Кегль подписи кнопки, px.
   * @default от size
   */
  textSize?: ButtonTextSize;
  /**
   * Начертание подписи кнопки.
   * @default 'medium'
   */
  textWeight?: ButtonTextWeight;
  /**
   * Зазор между иконкой и подписью, px.
   * @default от size
   */
  gap?: ButtonGap;
  /** Иконка перед подписью. */
  leadingIcon?: ReactNode;
  /** Иконка после подписи. */
  trailingIcon?: ReactNode;
  /** Растянуть на ширину контейнера. @default false */
  fullWidth?: boolean;
}

interface ButtonIconOnlyProps extends ButtonOwnProps {
  /**
   * Квадратная кнопка без подписи: ширина равна высоте своего размера.
   * Иконку передавайте как `children` — `leadingIcon` и `trailingIcon`
   * рассчитаны на кнопку с подписью. Подпись в этом режиме выпадает
   * за границы кнопки.
   */
  isIconOnly: true;
  /** Обязателен: без подписи кнопка для скринридера безымянная. */
  'aria-label': string;
}

interface ButtonLabelledProps extends ButtonOwnProps {
  isIconOnly?: false;
}

export type ButtonProps = RACButtonProps &
  (ButtonIconOnlyProps | ButtonLabelledProps) & {
    className?: string;
  };

/**
 * Кнопка — запускает действие.
 *
 * Обработчик нажатия — `onPress`, а не `onClick`: он покрывает мышь,
 * касание, клавиатуру и скринридер одним событием.
 *
 * На время асинхронной операции задавайте `isPending`: кнопка перестаёт
 * реагировать на нажатие, сохраняет ширину и фокус, показывает индикатор
 * и объявляет операцию скринридеру. Внутри формы дополнительно блокирует
 * повторную отправку.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    textSize,
    textWeight,
    gap,
    leadingIcon,
    trailingIcon,
    isIconOnly = false,
    fullWidth = false,
    isPending = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const { t } = useMessages();

  // isPending из React Aria делает четыре вещи, которые рукописный лоадер
  // обычно не делает: оставляет кнопку фокусируемой, объявляет начало и конец
  // операции через live-region, подменяет type="submit" на "button" на время
  // запроса и связывает кнопку с вложенным ProgressBar через aria-labelledby.
  return (
    <RACButton
      ref={ref}
      isPending={isPending}
      className={clsx(
        css.base,
        css.size[size],
        textSize && css.textSize[textSize],
        textWeight && css.textWeight[textWeight],
        gap && css.gap[gap],
        css.variant[variant],
        isIconOnly && css.iconOnly[size],
        fullWidth && css.fullWidth,
        className,
      )}
      {...rest}
    >
      {(renderProps: RACButtonRenderProps & { defaultChildren: ReactNode | undefined }) => (
        <>
          <span className={clsx(css.content, renderProps.isPending && css.contentPending)}>
            {leadingIcon}
            {typeof children === 'function' ? children(renderProps) : children}
            {trailingIcon}
          </span>

          {renderProps.isPending && (
            <span className={css.pendingOverlay}>
              {/* ProgressBar из RAC подхватывает id, который Button кладёт
                  в контекст, и становится доступным именем кнопки на время
                  операции — «Загрузка» вместо прежней подписи. */}
              <RACProgressBar aria-label={t('common.loading')} isIndeterminate>
                <span className={css.pendingSpinner} />
              </RACProgressBar>
            </span>
          )}
        </>
      )}
    </RACButton>
  );
});
