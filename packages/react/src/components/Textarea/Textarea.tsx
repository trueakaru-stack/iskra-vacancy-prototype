'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  TextField as RACTextField,
  Label as RACLabel,
  TextArea as RACTextArea,
  Text as RACText,
  FieldError as RACFieldError,
  VisuallyHidden as RACVisuallyHidden,
  type TextFieldProps as RACTextFieldProps,
} from 'react-aria-components';
import clsx from 'clsx';
import { useMessages, useNumberFormatter } from '@neobook/i18n';
import * as css from './Textarea.css.js';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends Omit<RACTextFieldProps, 'children' | 'className' | 'type'> {
  /** Подпись поля. Обязательна. */
  label: string;
  /** Пояснение под полем. При заданном `maxLength` встаёт слева от счётчика. */
  description?: ReactNode;
  /** Текст ошибки. Функция получает результат браузерной проверки. */
  errorMessage?: ReactNode | ((validation: { validationErrors: string[] }) => ReactNode);
  placeholder?: string;
  /** @default 'md' */
  size?: TextareaSize;
  /** Стартовое число видимых строк. Не действует вместе с `isAutoGrow`. */
  rows?: number;
  /**
   * Подгонять высоту под содержимое. Ручное растягивание при этом выключено.
   *
   * @default false
   */
  isAutoGrow?: boolean;
  /**
   * Предел длины. Включает счётчик «введено / предел» под полем и
   * ограничивает ввод браузерными средствами.
   */
  maxLength?: number;
  /**
   * Отмечать необязательные поля вместо обязательных.
   * В пределах одной формы способ должен быть один.
   *
   * @default false
   */
  markOptional?: boolean;
  className?: string;
}

/**
 * Многострочное текстовое поле.
 *
 * Валидация нативная: работают браузерные ограничения `isRequired`,
 * `minLength` и `maxLength`. При отправке формы фокус переходит на первое
 * невалидное поле. Свой текст ошибки задаётся через `errorMessage`,
 * в том числе функцией от результата проверки.
 *
 * Подпись, описание и сообщение об ошибке связываются с полем автоматически.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    description,
    errorMessage,
    placeholder,
    size = 'md',
    rows,
    isAutoGrow = false,
    maxLength,
    markOptional = false,
    isRequired,
    value,
    defaultValue,
    onChange,
    className,
    ...rest
  },
  ref,
) {
  const { t } = useMessages();
  // Счётчик — числа на экране: цифры и группировка разрядов зависят
  // от локали, вручную их складывать нельзя.
  const number = useNumberFormatter();

  const innerRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

  // Счётчику и автовысоте нужно текущее значение, а render-пропы
  // React Aria его не отдают. Собственное состояние держит неуправляемый
  // случай, управляемый читается из пропа.
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
  const currentValue = value ?? uncontrolled;

  const handleChange = useCallback(
    (next: string) => {
      setUncontrolled(next);
      onChange?.(next);
    },
    [onChange],
  );

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (!isAutoGrow) {
      el.style.height = '';
      return;
    }

    el.style.height = 'auto';
    // scrollHeight не включает рамку, а коробка считается по border-box:
    // без добавки толщины рамок последняя строка обрезается на 2px.
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [isAutoGrow, currentValue, size, rows]);

  const length = currentValue.length;
  const hasCounter = maxLength != null;
  const isOver = hasCounter && length > maxLength;

  const control = (
    <RACTextArea
      ref={innerRef}
      rows={isAutoGrow ? undefined : rows}
      placeholder={placeholder}
      className={clsx(css.textarea, css.size[size], isAutoGrow && css.autoGrow)}
    />
  );

  const descriptionEl = description ? (
    <RACText slot="description" className={clsx(css.description, hasCounter && css.footDescription)}>
      {description}
    </RACText>
  ) : null;

  return (
    <RACTextField
      isRequired={isRequired}
      maxLength={maxLength}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      validationBehavior="native"
      className={clsx(css.field, className)}
      {...rest}
    >
      <RACLabel className={css.label}>
        {label}
        {isRequired && !markOptional && (
          <span className={css.requiredMark} aria-hidden="true">
            *
          </span>
        )}
        {!isRequired && markOptional && (
          <span className={css.optionalMark}>{t('common.optional')}</span>
        )}
      </RACLabel>

      {hasCounter ? (
        <div className={css.wrap}>
          {control}
          <div className={css.foot}>
            {descriptionEl}
            <span className={clsx(css.count, isOver && css.countOver)} aria-hidden="true">
              {number.format(length)} / {number.format(maxLength)}
            </span>
            {/* Счётчик скрыт от скринридера: «12 / 200» вне контекста
                не читается. Взамен остаток проговаривается словами.
                В макетах этого нет — там счётчик только зрительный. */}
            <RACVisuallyHidden aria-live="polite">
              {isOver
                ? t('field.charactersOver', { count: length - maxLength })
                : t('field.charactersLeft', { count: maxLength - length })}
            </RACVisuallyHidden>
          </div>
        </div>
      ) : (
        <>
          {control}
          {descriptionEl}
        </>
      )}

      {/* RACFieldError рендерится только при невалидности и уже связан
          с полем через aria-describedby. */}
      <RACFieldError className={css.errorMessage}>{errorMessage}</RACFieldError>
    </RACTextField>
  );
});
