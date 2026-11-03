'use client';

import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import {
  ModalOverlay as RACModalOverlay,
  Modal as RACModal,
  Dialog as RACDialog,
  Heading as RACHeading,
  type DialogRenderProps as RACDialogRenderProps,
} from 'react-aria-components';
import { useMessages } from '@neobook/i18n';
import clsx from 'clsx';
import { IconX } from '@neobook/icons';
import { Button } from '../Button/Button.js';
import { varName } from '../../utils/varName.js';
import * as css from './Modal.css.js';

/**
 * Габарит коробки: ширина 400 / 480 / 640 / 1296px; `full` занимает область
 * подложки целиком, по ширине и по высоте.
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Подложка: стандартная, с размытием фона или без затемнения. */
export type ModalBackdrop = 'default' | 'blur' | 'transparent';

/** Скругление коробки — ступень шкалы `radius` без `full`. */
export type ModalRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Число — пиксели, строка — как есть. */
function toCssLength(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export interface ModalProps {
  /** Открытость под внешним управлением. Закрытое окно размонтировано. */
  isOpen?: boolean;
  /** Открыто при первом рендере; дальше живёт своей жизнью. */
  defaultOpen?: boolean;
  /**
   * Вызывается при каждом открытии и закрытии: Escape, клик по подложке
   * (если разрешён) и кнопка закрытия в шапке приходят сюда с `false`.
   */
  onOpenChange?: (isOpen: boolean) => void;
  /** Видимый заголовок шапки; им же окно названо для скринридера. */
  title: ReactNode;
  /** Ширина коробки: 400 / 480 / 640px. @default 'md' */
  size?: ModalSize;
  /**
   * Подложка за окном.
   * @default 'default'
   */
  backdrop?: ModalBackdrop;
  /**
   * Ширина окна: число в px или строка CSS.
   * @default от size
   */
  width?: number | string;
  /**
   * Высота окна: число в px или строка CSS.
   * @default по содержимому
   */
  height?: number | string;
  /**
   * Скругление углов окна.
   * @default 'lg'
   */
  radius?: ModalRadius;
  /** Закрывать по клику на подложку. Для разрушающих действий задавайте `false`. @default true */
  isDismissable?: boolean;
  /** Содержимое тела — свободная композиция, включая формы. Прокручивается, выше 70vh не растёт. */
  children?: ReactNode;
  /** Содержимое подвала, обычно «Отмена» и кнопка действия. Не задан — подвала нет. */
  footer?: ReactNode;
  /** Заменяет крест в кнопке закрытия шапки. */
  closeIcon?: ReactNode;
  /** Класс поверхности окна. */
  className?: string;
}

/**
 * Модальное окно — блокирующая поверхность для форм и произвольного
 * содержимого: шапка с заголовком и кнопкой закрытия, прокручиваемое
 * тело, необязательный подвал.
 *
 * Модальное: блокирует страницу и прокрутку, держит фокус внутри,
 * по закрытии возвращает его туда, откуда окно открыли. Escape
 * закрывает всегда; клик по подложке — пока не запрещён `isDismissable`.
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    isOpen,
    defaultOpen,
    onOpenChange,
    title,
    size = 'md',
    backdrop = 'default',
    width,
    height,
    radius,
    isDismissable = true,
    children,
    footer,
    closeIcon,
    className,
  },
  ref,
) {
  const { t } = useMessages();

  const sizeStyle: Record<string, string> = {};
  if (width !== undefined) sizeStyle[varName(css.widthVar)] = toCssLength(width);
  if (height !== undefined) sizeStyle[varName(css.heightVar)] = toCssLength(height);
  // Окно с заданной высотой — колонка: тело забирает остаток и прокручивается.
  const isFilled = height !== undefined || size === 'full';

  return (
    <RACModalOverlay
      className={clsx(css.backdrop, backdrop !== 'default' && css.backdropVariant[backdrop])}
      // Умолчание React Aria — false; в reference клик по подложке
      // закрывает, пока не выключен пропом (closeOnBackdrop).
      isDismissable={isDismissable}
      // exactOptionalPropertyTypes: RAC не принимает isOpen={undefined},
      // непереданные пропсы не передаются вовсе.
      {...(isOpen !== undefined && { isOpen })}
      {...(defaultOpen !== undefined && { defaultOpen })}
      {...(onOpenChange !== undefined && { onOpenChange })}
    >
      <RACModal
        ref={ref}
        className={clsx(
          css.modal,
          css.size[size],
          radius !== undefined && css.radius[radius],
          width !== undefined && css.customWidth,
          height !== undefined && css.customHeight,
          className,
        )}
        style={sizeStyle as CSSProperties}
      >
        <RACDialog className={clsx(css.surface, isFilled && css.surfaceFill)}>
          {({ close }: RACDialogRenderProps) => (
            <>
              <div className={css.head}>
                <RACHeading slot="title" className={css.title}>
                  {title}
                </RACHeading>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label={t('common.close')}
                  onPress={close}
                >
                  {closeIcon ?? <IconX />}
                </Button>
              </div>
              <div className={clsx(css.body, isFilled && css.bodyFill)}>{children}</div>
              {footer !== undefined && <div className={css.foot}>{footer}</div>}
            </>
          )}
        </RACDialog>
      </RACModal>
    </RACModalOverlay>
  );
});
