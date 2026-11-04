'use client';

import { forwardRef, type ReactNode } from 'react';
import {
  NumberField as RACNumberField,
  Group as RACGroup,
  Input as RACInput,
  Button as RACButton,
  Label as RACLabel,
  Text as RACText,
  FieldError as RACFieldError,
  type NumberFieldProps as RACNumberFieldProps,
  type NumberFieldRenderProps as RACNumberFieldRenderProps,
} from 'react-aria-components';
import clsx from 'clsx';
import { useMessages, type NumberFormatOptions } from '@neobook/i18n';
import { IconMinus, IconPlus } from '@neobook/icons';
import { TruncatedLabel, truncatedLabelClass } from '../TextField/TruncatedLabel.js';
import * as css from './NumberInput.css.js';

export type NumberInputSize = 'sm' | 'md' | 'lg';

/**
 * `currency` расширяет поле и прижимает число к концу строки; `stepper`
 * и `unit` делят базовую раскладку с центрированным числом.
 */
export type NumberInputVariant = 'stepper' | 'currency' | 'unit';

/**
 * Формат валютного варианта по умолчанию: два знака после запятой
 * и разделители разрядов. В макетах это `toLocaleString('en-US')`
 * с жёстко зашитой локалью; здесь формат следует локали интерфейса.
 * Перебивается своим `formatOptions` — например, со `style: 'currency'`,
 * когда знак валюты нужен внутри самого числа, а не аффиксом.
 */
const CURRENCY_FORMAT: NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};
/**
 * Пропсы React Aria и наши — в одном интерфейсе, объединение вокруг подписи
 * навешивается снаружи (см. NumberInputProps).
 *
 * Форма важна для таблицы пропсов: react-docgen-typescript разворачивает
 * `interface … extends Omit<…>`, но не разворачивает ни псевдоним типа
 * с `Omit`, ни пересечение внутри рукава объединения.
 */
interface NumberInputBase
  extends Omit<RACNumberFieldProps, 'children' | 'className' | 'style' | 'formatOptions'> {
  /**
   * Формат числа: разряды, знаки после запятой, валюта, проценты, единицы.
   * Следует локали и задаёт, какие символы разрешено вводить.
   * Тип из `@neobook/i18n` — тот же, что у `useNumberFormatter`.
   */
  formatOptions?: NumberFormatOptions;
  /** Пояснение под полем. */
  description?: ReactNode;
  /** Текст ошибки. Функция получает результат браузерной проверки. */
  errorMessage?: ReactNode | ((validation: { validationErrors: string[] }) => ReactNode);
  /** @default 'md' */
  size?: NumberInputSize;
  /** @default 'stepper' */
  variant?: NumberInputVariant;
  /** Содержимое перед полем — знак валюты, обозначение. Не входит в значение. */
  prefix?: ReactNode;
  /** Содержимое после поля — единица измерения, код валюты. Не входит в значение. */
  suffix?: ReactNode;
  /**
   * Ширина коробки поля вместе с кнопками шага и аффиксами; число занимает
   * всё оставшееся место. Число — в пикселях, строка — любая длина CSS,
   * например `'100%'`, чтобы растянуть коробку на ширину колонки формы.
   *
   * По умолчанию коробка обнимает содержимое: под число отведено 68px,
   * у `currency` — 96px. В валютное поле так помещается до `999 999,99`,
   * в остальные — целые до `999 999`; для чисел крупнее задайте ширину.
   */
  width?: number | string;
  /**
   * Кнопки шага по краям поля. Шаг с клавиатуры (↑ ↓) работает и без них.
   *
   * @default true
   */
  showSteppers?: boolean;
  /**
   * Выравнивание числа внутри поля.
   * @default 'center', у currency — 'end'
   */
  textAlign?: 'start' | 'center' | 'end';
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

interface NumberInputLabelledProps {
  /** Подпись над полем. Без неё обязателен `aria-label`. */
  label: string;
}

interface NumberInputAriaLabelledProps {
  label?: undefined;
  /** Обязателен без `label`: без подписи поле для скринридера безымянное. */
  'aria-label': string;
}

export type NumberInputProps = NumberInputBase &
  (NumberInputLabelledProps | NumberInputAriaLabelledProps);

/**
 * Числовое поле — ввод числа с клавиатуры или кнопками шага.
 *
 * Значение всегда число, а не строка: `onChange` отдаёт `number`, границы
 * задаются `minValue` и `maxValue`, величина шага — `step`. Разбор ввода
 * и формат вывода следуют локали, включая разделитель дробной части
 * и разряды: `1 234,50` на русском, `1,234.50` на английском.
 *
 * Валидация нативная — работают браузерные ограничения `isRequired`,
 * `minValue`, `maxValue` и `step`. Подпись, описание и сообщение об ошибке
 * связываются с полем автоматически.
 */
export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>(function NumberInput(
  {
    label,
    description,
    errorMessage,
    size = 'md',
    variant = 'stepper',
    prefix,
    suffix,
    showSteppers = true,
    textAlign,
    markOptional = false,
    truncateLabel = false,
    width,
    formatOptions,
    isRequired,
    className,
    ...rest
  },
  ref,
) {
  const { t } = useMessages();

  return (
    <RACNumberField
      ref={ref}
      isRequired={isRequired}
      validationBehavior="native"
      formatOptions={formatOptions ?? (variant === 'currency' ? CURRENCY_FORMAT : undefined)}
      className={clsx(css.field, className)}
      {...rest}
    >
      {({ isInvalid }: RACNumberFieldRenderProps) => (
        <>
          {label != null && (
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
          )}

          {/* Ширина ложится на коробку, а не на поле ввода: у поля flex: 1,
              и оно само забирает всё, что осталось от кнопок и аффиксов. */}
          <RACGroup
            className={clsx(css.group, css.size[size], isInvalid && css.invalid)}
            {...(width !== undefined && { style: { width } })}
          >
            {showSteppers && (
              <RACButton slot="decrement" className={clsx(css.stepperButton, css.buttonSize[size])}>
                <IconMinus />
              </RACButton>
            )}
            {prefix && (
              <span className={clsx(css.affix, css.affixPrefix)} aria-hidden="true">
                {prefix}
              </span>
            )}
            <RACInput
              className={clsx(
                css.input,
                css.inputSize[size],
                variant === 'currency' && css.inputCurrency,
                textAlign && css.inputAlign[textAlign],
              )}
            />
            {suffix && (
              <span className={clsx(css.affix, css.affixSuffix)} aria-hidden="true">
                {suffix}
              </span>
            )}
            {showSteppers && (
              <RACButton slot="increment" className={clsx(css.stepperButton, css.buttonSize[size])}>
                <IconPlus />
              </RACButton>
            )}
          </RACGroup>

          {description && (
            <RACText slot="description" className={css.description}>
              {description}
            </RACText>
          )}

          {/* RACFieldError рендерится только при невалидности и уже связан
              с полем через aria-describedby. */}
          <RACFieldError className={css.errorMessage}>{errorMessage}</RACFieldError>
        </>
      )}
    </RACNumberField>
  );
});
