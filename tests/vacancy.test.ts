import { describe, expect, it } from 'vitest';
import {
  answerProgress,
  appendTranscript,
  createEmptyDraft,
  filterVacancies,
  isFilled,
  toVacancyRow,
  type VacancyRow,
} from '../src/vacancy';

describe('прогресс вопросов', () => {
  it('считает непустые ответы и пересчитывает после редактирования', () => {
    const draft = createEmptyDraft();
    expect(answerProgress(draft.answers)).toBe(0);
    draft.answers.tasks = 'Проводит исследования';
    expect(answerProgress(draft.answers)).toBe(25);
    draft.answers.project = 'Новый продукт';
    draft.answers.plans = 'Развивать продукт';
    draft.answers.skills = 'Figma';
    expect(answerProgress(draft.answers)).toBe(100);
    draft.answers.project = ' \n\t ';
    expect(answerProgress(draft.answers)).toBe(75);
    expect(isFilled(draft.answers.project)).toBe(false);
  });

  it('добавляет распознанный текст, не уничтожая прежний ответ', () => {
    expect(appendTranscript('Уже введено', ' новый текст ')).toBe('Уже введено новый текст');
    expect(appendTranscript('Уже введено', '  ')).toBe('Уже введено');
    expect(appendTranscript('  ', 'Первый ответ')).toBe('Первый ответ');
  });
});

describe('список вакансий', () => {
  const vacancies: VacancyRow[] = [
    { id: 'a', title: 'Дизайнер интерфейсов', region: 'Москва', responses: 5, processed: 20, expires: null },
    { id: 'b', title: 'Аналитик данных', region: 'Казань', responses: null, processed: null, expires: null },
  ];

  it('совмещает поиск без учёта регистра и фильтр региона', () => {
    expect(filterVacancies(vacancies, ' ДИЗАЙНЕР ', 'москва').map((item) => item.id)).toEqual(['a']);
    expect(filterVacancies(vacancies, 'дизайнер', 'Казань')).toEqual([]);
    expect(filterVacancies(vacancies, '', '').length).toBe(2);
  });

  it('не придумывает показатели для новой вакансии', () => {
    const draft = createEmptyDraft();
    draft.title = '  Аналитик  ';
    draft.region = ' Москва ';
    expect(toVacancyRow(draft, 'new')).toEqual({
      id: 'new', title: 'Аналитик', region: 'Москва', responses: null, processed: null, expires: null,
    });
  });
});
