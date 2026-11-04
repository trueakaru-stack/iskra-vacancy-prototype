import { describe, expect, it } from 'vitest';
import {
  answerProgress,
  appendTranscript,
  createEmptyDraft,
  filterVacancies,
  isFilled,
  toVacancyRow,
  readFieldPatch,
  readRevision,
  draftError,
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

describe('структурирование голосовых сведений', () => {
  it('принимает только сведения нужного этапа', () => {
    expect(readFieldPatch({ title: ' Дизайнер ', region: 'Москва', experience: 'От трёх лет' }, 'main')).toEqual({ title: 'Дизайнер', region: 'Москва', experience: 'От трёх лет' });
    expect(readFieldPatch({ title: 'Дизайнер', region: '' }, 'main')).toBeNull();
    expect(readFieldPatch({ title: 'Дизайнер', region: '', experience: '', salaryFrom: '120000' }, 'main')).toBeNull();
  });

  it('отклоняет неверную зарплату и типы списков', () => {
    expect(readFieldPatch({ salaryFrom: '-1' })).toBeNull();
    expect(readFieldPatch({ salaryFrom: '120 тысяч' })).toBeNull();
    expect(readFieldPatch({ salaryFrom: '200000', salaryTo: '100000' })).toBeNull();
    expect(readFieldPatch({ employment: 'Удалённо' })).toBeNull();
    expect(readFieldPatch({ contract: [null] })).toBeNull();
    expect(readFieldPatch({ salaryFrom: '120000', salaryTo: '' })).toEqual({ salaryFrom: '120000', salaryTo: '' });
  });

  it('разрешает явное удаление раздела, но запрещает неизвестные поля и пустую поправку', () => {
    expect(readRevision({ fields: {}, sections: { plans: '' } })).toEqual({ fields: {}, sections: { plans: '' } });
    expect(readRevision({ fields: {}, sections: {} })).toBeNull();
    expect(readRevision({ fields: { unknown: 'a' }, sections: {} })).toBeNull();
    expect(readRevision({ fields: {}, sections: { unknown: 'a' } })).toBeNull();
    expect(draftError({ ...createEmptyDraft(), title: ' ' })).toMatch(/должность/);
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
