'use client';

import { forwardRef, type ReactNode } from 'react';
import {
  TextField as RACTextField,
  Label as RACLabel,
  Input as RACInput,
  Text as RACText,
  FieldError as RACFieldError,
  type TextFieldProps as RACTextFieldProps,
  type TextFieldRenderProps as RACTextFieldRenderProps,
} from 'react-aria-components';
import clsx from 'clsx';
import { useMessages } from '@neobook/i18n';
import { TruncatedLabel, truncatedLabelClass } from './TruncatedLabel.js';
import * as css from './TextField.css.js';

export type TextFieldSize = 'sm' | 'md' | 'lg';

export interface TextFieldProps extends Omit<RACTextFieldProps, 'children' | 'className'> {
  /** Подпись поля. Обязательна. */
  label: string;
  /** Пояснение под полем. */
  description?: ReactNode;
  /** Текст ошибки. Функция получает результат браузерной проверки. */
  errorMessage?: ReactNode | ((validation: { validationErrors: string[] }) => ReactNode);
  placeholder?: string;
  /** @default 'md' */
  size?: TextFieldSize;
  /** Содержимое перед полем. Не входит в значение. */
  prefix?: ReactNode;
  /** Содержимое после поля. Не входит в значение. */
  suffix?: ReactNode;
  /** Моноширинный шрифт с табличными цифрами: суммы, идентификаторы, коды. */
  isMonospace?: boolean;
  /**
   * Отмечать необязательные поля вместо обязательных.
   * В пределах одной формы способ должен быть один.
   *
   * @default false
   */
  markOptional?: boolean;
  /**
   * Подпись в одну строку с многоточием.
   * @default false
   */
  truncateLabel?: boolean;
  className?: string;
}

/**
 * Однострочное текстовое поле.
 *
 * Валидация нативная: работают браузерные ограничения `isRequired`,
 * `minLength`, `maxLength`, `pattern` и `type`. При отправке формы фокус
 * переходит на первое невалидное поле. Свой текст ошибки задаётся через
 * `errorMessage`, в том числе функцией от результата проверки.
 *
 * Подпись, описание и сообщение об ошибке связываются с полем автоматически.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    description,
    errorMessage,
    placeholder,
    size = 'md',
    prefix,
    suffix,
    isMonospace = false,
    markOptional = false,
    truncateLabel = false,
    isRequired,
    className,
    ...rest
  },
  ref,
) {
  const { t } = useMessages();

  return (
    <RACTextField
      isRequired={isRequired}
      validationBehavior="native"
      className={clsx(css.field, className)}
      {...rest}
    >
      {({ isInvalid }: RACTextFieldRenderProps) => (
        <>
          <RACLabel className={clsx(css.label, truncateLabel && truncatedLabelClass)}>
            {truncateLabel ? <TruncatedLabel>{label}</TruncatedLabel> : label}
            {isRequired && !markOptional && (
              <span className={css.requiredMark} aria-hidden="true">
                *
              </span>
            )}
            {!isRequired && markOptional && (
              <span className={css.optionalMark}>{t('common.optional')}</span>
            )}
          </RACLabel>

          <div className={clsx(css.inputWrapper, css.size[size], isInvalid && css.invalid)}>
            {prefix && (
              <span className={css.affix} aria-hidden="true">
                {prefix}
              </span>
            )}
            <RACInput
              ref={ref}
              placeholder={placeholder}
              className={clsx(css.input, isMonospace && css.inputMono)}
            />
            {suffix && (
              <span className={css.affix} aria-hidden="true">
                {suffix}
              </span>
            )}
          </div>

          {description && (
            <RACText slot="description" className={css.description}>
              {description}
            </RACText>
          )}

          {/* RACFieldError рендерится только при невалидности и уже связан
              с полем через aria-describedby. Отдельного aria-live не нужно:
              RAC объявляет ошибку в момент её появления. */}
          <RACFieldError className={css.errorMessage}>{errorMessage}</RACFieldError>
        </>
      )}
    </RACTextField>
  );
});
