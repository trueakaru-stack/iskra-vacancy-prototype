import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NeoBookProvider } from '@neobook/react/theme/NeoBookProvider';
import { App } from '../src/App';
import { generateDescription, reviseVacancy, structureAnswer } from '../src/generation';

vi.mock('../src/generation', () => ({
  generateDescription: vi.fn(), structureAnswer: vi.fn(), reviseVacancy: vi.fn(),
}));
const generated = { tasks: 'Исследования', project: 'Продукт', plans: 'Развитие', skills: 'Figma' };
const main = { title: 'Дизайнер', region: 'Москва', experience: 'От 3 лет' };
const conditions = { salaryFrom: '120000', salaryTo: '180000', employment: ['Полная занятость'], workFormat: ['Удалённо'], schedule: ['5/2'], contract: ['Трудовой договор'] };

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  Element.prototype.scrollIntoView = vi.fn();
});
beforeEach(() => {
  vi.mocked(generateDescription).mockReset().mockResolvedValue(generated);
  vi.mocked(structureAnswer).mockReset().mockImplementation(async (stage) => stage === 'main' ? main : conditions);
  vi.mocked(reviseVacancy).mockReset().mockResolvedValue({ fields: { salaryFrom: '150000' }, sections: { skills: 'Figma и HTML' } });
});
afterEach(cleanup);
function mount() { return render(<NeoBookProvider locale="ru-RU" defaultPreference="light" persist={false}><App /></NeoBookProvider>); }
async function openCreation() {
  fireEvent.click(screen.getByRole('button', { name: /добавить вакансию/i }));
  return screen.findByRole('dialog');
}
async function goToQuestions(withConditions = false) {
  const modal = await openCreation();
  fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: 'Дизайнер, Москва, опыт от трёх лет' } });
  fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
  await within(modal).findByRole('heading', { name: 'Условия' });
  if (withConditions) fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: 'От 120 до 180 тысяч, полная занятость, удалённо, 5/2, трудовой договор' } });
  fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
  await within(modal).findByText('Вопрос 1 из 4');
  return modal;
}
async function fillQuestions(modal: HTMLElement) {
  for (let index = 0; index < 4; index++) {
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: 'Ответ ' + (index + 1) } });
    fireEvent.click(within(modal).getByRole('button', { name: index === 3 ? 'Создать описание' : 'Далее' }));
  }
}
async function createSaved() {
  const modal = await goToQuestions(true);
  await fillQuestions(modal);
  await within(modal).findByLabelText('Основные обязанности');
  fireEvent.click(within(modal).getByRole('button', { name: 'Сохранить' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  return screen.getByRole('article', { name: 'Описание вакансии' });
}

describe('создание вакансии голосом', () => {
  it('показывает текущий раздел и не открывает анализ', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Вакансии' })).toBeInTheDocument();
    const menu = screen.getByRole('navigation', { name: 'Основное меню' });
    expect(within(menu).getByRole('button', { name: 'Вакансии' })).toHaveAttribute('aria-current', 'page');
    const connection = within(menu).getByRole('button', { name: 'Подключение вакансий' });
    expect(connection).toBeDisabled();
    expect(menu.querySelector('svg')).toBeNull();
    fireEvent.click(connection);
    expect(screen.queryByRole('heading', { name: 'Подключение вакансий' })).not.toBeInTheDocument();
  });

  it('сохраняет колонки и сортирует отклики', () => {
    mount();
    const table = screen.getByRole('grid', { name: 'Вакансии' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Название', 'Регион', 'Отклики', 'Истекает']);
    const header = within(table).getByRole('columnheader', { name: 'Отклики' });
    fireEvent.click(header); fireEvent.click(header);
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('369');
  });

  it('начинает с голосового ответа и не пропускает пробелы или ответ без должности', async () => {
    mount();
    const modal = await openCreation();
    expect(within(modal).getByRole('heading', { name: 'Добавление вакансии' })).toBeInTheDocument();
    expect(within(modal).getByText('Назовите должность, регион и требуемый опыт работы.')).toBeInTheDocument();
    expect(within(modal).queryByLabelText(/Название вакансии/)).not.toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: 'Начать запись' })).toBeInTheDocument();
    const answer = within(modal).getByLabelText('Ваш ответ');
    fireEvent.change(answer, { target: { value: '   ' } });
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeDisabled();
    vi.mocked(structureAnswer).mockResolvedValueOnce({ title: '', region: 'Москва', experience: '' });
    fireEvent.change(answer, { target: { value: 'Москва, опыт три года' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    expect(await within(modal).findByRole('alert')).toHaveTextContent('Назовите должность');
    expect(answer).toHaveValue('Москва, опыт три года');
    expect(within(modal).getByRole('heading', { name: 'Основное' })).toBeInTheDocument();
  });

  it('собирает сведения и условия голосовыми ответами, сохраняет их и не повторяет неизменённый запрос', async () => {
    mount();
    const modal = await goToQuestions(true);
    expect(structureAnswer).toHaveBeenCalledTimes(2);
    fireEvent.click(within(modal).getByRole('button', { name: 'Назад' }));
    expect(within(modal).getByLabelText('Ваш ответ')).toHaveValue('От 120 до 180 тысяч, полная занятость, удалённо, 5/2, трудовой договор');
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    expect(structureAnswer).toHaveBeenCalledTimes(2);
    await fillQuestions(modal);
    await within(modal).findByLabelText('Основные обязанности');
    expect(within(modal).getByLabelText('Регион')).toHaveValue('Москва');
    expect(within(modal).getByRole('button', { name: /Опыт работы/ })).toHaveTextContent('От 3 лет');
    expect(within(modal).getByLabelText('Зарплата от')).toHaveValue('120\u00a0000');
    for (const text of ['Полная занятость', 'Удалённо', '5/2', 'Трудовой договор (ТК РФ)']) expect(within(modal).getByRole('gridcell', { name: text + ' Удалить ' + text })).toBeInTheDocument();
    expect(generateDescription).toHaveBeenCalledWith('Дизайнер', { tasks: 'Ответ 1', project: 'Ответ 2', plans: 'Ответ 3', skills: 'Ответ 4' });
    expect(within(modal).queryByLabelText('Что предлагаем')).not.toBeInTheDocument();
    expect(within(modal).queryByLabelText('Будет преимуществом')).not.toBeInTheDocument();
  });

  it('при ошибке обработки сохраняет исходный ответ для повторной попытки', async () => {
    mount();
    const modal = await openCreation();
    const answer = within(modal).getByLabelText('Ваш ответ');
    fireEvent.change(answer, { target: { value: 'Дизайнер в Москве' } });
    vi.mocked(structureAnswer).mockRejectedValueOnce(new Error('Нет связи'));
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    expect(await within(modal).findByRole('alert')).toHaveTextContent('Нет связи');
    expect(answer).toHaveValue('Дизайнер в Москве');
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    expect(await within(modal).findByRole('heading', { name: 'Условия' })).toBeInTheDocument();
  });

  it('пересчитывает круг и сохраняет ответы при возврате', async () => {
    mount();
    const modal = await goToQuestions();
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeDisabled();
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: 'Исследовать' } });
    expect(within(modal).getByRole('progressbar', { name: 'Заполненность ответов' })).toHaveAttribute('aria-valuenow', '25');
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    fireEvent.click(within(modal).getByRole('button', { name: 'Назад' }));
    expect(within(modal).getByLabelText('Ваш ответ')).toHaveValue('Исследовать');
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: ' ' } });
    expect(within(modal).getByRole('progressbar', { name: 'Заполненность ответов' })).toHaveAttribute('aria-valuenow', '0');
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeDisabled();
  });

  it('переключает этапы кликом, сохраняет ответ и проверяет обязательные данные', async () => {
    mount();
    const modal = await goToQuestions();
    const steps = within(modal).getByRole('group', { name: 'Этапы создания вакансии' });
    expect(within(steps).queryByRole('button', { name: /Проверка/ })).not.toBeInTheDocument();
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: 'Мой ответ' } });
    fireEvent.click(within(steps).getByRole('button', { name: /Основное/ }));
    expect(within(modal).getByRole('heading', { name: 'Основное' })).toBeInTheDocument();
    fireEvent.click(within(steps).getByRole('button', { name: /Описание/ }));
    expect(await within(modal).findByLabelText('Ваш ответ')).toHaveValue('Мой ответ');
    expect(structureAnswer).toHaveBeenCalledOnce();
    fireEvent.click(within(steps).getByRole('button', { name: /Основное/ }));
    vi.mocked(structureAnswer).mockResolvedValueOnce({ title: '', region: 'Москва', experience: '' });
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: 'Только Москва' } });
    fireEvent.click(within(steps).getByRole('button', { name: /Описание/ }));
    expect(await within(modal).findByRole('alert')).toHaveTextContent('Назовите должность');
    expect(within(modal).getByRole('heading', { name: 'Основное' })).toBeInTheDocument();
  });

  it('возвращает к проверке через степпер без повторного запроса и потери правок', async () => {
    mount();
    const modal = await goToQuestions();
    await fillQuestions(modal);
    fireEvent.change(await within(modal).findByLabelText('Основные обязанности'), { target: { value: 'Моя редакция' } });
    const steps = within(modal).getByRole('group', { name: 'Этапы создания вакансии' });
    fireEvent.click(within(steps).getByRole('button', { name: /Основное/ }));
    fireEvent.click(within(steps).getByRole('button', { name: /Проверка/ }));
    expect(await within(modal).findByLabelText('Основные обязанности')).toHaveValue('Моя редакция');
    expect(generateDescription).toHaveBeenCalledOnce();
  });

  it('показывает индикатор внутри основной кнопки до ответа сервиса', async () => {
    let finish: (value: typeof generated) => void = () => undefined;
    vi.mocked(generateDescription).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    mount();
    const modal = await goToQuestions();
    await fillQuestions(modal);
    const button = within(modal).getByRole('button', { name: /Создаём описание/ });
    expect(button).toHaveAttribute('data-pending');
    expect(within(button).getByRole('progressbar', { name: 'Загрузка' })).toBeInTheDocument();
    expect(modal.querySelector('.modal-actions [role="status"]')).toBeNull();
    expect(within(modal).getByRole('status')).toHaveClass('visually-hidden');
    await act(async () => { finish(generated); });
    expect(await within(modal).findByLabelText('Основные обязанности')).toHaveValue('Исследования');
  });

  it('сохраняет ручной текст и пустой раздел при повторной генерации и ошибке', async () => {
    mount();
    const modal = await goToQuestions();
    await fillQuestions(modal);
    await within(modal).findByLabelText('Основные обязанности');
    fireEvent.change(within(modal).getByLabelText('Основные обязанности'), { target: { value: 'Моя редакция' } });
    fireEvent.change(within(modal).getByLabelText('Планы на полгода'), { target: { value: '' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Назад' }));
    vi.mocked(generateDescription).mockRejectedValueOnce(new Error('Ошибка сервиса'));
    fireEvent.click(within(modal).getByRole('button', { name: 'Создать описание' }));
    expect(await within(modal).findByRole('alert')).toHaveTextContent('Ошибка сервиса');
    vi.mocked(generateDescription).mockResolvedValueOnce({ ...generated, tasks: 'Новое', project: 'Другой проект', plans: 'Новые планы' });
    fireEvent.click(within(modal).getByRole('button', { name: 'Создать описание' }));
    expect(await within(modal).findByLabelText('Основные обязанности')).toHaveValue('Моя редакция');
    expect(within(modal).getByLabelText('Планы на полгода')).toHaveValue('');
    expect(within(modal).getByLabelText('О проекте')).toHaveValue('Другой проект');
  });

  it('открывает сохранённую вакансию в правой области и возвращает к списку', async () => {
    mount();
    const article = await createSaved();
    expect(screen.getByRole('heading', { name: 'Дизайнер' })).toBeInTheDocument();
    expect(article).toHaveTextContent('Исследования');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'К вакансиям' }));
    await act(async () => { fireEvent.click(screen.getByRole('row', { name: /Дизайнер/ })); });
    expect(screen.getByRole('article', { name: 'Описание вакансии' })).toHaveTextContent('Исследования');
  });

  it('позволяет исправить реквизиты на проверке и сохраняет их после возврата к вопросам', async () => {
    mount();
    const modal = await goToQuestions(true);
    await fillQuestions(modal);
    const title = await within(modal).findByLabelText(/Название вакансии/);
    fireEvent.change(title, { target: { value: 'Аналитик' } });
    fireEvent.change(within(modal).getByLabelText('Регион'), { target: { value: 'Казань' } });
    fireEvent.click(within(modal).getByRole('button', { name: /Опыт работы/ }));
    fireEvent.click(await screen.findByRole('option', { name: 'Более 6 лет' }));
    fireEvent.click(within(modal).getByRole('button', { name: 'Назад' }));
    fireEvent.click(within(modal).getByRole('button', { name: 'Создать описание' }));
    expect(await within(modal).findByLabelText(/Название вакансии/)).toHaveValue('Аналитик');
    expect(within(modal).getByRole('button', { name: /Опыт работы/ })).toHaveTextContent('Более 6 лет');
    fireEvent.click(within(modal).getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByRole('heading', { name: 'Аналитик' })).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveTextContent('Казань');
  });

  it('не сохраняет пустое название и перевёрнутый диапазон при ручном редактировании', async () => {
    mount(); await createSaved();
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }));
    const title = screen.getByLabelText(/Название вакансии/);
    fireEvent.change(title, { target: { value: '  ' } });
    expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toBeDisabled();
    fireEvent.change(title, { target: { value: 'Новая должность' } });
    const salary = screen.getByLabelText('Зарплата от');
    fireEvent.change(salary, { target: { value: '200000' } });
    fireEvent.blur(salary);
    expect(screen.getByRole('alert')).toHaveTextContent('Сумма «от»');
    expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.getByRole('heading', { name: 'Дизайнер' })).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveTextContent('от 120000 до 180000');
  });

  it('сохраняет ручные поля и текст без запроса к модели, затем применяет голосовую правку к ним', async () => {
    mount(); await createSaved();
    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }));
    fireEvent.change(screen.getByLabelText(/Название вакансии/), { target: { value: 'Редактор' } });
    fireEvent.change(screen.getByLabelText('Регион'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Основные обязанности'), { target: { value: 'Мой текст' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    expect(reviseVacancy).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Редактор' })).toBeInTheDocument();
    expect(screen.getByRole('article')).not.toHaveTextContent('Москва');
    fireEvent.click(screen.getByRole('button', { name: 'Изменить голосом' }));
    fireEvent.change(screen.getByLabelText('Ваш ответ'), { target: { value: 'Добавь HTML' } });
    fireEvent.click(screen.getByRole('button', { name: 'Показать изменения' }));
    await screen.findByRole('heading', { name: 'Проверка изменений' });
    expect(reviseVacancy).toHaveBeenCalledWith('Добавь HTML', expect.objectContaining({ title: 'Редактор', region: '' }), expect.objectContaining({ tasks: 'Мой текст' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
    fireEvent.click(screen.getByRole('button', { name: 'К вакансиям' }));
    await act(async () => { fireEvent.click(screen.getByRole('row', { name: /Редактор/ })); });
    expect(screen.getByRole('article')).toHaveTextContent('Мой текст');
  });

  it('показывает голосовые правки до сохранения и позволяет отменить их', async () => {
    mount(); await createSaved();
    fireEvent.click(screen.getByRole('button', { name: 'Изменить голосом' }));
    fireEvent.change(screen.getByLabelText('Ваш ответ'), { target: { value: 'Добавь HTML и зарплату от 150 тысяч' } });
    fireEvent.click(screen.getByRole('button', { name: 'Показать изменения' }));
    expect(await screen.findByRole('heading', { name: 'Проверка изменений' })).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveTextContent('Figma и HTML');
    expect(screen.getByRole('article')).toHaveTextContent('от 150000 до 180000');
    expect(screen.getByRole('article')).toHaveTextContent('Исследования');
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.getByRole('article')).toHaveTextContent('от 120000 до 180000');
    expect(screen.getByRole('article')).not.toHaveTextContent('Figma и HTML');
  });

  it('сохраняет подтверждённые голосовые изменения после повторного открытия', async () => {
    mount(); await createSaved();
    fireEvent.click(screen.getByRole('button', { name: 'Изменить голосом' }));
    fireEvent.change(screen.getByLabelText('Ваш ответ'), { target: { value: 'Зарплата от 150 тысяч, добавь HTML' } });
    fireEvent.click(screen.getByRole('button', { name: 'Показать изменения' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Сохранить изменения' }));
    fireEvent.click(screen.getByRole('button', { name: 'К вакансиям' }));
    await act(async () => { fireEvent.click(screen.getByRole('row', { name: /Дизайнер/ })); });
    expect(screen.getByRole('article')).toHaveTextContent('от 150000 до 180000');
    expect(screen.getByRole('article')).toHaveTextContent('Figma и HTML');
  });

  it('при неудачном голосовом изменении не изменяет сохранённую вакансию', async () => {
    mount(); await createSaved();
    fireEvent.click(screen.getByRole('button', { name: 'Изменить голосом' }));
    const answer = screen.getByLabelText('Ваш ответ');
    fireEvent.change(answer, { target: { value: 'Новая зарплата' } });
    vi.mocked(reviseVacancy).mockRejectedValueOnce(new Error('Нет связи'));
    fireEvent.click(screen.getByRole('button', { name: 'Показать изменения' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Нет связи');
    expect(answer).toHaveValue('Новая зарплата');
    expect(screen.getByRole('article')).toHaveTextContent('от 120000 до 180000');
  });

  it('оставляет ручной ввод на первом шаге при отсутствии микрофона', async () => {
    mount(); const modal = await openCreation();
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: 'Дизайнер' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Начать запись' }));
    expect(await within(modal).findByRole('alert')).toHaveTextContent('не поддерживается');
    expect(within(modal).getByLabelText('Ваш ответ')).toHaveValue('Дизайнер');
  });

  it('объясняет превышение длины без потери текста', async () => {
    mount(); const modal = await openCreation();
    const text = 'а'.repeat(4001);
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: text } });
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeDisabled();
    expect(within(modal).getByRole('alert')).toHaveTextContent('4000');
    expect(within(modal).getByLabelText('Ваш ответ')).toHaveValue(text);
  });

  it('закрывает окно по Escape и возвращает фокус', async () => {
    mount(); const button = screen.getByRole('button', { name: /добавить вакансию/i });
    button.focus(); const modal = await openCreation();
    fireEvent.keyDown(modal, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
  });
});
