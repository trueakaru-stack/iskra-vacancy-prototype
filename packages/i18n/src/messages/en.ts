import { plural } from '../plural.js';

/**
 * Английский словарь — источник истины для набора ключей.
 *
 * Из него выводится тип Dictionary, поэтому любой другой язык обязан
 * содержать ровно эти ключи с ровно такими сигнатурами. Пропущенный
 * или лишний ключ — ошибка компиляции, а не пустая строка в проде.
 *
 * Здесь живут ТОЛЬКО строки самой дизайн-системы: подписи для скринридеров,
 * плейсхолдеры, служебные подсказки. Контентные строки приложения сюда
 * не попадают — за них отвечает i18n потребителя.
 */
export const en = {
  // --- Общее ---
  'common.close': 'Close',
  'common.clear': 'Clear',
  'common.loading': 'Loading',
  'common.required': 'Required',
  'common.optional': 'optional',

  // --- Button ---
  'button.busy': 'Action in progress',

  // --- TextField ---
  'field.clear': 'Clear field',
  'field.showPassword': 'Show password',
  'field.hidePassword': 'Hide password',
  'field.charactersLeft': ({ count, locale }: { count: number; locale: string }) =>
    `${count} ${plural(locale, count, { one: 'character', other: 'characters' })} left`,
  'field.charactersOver': ({ count, locale }: { count: number; locale: string }) =>
    `${count} ${plural(locale, count, { one: 'character', other: 'characters' })} over the limit`,

  // --- Select ---
  'select.placeholder': 'Select…',
  'select.empty': 'No options',
  'select.selectedCount': ({ count, locale }: { count: number; locale: string }) =>
    `${count} ${plural(locale, count, { one: 'item', other: 'items' })} selected`,
  // Числа приходят строками: они уже отформатированы useNumberFormatter
  // под цифры локали. `count` нужен числом — по нему выбирается форма.
  'select.selectedOfTotal': ({
    selected,
    total,
  }: {
    count: number;
    selected: string;
    total: string;
    locale: string;
  }) => `${selected} of ${total} selected`,
  'select.selectedValues': 'Selected values',
  'select.apply': 'Apply',

  // --- Combobox ---
  'combobox.empty': 'No matches',
  'combobox.loading': 'Searching…',
  'combobox.create': 'Create',
  'combobox.selectedValues': 'Selected values',
  'combobox.moreSelected': ({ count, locale }: { count: number; locale: string }) =>
    `${count} more ${plural(locale, count, { one: 'item', other: 'items' })} selected`,

  // --- Stepper ---
  'stepper.completed': 'Completed',
  'stepper.error': 'Error',

  // --- Slider ---
  'slider.minimum': 'Minimum',
  'slider.maximum': 'Maximum',

  // --- Pagination ---
  // Номера страниц приходят строками: они уже отформатированы
  // useNumberFormatter под цифры локали.
  'pagination.label': 'Pagination',
  'pagination.previous': 'Previous',
  'pagination.next': 'Next',
  'pagination.page': ({ page }: { page: string }) => `Page ${page}`,
  // totalPages помечен `| undefined` явно: при exactOptionalPropertyTypes
  // без этого вызывающий не сможет передать «общего числа нет».
  'pagination.status': ({ page, totalPages }: { page: string; totalPages?: string | undefined }) =>
    totalPages != null ? `Page ${page} of ${totalPages}` : `Page ${page}`,
  'pagination.pageSize': 'Rows per page',

  // --- Banner ---
  // Не common.close: баннер не закрывают, а отклоняют — сообщение уходит,
  // а условие, о котором оно говорит, остаётся.
  'banner.dismiss': 'Dismiss',

  // --- Breadcrumbs ---
  // Подпись ориентира стоит и на <nav>, и на списке React Aria: у списка
  // своя локализованная строка, и без явной подписи скринридер прочитал бы
  // два разных названия подряд.
  'breadcrumbs.label': 'Breadcrumbs',
  'breadcrumbs.showMore': 'Show more',

  // --- DatePicker ---
  // Названия месяцев и дней недели, объявление выбранной даты и подсказки
  // по клавиатуре приходят из React Aria — он поставляет их на 30+ языках.
  // Здесь только то, что задано макетами: подписи кнопок листания в макетах
  // объявлены пропсами prevMonthLabel/nextMonthLabel и уточняют шаг
  // («предыдущий месяц» вместо «назад»).
  'datepicker.previousMonth': 'Previous month',
  'datepicker.nextMonth': 'Next month',
  'datepicker.placeholder': 'Select date…',
  'datepicker.rangePlaceholder': 'Select period…',
  'datepicker.timePlaceholder': 'Select time…',
  'datepicker.today': 'Today',
  'datepicker.apply': 'Apply',
  'datepicker.set': 'Set',
  'datepicker.time': 'Time',
  'datepicker.hour': 'Hour',
  'datepicker.minute': 'Minute',
  'datepicker.previousYear': 'Previous year',
  'datepicker.nextYear': 'Next year',
  'datepicker.chooseMonthYear': 'Choose month and year',
  'datepicker.chooseMonth': 'Choose month',
  'datepicker.rangeWeek': 'Week',
  'datepicker.rangeMonth': 'Month',
  'datepicker.rangeShortcuts': 'Quick periods',

  // --- Upload ---
  // Подпись зоны собирается из одной строки с меткой {browse}: слово-ссылка
  // стоит в конце у полной зоны и в начале у компактной, и порядок в других
  // языках свой. Метка заменяется узлом при отрисовке, поэтому переводчик
  // двигает её вместе с текстом, а не подбирает две половины.
  'upload.zoneTitle': 'Drag files here or {browse}',
  'upload.zoneBrowse': 'browse',
  'upload.compactTitle': '{browse} or drag here',
  'upload.compactBrowse': 'Choose file',
  'upload.inlineTitle': 'Attach files',
  'upload.label': 'Upload files',
  'upload.attached': 'Attached files',
  'upload.uploaded': 'Uploaded',
  'upload.uploading': ({ name }: { name: string }) => `Uploading ${name}`,
  'upload.cancel': ({ name }: { name: string }) => `Cancel upload of ${name}`,
  'upload.remove': ({ name }: { name: string }) => `Remove ${name}`,
  'upload.retry': ({ name }: { name: string }) => `Retry upload of ${name}`,
  'upload.tooLarge': ({ limit }: { limit: string }) =>
    `Over the ${limit} limit — choose a smaller file.`,

  // --- Kpi ---
  // Подпись кнопки-подсказки у названия показателя. Сама подсказка —
  // контент приложения, её текст приходит пропом.
  'kpi.info': 'About this metric',

  // --- Kv ---
  // Подпись кнопки копирования. Название факта попадает в подпись, когда
  // оно строка: на карточке объекта таких кнопок несколько, и одинаковое
  // «Копировать» у каждой не даёт выбрать нужную на слух.
  'kv.copy': 'Copy',
  'kv.copyValue': ({ label }: { label: string }) => `Copy ${label}`,
  'kv.copied': 'Copied',

  // --- DataTable ---
  // Shown in place of rows when the table is empty and the caller did not
  // supply renderEmptyState.
  'dataTable.empty': 'No records',

  // --- ObjectCard ---
  // Label of the default kebab button, and the fallback label of the
  // selection checkbox — used only when the card's title is not a string
  // and the caller supplied no selectLabel.
  'objectCard.menu': 'More',
  'objectCard.select': 'Select',

  // --- Sidebar ---
  // Подпись ориентира навигации и подписи кнопок рельса. Названия разделов
  // — контент приложения, они приходят пропсами.
  'sidebar.label': 'Main navigation',
  'sidebar.collapse': 'Collapse sidebar',
  'sidebar.expand': 'Expand sidebar',
  'sidebar.account': 'Account',
  'sidebar.submenu': 'Submenu',

  // --- TopBar ---
  // Подписи кнопок панели для скринридера. Названия разделов, кнопок
  // действий и текст-подсказка поиска — контент приложения, они приходят
  // пропсами.
  'topBar.back': 'Back',
  'topBar.workspace': 'Switch workspace',
  'topBar.search': 'Search',
  'topBar.account': 'Account menu',

  'appShell.rail': 'Workspaces',
  'appShell.sidebar': 'Section navigation',

  // --- Dashboard ---
  // Name of the header control row. Titles, subtitles and the labels of the
  // controls themselves are application content and arrive as props.
  'dashboard.actions': 'Dashboard actions',

  // --- CandlestickChart ---
  // Range line of the chart header: how far the price travelled over the
  // intervals on screen. Prices are formatted by the caller — the component
  // only assembles the sentence.
  // Attributive numerals do not pluralise in English — «14-session range»,
  // not «14-sessions range» — so there is nothing here for plural() to pick.
  'candlestickChart.range': ({
    count,
    low,
    high,
  }: {
    count: number;
    low: string;
    high: string;
    locale: string;
  }) => `${count}-session range ${low} – ${high}`,

  // --- HeatmapChart ---
  // Tooltip over a cell: which row and column it sits at, and the magnitude
  // there. The value is formatted by the caller — the component only
  // assembles the line.
  'heatmapChart.cell': ({ row, column, value }: { row: string; column: string; value: string; locale: string }) =>
    `${row} × ${column}: ${value}`,

  // --- CommandPalette ---
  // Name of the palette for screen readers, the search field's label and
  // placeholder, the empty state, and the four footer captions. Key glyphs
  // (⌘K, ↑↓, ↵, ESC) are symbols on the keyboard, not text, and stay
  // the same in every language.
  'commandPalette.label': 'Command palette',
  'commandPalette.search': 'Search commands',
  'commandPalette.placeholder': 'Search…',
  'commandPalette.empty': 'No results',
  'commandPalette.navigate': 'navigate',
  'commandPalette.select': 'select',
  'commandPalette.close': 'close',
  'commandPalette.results': ({ count, locale }: { count: number; locale: string }) =>
    `${count} ${plural(locale, count, { one: 'result', other: 'results' })}`,

  // --- FilterBar ---
  // The search field's name (it has no visible label), the name of the
  // saved-view switcher and of the trailing action group, the caption in
  // front of the applied filters, the name of that row, and the two
  // buttons in a facet panel's footer. Everything else the bar shows —
  // view names, facet labels, filter captions, the match count — is
  // application content and arrives as props.
  'filterBar.search': 'Search',
  'filterBar.views': 'Saved views',
  'filterBar.actions': 'Filter actions',
  // Rendered in upper case by the style, not by the dictionary.
  'filterBar.active': 'Active:',
  'filterBar.filters': 'Applied filters',
  'filterBar.clear': 'Clear',
  'filterBar.apply': 'Apply',
  'filterBar.applyCount': ({ count }: { count: number; locale: string }) => `Apply (${count})`,

  // --- Settings ---
  'settings.sections': 'Settings sections',
  'settings.unsaved': 'You have unsaved changes',

  // --- Validation ---
  'validation.required': 'This field is required',
  'validation.tooShort': ({ min, locale }: { min: number; locale: string }) =>
    `Must be at least ${min} ${plural(locale, min, { one: 'character', other: 'characters' })}`,
} as const;
