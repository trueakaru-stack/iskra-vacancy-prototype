/**
 * Контраст WCAG 2.2: формула и пары, для которых он считается.
 *
 * Модуль общий для двух потребителей: сборки токенов (build-tokens.mjs —
 * отчёт по системным темам) и конструктора темы в Storybook (отчёт по теме
 * пользователя). Список пар один, поэтому и цифры у них одни: тема, которая
 * проходит в конструкторе, проходит и у нас.
 *
 * ВАЖНО: это отчёт, а не блокировка. Палитру определяют дизайнеры, и генератор
 * не имеет права её подменять — он только показывает цифры, чтобы разговор
 * с дизайнерами шёл по фактам. Если правка всё же нужна, она приходит
 * из макетов и оформляется НОВЫМ токеном, а не переопределением существующего.
 *
 * Считаются только непрозрачные цвета в записи #rgb / #rrggbb: у rgba и
 * color-mix результат зависит от подложки, и статически его не узнать.
 */

/** '#7847f5' → [120, 71, 245]; всё, что не hex, — null. */
export function parseHex(hex) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** Относительная яркость по WCAG. */
export function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Отношение контраста двух цветов, от 1 до 21. */
export function contrast(a, b) {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Пары семантических токенов: цвет переднего плана, подложка, порог.
 *
 * Список ведётся руками: автоматический перебор всех пар даёт шум,
 * а здесь перечислены сочетания, которые реально встречаются в компонентах.
 */
export const CONTRAST_RULES = [
  // Текст на фоне — WCAG 1.4.3, уровень AA: 4.5:1 для обычного размера.
  { fg: 'fg.default', bg: 'bg.canvas', min: 4.5 },
  { fg: 'fg.default', bg: 'bg.surface', min: 4.5 },
  { fg: 'fg.secondary', bg: 'bg.surface', min: 4.5 },
  {
    fg: 'fg.muted',
    bg: 'bg.surface',
    min: 3.0,
    note: 'вспомогательный текст, допускается как крупный',
  },
  { fg: 'status.negative.fg', bg: 'bg.surface', min: 4.5, note: 'текст ошибки валидации' },
  { fg: 'status.positive.fg', bg: 'bg.surface', min: 3.0 },

  // Текст цвета бренда на поверхности: ссылки, кнопка link, активная
  // вкладка, бейджи primary и accent.
  { fg: 'action.primary.fg', bg: 'bg.surface', min: 4.5, note: 'ссылка, активная вкладка' },
  { fg: 'action.accent.fg', bg: 'bg.surface', min: 4.5, note: 'акцентный текст' },

  // Текст на заливке кнопки — во ВСЕХ состояниях. Hover и active несут тот же
  // текст, что и покой, поэтому исключений для них WCAG не делает.
  { fg: 'fg.onPrimary', bg: 'action.primary.bg', min: 4.5 },
  { fg: 'fg.onPrimary', bg: 'action.primary.bgHover', min: 4.5 },
  { fg: 'fg.onPrimary', bg: 'action.primary.bgActive', min: 4.5 },
  { fg: 'fg.onAccent', bg: 'action.accent.bg', min: 4.5 },
  { fg: 'fg.onAccent', bg: 'action.accent.bgHover', min: 4.5 },
  { fg: 'fg.onAccent', bg: 'action.accent.bgActive', min: 4.5 },
  { fg: 'fg.onDanger', bg: 'action.danger.bg', min: 4.5 },
  { fg: 'fg.onDanger', bg: 'action.danger.bgHover', min: 4.5 },

  // Границы интерактивных контролов — WCAG 1.4.11 (non-text contrast): 3:1.
  { fg: 'border.default', bg: 'bg.surface', min: 3.0, note: 'граница input/select — WCAG 1.4.11' },
  { fg: 'border.focus', bg: 'bg.surface', min: 3.0, note: 'индикатор фокуса — WCAG 1.4.11' },

  // Инициалы в аватаре — обычный (мелкий) текст, AA: 4.5:1.
  // Тёмная тема задана через color-mix и статически не считается — пары
  // пропускаются, это ограничение отчёта, а не их отсутствие в макетах.
  { fg: 'avatar.c1.fg', bg: 'avatar.c1.bg', min: 4.5, note: 'инициалы аватара' },
  { fg: 'avatar.c2.fg', bg: 'avatar.c2.bg', min: 4.5, note: 'инициалы аватара' },
  { fg: 'avatar.c3.fg', bg: 'avatar.c3.bg', min: 4.5, note: 'инициалы аватара' },
  { fg: 'avatar.c4.fg', bg: 'avatar.c4.bg', min: 4.5, note: 'инициалы аватара' },
  { fg: 'avatar.c5.fg', bg: 'avatar.c5.bg', min: 4.5, note: 'инициалы аватара' },
];
