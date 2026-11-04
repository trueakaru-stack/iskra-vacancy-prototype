import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NeoBookProvider } from '@neobook/react/theme/NeoBookProvider';
import { App } from '../src/App';
import { generateDescription } from '../src/generation';

vi.mock('../src/generation', () => ({
  generateDescription: vi.fn(async () => ({ tasks: 'Исследования', project: 'Продукт', plans: 'Развитие', skills: 'Figma' })),
}));

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

function mount() {
  return render(<NeoBookProvider locale="ru-RU" defaultPreference="light" persist={false}><App /></NeoBookProvider>);
}

async function goToQuestions() {
  fireEvent.click(screen.getByRole('button', { name: /добавить вакансию/i }));
  const modal = await screen.findByRole('dialog');
  fireEvent.change(within(modal).getByLabelText(/название вакансии/i), { target: { value: 'Дизайнер' } });
  fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
  fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
  return modal;
}

describe('создание вакансии', () => {
  it('показывает нужные колонки и меняет порядок вакансий при сортировке откликов', () => {
    mount();
    expect(within(screen.getByRole('navigation', { name: 'Основное меню' })).getByText('Вакансии')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Список вакансий' })).toBeInTheDocument();
    expect(screen.queryByText(/Всего:/)).not.toBeInTheDocument();
    const table = screen.getByRole('grid', { name: 'Вакансии' });
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Название', 'Регион', 'Отклики', 'Истекает',
    ]);
    const responses = within(table).getByRole('columnheader', { name: 'Отклики' });
    fireEvent.click(responses);
    expect(responses).toHaveAttribute('aria-sort', 'ascending');
    let rows = within(table).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('206');
    expect(rows[1]).toHaveTextContent('369');
    fireEvent.click(responses);
    expect(responses).toHaveAttribute('aria-sort', 'descending');
    rows = within(table).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('369');
    expect(rows[1]).toHaveTextContent('206');
  });

  it('закрывает окно по Escape и возвращает фокус к кнопке открытия', async () => {
    mount();
    const openButton = screen.getByRole('button', { name: /добавить вакансию/i });
    openButton.focus();
    fireEvent.click(openButton);
    const modal = await screen.findByRole('dialog');
    fireEvent.keyDown(modal, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(openButton).toHaveFocus());
  });

  it('показывает по одному вопросу, проверяет ответ и пересчитывает прогресс при возврате', async () => {
    mount();
    const modal = await goToQuestions();
    const steps = within(modal).getByRole('group', { name: 'Этапы создания вакансии' });
    expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent('Описание');
    expect(within(modal).getByText('Вопрос 1 из 4')).toBeInTheDocument();
    const next = within(modal).getByRole('button', { name: 'Далее' });
    expect(next).toBeDisabled();
    const answer = within(modal).getByLabelText('Ваш ответ');
    fireEvent.change(answer, { target: { value: 'Исследует продукт' } });
    expect(within(modal).getByRole('progressbar', { name: 'Заполненность ответов' })).toHaveAttribute('aria-valuenow', '25');
    fireEvent.click(next);
    expect(within(modal).getByText('Вопрос 2 из 4')).toBeInTheDocument();
    fireEvent.click(within(modal).getByRole('button', { name: 'Назад' }));
    expect(within(modal).getByLabelText('Ваш ответ')).toHaveValue('Исследует продукт');
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: ' ' } });
    expect(within(modal).getByRole('progressbar', { name: 'Заполненность ответов' })).toHaveAttribute('aria-valuenow', '0');
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeDisabled();
  });

  it('показывает обработку на кнопке до получения результата', async () => {
    let finish: (value: { tasks: string; project: string; plans: string; skills: string }) => void = () => undefined;
    vi.mocked(generateDescription).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    mount();
    const modal = await goToQuestions();
    let createButton: HTMLElement | null = null;
    for (let index = 0; index < 4; index++) {
      fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: `Ответ ${index + 1}` } });
      const button = within(modal).getByRole('button', { name: index === 3 ? 'Создать описание' : 'Далее' });
      if (index === 3) createButton = button;
      fireEvent.click(button);
    }
    if (!createButton) throw new Error('Кнопка создания описания не найдена');
    expect(createButton).toHaveAttribute('data-pending');
    expect(createButton).toHaveTextContent('Создать описание');
    expect(within(createButton).getByRole('progressbar', { name: 'Загрузка' })).toBeInTheDocument();
    expect(within(modal).getByRole('status')).toHaveTextContent('Создаём описание');
    await act(async () => { finish({ tasks: 'Задачи', project: 'Проект', plans: 'Планы', skills: 'Навыки' }); });
    expect(await within(modal).findByLabelText('Основные обязанности')).toHaveValue('Задачи');
  });

  it('принимает одну границу зарплаты и блокирует обратный диапазон', async () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: /добавить вакансию/i }));
    const modal = await screen.findByRole('dialog');
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    const from = within(modal).getByRole('textbox', { name: 'Зарплата от' });
    const to = within(modal).getByRole('textbox', { name: 'Зарплата до' });
    fireEvent.change(from, { target: { value: '120000' } });
    fireEvent.blur(from);
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeEnabled();
    fireEvent.change(to, { target: { value: '80000' } });
    fireEvent.blur(to);
    expect(within(modal).getByRole('alert')).toHaveTextContent('Сумма «от» не может быть больше суммы «до».');
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeDisabled();
    fireEvent.change(to, { target: { value: '150000' } });
    fireEvent.blur(to);
    expect(within(modal).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeEnabled();
  });

  it('сохраняет выбранный опыт и несколько форматов работы при возврате и повторном открытии', async () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: /добавить вакансию/i }));
    const modal = await screen.findByRole('dialog');
    fireEvent.change(within(modal).getByLabelText(/название вакансии/i), { target: { value: 'Дизайнер' } });
    fireEvent.click(within(modal).getByRole('button', { name: /опыт работы/i }));
    fireEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'От 3 до 6 лет' }));
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    fireEvent.click(within(modal).getByRole('button', { name: /формат работы/i }));
    const list = await screen.findByRole('listbox');
    fireEvent.click(within(list).getByRole('option', { name: 'Удалённо' }));
    fireEvent.click(within(list).getByRole('option', { name: 'Гибрид' }));
    expect(within(list).getByRole('option', { name: 'Удалённо' })).toHaveAttribute('aria-selected', 'true');
    expect(within(list).getByRole('option', { name: 'Гибрид' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));
    fireEvent.click(within(modal).getByRole('button', { name: 'Назад' }));
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    expect(within(modal).getByRole('gridcell', { name: /Удалённо/ })).toBeInTheDocument();
    expect(within(modal).getByRole('gridcell', { name: /Гибрид/ })).toBeInTheDocument();
    fireEvent.click(within(modal).getByRole('button', { name: 'Далее' }));
    for (let index = 0; index < 4; index++) {
      fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: `Ответ ${index + 1}` } });
      fireEvent.click(within(modal).getByRole('button', { name: index === 3 ? 'Создать описание' : 'Далее' }));
    }
    await within(modal).findByLabelText('Основные обязанности');
    expect(within(modal).getByText('От 3 до 6 лет')).toBeInTheDocument();
    expect(within(modal).getByText('Удалённо, Гибрид')).toBeInTheDocument();
    fireEvent.click(within(modal).getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await act(async () => { fireEvent.click(screen.getByRole('row', { name: /Дизайнер/ })); });
    const reopened = await screen.findByRole('dialog');
    expect(within(reopened).getByText('От 3 до 6 лет')).toBeInTheDocument();
    expect(within(reopened).getByText('Удалённо, Гибрид')).toBeInTheDocument();
  });

  it('сохраняет сформированный черновик и открывает его повторно', async () => {
    mount();
    const modal = await goToQuestions();
    for (let index = 0; index < 4; index++) {
      fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: `Ответ ${index + 1}` } });
      fireEvent.click(within(modal).getByRole('button', { name: index === 3 ? 'Создать описание' : 'Далее' }));
    }
    expect(await within(modal).findByLabelText('Основные обязанности')).toHaveValue('Исследования');
    fireEvent.change(within(modal).getByLabelText('Основные обязанности'), { target: { value: 'Изучать потребности' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const row = screen.getByRole('row', { name: /Дизайнер/ });
    await act(async () => { fireEvent.click(row); });
    const reopened = await screen.findByRole('dialog');
    expect(within(reopened).getByLabelText('Основные обязанности')).toHaveValue('Изучать потребности');
  });

  it('позволяет вводить ответ вручную, если браузер не поддерживает распознавание', async () => {
    mount();
    const modal = await goToQuestions();
    fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: 'Текст сохранён' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Начать запись' }));
    expect(await within(modal).findByText(/не поддерживается/i)).toBeInTheDocument();
    expect(within(modal).getByLabelText('Ваш ответ')).toHaveValue('Текст сохранён');
    expect(within(modal).getByRole('button', { name: 'Повторить запись' })).toBeInTheDocument();
  });

  it('показывает обработку записи и вставляет текст после ответа сервиса', async () => {
    class Recorder {
      state = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['test'], { type: 'audio/webm' }) });
        this.onstop?.();
      }
    }
    let respond: (response: Response) => void = () => undefined;
    const mediaDescriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    vi.stubEnv('VITE_GENERATION_URL', 'https://worker.example/generate');
    vi.stubGlobal('MediaRecorder', Recorder);
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { respond = resolve; })));
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })) } });
    try {
      mount();
      const modal = await goToQuestions();
      await act(async () => { fireEvent.click(within(modal).getByRole('button', { name: 'Начать запись' })); });
      fireEvent.click(within(modal).getByRole('button', { name: 'Остановить запись' }));
      const processing = within(modal).getByRole('button', { name: 'Распознаём речь' });
      expect(processing).toBeDisabled();
      expect(processing.querySelector('.spinner svg')).toBeInTheDocument();
      expect(within(modal).getByRole('status')).toHaveTextContent('Распознаём речь');
      await act(async () => { respond(new Response(JSON.stringify({ text: 'Голосовой ответ' }), { status: 200 })); });
      expect(within(modal).getByLabelText('Ваш ответ')).toHaveValue('Голосовой ответ');
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      if (mediaDescriptor) Object.defineProperty(navigator, 'mediaDevices', mediaDescriptor);
      else Reflect.deleteProperty(navigator, 'mediaDevices');
    }
  });

  it('объясняет превышение длины и не теряет введённый текст', async () => {
    mount();
    const modal = await goToQuestions();
    const answer = within(modal).getByLabelText('Ваш ответ');
    const text = 'а'.repeat(4001);
    fireEvent.change(answer, { target: { value: text } });
    expect(answer).toHaveValue(text);
    expect(within(modal).getByText(/сократите ответ до 4000/i)).toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeDisabled();
    fireEvent.change(answer, { target: { value: text.slice(0, 4000) } });
    expect(within(modal).getByRole('button', { name: 'Далее' })).toBeEnabled();
  });
});
