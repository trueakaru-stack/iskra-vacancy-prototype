import { plural } from '../plural.js';
import type { Dictionary } from '../types.js';

/**
 * Русский словарь.
 *
 * Тип Dictionary выведен из en.ts — компилятор не даст пропустить ключ
 * или изменить сигнатуру. Обратите внимание на формы `few`/`many`:
 * в русском их четыре, и без Intl.PluralRules «5 символа» неизбежны.
 */
export const ru: Dictionary = {
  'common.close': 'Закрыть',
  'common.clear': 'Очистить',
  'common.loading': 'Загрузка',
  'common.required': 'Обязательное поле',
  'common.optional': 'необязательное',

  'button.busy': 'Выполняется действие',

  'field.clear': 'Очистить поле',
  'field.showPassword': 'Показать пароль',
  'field.hidePassword': 'Скрыть пароль',
  'field.charactersLeft': ({ count, locale }) =>
    `Осталось ${count} ${plural(locale, count, {
      one: 'символ',
      few: 'символа',
      many: 'символов',
      other: 'символа',
    })}`,

  'field.charactersOver': ({ count, locale }) =>
    `Превышение на ${count} ${plural(locale, count, {
      one: 'символ',
      few: 'символа',
      many: 'символов',
      other: 'символа',
    })}`,

  'select.placeholder': 'Выберите…',
  'select.empty': 'Нет вариантов',
  'select.selectedCount': ({ count, locale }) =>
    `Выбрано ${count} ${plural(locale, count, {
      one: 'элемент',
      few: 'элемента',
      many: 'элементов',
      other: 'элемента',
    })}`,
  'select.selectedOfTotal': ({ count, selected, total, locale }) =>
    `${plural(locale, count, {
      one: 'Выбран',
      few: 'Выбрано',
      many: 'Выбрано',
      other: 'Выбрано',
    })} ${selected} из ${total}`,
  'select.selectedValues': 'Выбранные значения',
  'select.apply': 'Применить',

  'combobox.empty': 'Совпадений нет',
  'combobox.loading': 'Поиск…',
  'combobox.create': 'Создать',
  'combobox.selectedValues': 'Выбранные значения',
  'combobox.moreSelected': ({ count, locale }) =>
    `Ещё ${count} ${plural(locale, count, {
      one: 'выбранный элемент',
      few: 'выбранных элемента',
      many: 'выбранных элементов',
      other: 'выбранного элемента',
    })}`,

  'stepper.completed': 'Выполнен',
  'stepper.error': 'Ошибка',

  'slider.minimum': 'Минимум',
  'slider.maximum': 'Максимум',

  'pagination.label': 'Постраничная навигация',
  'pagination.previous': 'Назад',
  'pagination.next': 'Вперёд',
  'pagination.page': ({ page }) => `Страница ${page}`,
  'pagination.status': ({ page, totalPages }) =>
    totalPages != null ? `Страница ${page} из ${totalPages}` : `Страница ${page}`,
  'pagination.pageSize': 'Строк на странице',

  'banner.dismiss': 'Скрыть сообщение',

  'breadcrumbs.label': 'Навигационная цепочка',
  'breadcrumbs.showMore': 'Показать скрытые разделы',

  'datepicker.previousMonth': 'Предыдущий месяц',
  'datepicker.nextMonth': 'Следующий месяц',
  'datepicker.placeholder': 'Выберите дату…',
  'datepicker.rangePlaceholder': 'Выберите период…',
  'datepicker.timePlaceholder': 'Выберите время…',
  'datepicker.today': 'Сегодня',
  'datepicker.apply': 'Применить',
  'datepicker.set': 'Установить',
  'datepicker.time': 'Время',
  'datepicker.hour': 'Часы',
  'datepicker.minute': 'Минуты',
  'datepicker.previousYear': 'Предыдущий год',
  'datepicker.nextYear': 'Следующий год',
  'datepicker.chooseMonthYear': 'Выбрать месяц и год',
  'datepicker.chooseMonth': 'Выберите месяц',
  'datepicker.rangeWeek': 'Неделя',
  'datepicker.rangeMonth': 'Месяц',
  'datepicker.rangeShortcuts': 'Быстрый выбор периода',

  'upload.zoneTitle': 'Перетащите файлы сюда или {browse}',
  'upload.zoneBrowse': 'выберите',
  'upload.compactTitle': '{browse} или перетащите сюда',
  'upload.compactBrowse': 'Выберите файл',
  'upload.inlineTitle': 'Прикрепить файлы',
  'upload.label': 'Загрузка файлов',
  'upload.attached': 'Прикреплённые файлы',
  'upload.uploaded': 'Загружен',
  'upload.uploading': ({ name }) => `Загружается ${name}`,
  'upload.cancel': ({ name }) => `Отменить загрузку ${name}`,
  'upload.remove': ({ name }) => `Убрать ${name}`,
  'upload.retry': ({ name }) => `Повторить загрузку ${name}`,
  'upload.tooLarge': ({ limit }) => `Больше предела в ${limit} — выберите файл поменьше.`,

  'kpi.info': 'О показателе',

  'kv.copy': 'Копировать',
  'kv.copyValue': ({ label }) => `Копировать: ${label}`,
  'kv.copied': 'Скопировано',

  // --- DataTable ---
  'dataTable.empty': 'Нет записей',

  // --- ObjectCard ---
  'objectCard.menu': 'Ещё',
  'objectCard.select': 'Выбрать',

  // --- Sidebar ---
  'sidebar.label': 'Основная навигация',
  'sidebar.collapse': 'Свернуть меню',
  'sidebar.expand': 'Развернуть меню',
  'sidebar.account': 'Учётная запись',
  'sidebar.submenu': 'Подменю',

  // --- TopBar ---
  // Подписи кнопок панели для скринридера. Названия разделов, кнопок
  // действий и текст-подсказка поиска — контент приложения, они приходят
  // пропсами.
  'topBar.back': 'Назад',
  'topBar.workspace': 'Сменить рабочую область',
  'topBar.search': 'Поиск',
  'topBar.account': 'Меню учётной записи',

  'appShell.rail': 'Рабочие области',
  'appShell.sidebar': 'Навигация по разделу',

  // --- Dashboard ---
  // Название ряда управления в шапке. Заголовки, подстрочники и подписи
  // самих контролов — контент приложения, они приходят пропсами.
  'dashboard.actions': 'Действия дашборда',

  // --- CandlestickChart ---
  // Строка диапазона в шапке графика. Цены форматирует вызывающий,
  // компонент только собирает предложение.
  'candlestickChart.range': ({ count, low, high, locale }) =>
    `Диапазон за ${count} ${plural(locale, count, {
      one: 'сессию',
      few: 'сессии',
      many: 'сессий',
      other: 'сессии',
    })}: ${low} – ${high}`,

  // --- HeatmapChart ---
  // Подсказка над ячейкой: на пересечении какой строки и какого столбца
  // она стоит и какая там величина. Величину форматирует вызывающий.
  'heatmapChart.cell': ({ row, column, value }) => `${row} × ${column}: ${value}`,

  // --- CommandPalette ---
  // Название палитры для скринридера, подпись и текст-подсказка поля поиска,
  // пустое состояние и четыре подписи подвала. Глифы клавиш (⌘K, ↑↓, ↵, ESC)
  // во всех языках одинаковы: это знаки на клавиатуре, а не текст.
  'commandPalette.label': 'Командная палитра',
  'commandPalette.search': 'Поиск команд',
  'commandPalette.placeholder': 'Поиск…',
  'commandPalette.empty': 'Ничего не найдено',
  'commandPalette.navigate': 'переход',
  'commandPalette.select': 'запуск',
  'commandPalette.close': 'закрыть',
  'commandPalette.results': ({ count, locale }) =>
    `${count} ${plural(locale, count, {
      one: 'результат',
      few: 'результата',
      many: 'результатов',
      other: 'результата',
    })}`,

  // --- FilterBar ---
  'filterBar.search': 'Поиск',
  'filterBar.views': 'Сохранённые виды',
  'filterBar.actions': 'Действия над отбором',
  'filterBar.active': 'Активные:',
  'filterBar.filters': 'Применённые фильтры',
  'filterBar.clear': 'Сбросить',
  'filterBar.apply': 'Применить',
  'filterBar.applyCount': ({ count }) => `Применить (${count})`,

  // --- Настройки ---
  'settings.sections': 'Разделы настроек',
  'settings.unsaved': 'Есть несохранённые изменения',

  'validation.required': 'Заполните это поле',
  'validation.tooShort': ({ min, locale }) =>
    `Минимум ${min} ${plural(locale, min, {
      one: 'символ',
      few: 'символа',
      many: 'символов',
      other: 'символа',
    })}`,
};
