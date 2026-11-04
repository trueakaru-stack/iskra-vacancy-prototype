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
    for (let index = 0; index < 4; index++) {
      fireEvent.change(within(modal).getByLabelText('Ваш ответ'), { target: { value: `Ответ ${index + 1}` } });
      fireEvent.click(within(modal).getByRole('button', { name: index === 3 ? 'Создать описание' : 'Далее' }));
    }
    const pendingText = within(modal).getByText('Создаём описание');
    expect(pendingText.closest('button')).toHaveAttribute('data-pending');
    expect(within(modal).getByRole('progressbar', { name: 'Загрузка' })).toBeInTheDocument();
    await act(async () => { finish({ tasks: 'Задачи', project: 'Проект', plans: 'Планы', skills: 'Навыки' }); });
    expect(await within(modal).findByLabelText('Основные обязанности')).toHaveValue('Задачи');
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
