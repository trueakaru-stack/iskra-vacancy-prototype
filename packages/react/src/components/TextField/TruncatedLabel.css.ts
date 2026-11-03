import { globalStyle, style } from '@vanilla-extract/css';

/*
 * Подпись поля в одну строку: `truncateLabel` у TextField, Select, Combobox
 * и NumberInput. Подпись остаётся тем же `label` поля, сюда вынесено только то,
 * что нужно для обрезки.
 */

/**
 * Дополнение к `label` поля. У подписи `width: fit-content`, а у обрезаемого
 * текста минимальная ширина — вся строка: без потолка подпись вылезала бы
 * за поле, а не сжималась.
 */
export const label = style({
  minWidth: 0,
  maxWidth: '100%',
});

/** Текст подписи: обрезается многоточием, а не переносится. */
export const text = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

// Отметки «*» и «необязательно» стоят рядом с текстом и не сжимаются:
// обрезается только он.
globalStyle(`${label} > :not(${text})`, {
  flex: 'none',
});
