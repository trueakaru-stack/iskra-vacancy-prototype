'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Focusable, Tooltip } from '../Tooltip/index.js';
import * as css from './TruncatedLabel.css.js';

/** Класс подписи поля, у которой включён `truncateLabel`. */
export const truncatedLabelClass = css.label;

/**
 * Текст подписи в одну строку с многоточием. Полный текст показывает Tooltip
 * по наведению и по фокусу с клавиатуры — только пока текст действительно
 * обрезан.
 *
 * Внутренний помощник полей: кладётся внутрь `Label` вместо голой строки.
 */
export function TruncatedLabel({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setIsTruncated(element.scrollWidth > element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  return (
    <Tooltip content={children} isDisabled={!isTruncated}>
      {/* Остановка табуляции появляется только у обрезанной подписи: у целой
          подсказывать нечего. */}
      <Focusable excludeFromTabOrder={!isTruncated}>
        <span ref={ref} className={css.text}>
          {children}
        </span>
      </Focusable>
    </Tooltip>
  );
}
