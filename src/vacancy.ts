export const MAX_ANSWER_LENGTH = 4_000;

export const QUESTIONS = [
  {
    id: 'tasks',
    text: 'Какие две-три задачи ежедневно он выполняет?',
    section: 'Основные обязанности',
  },
  {
    id: 'project',
    text: 'Над каким проектом он работает эти 6 месяцев?',
    section: 'О проекте',
  },
  {
    id: 'plans',
    text: 'В ближайшие полгода он продолжит работать над этим проектом или возьмётся за другой? Какой именно?',
    section: 'Планы на полгода',
  },
  {
    id: 'skills',
    text: 'Какими особыми инструментами, программами и знаниями он должен владеть, чтобы эффективно выполнять свою работу?',
    section: 'Требования и ключевые навыки',
  },
] as const;

export type QuestionId = (typeof QUESTIONS)[number]['id'];
export type Answers = Record<QuestionId, string>;

export interface VacancyDraft {
  title: string;
  region: string;
  experience: string;
  salaryFrom: string;
  salaryTo: string;
  employment: string;
  workFormat: string;
  schedule: string;
  contract: string;
  benefits: string;
  advantages: string;
  answers: Answers;
}

export interface VacancySections {
  tasks: string;
  project: string;
  plans: string;
  skills: string;
}

export interface VacancyRow {
  id: string;
  title: string;
  region: string;
  responses: number | null;
  processed: number | null;
  expires: string | null;
}

export const DEMO_VACANCIES: readonly VacancyRow[] = [
  {
    id: 'sample-sales-manager',
    title: 'Менеджер по продажам HR-продукта (B2B, IT компания)',
    region: 'Москва',
    responses: 206,
    processed: 1,
    expires: '2026-02-22',
  },
  {
    id: 'sample-marketing-director',
    title: 'Руководитель департамента маркетинга (международный бизнес)',
    region: 'Москва',
    responses: 369,
    processed: 100,
    expires: '2026-01-17',
  },
];

export function createEmptyDraft(): VacancyDraft {
  return {
    title: '',
    region: '',
    experience: '',
    salaryFrom: '',
    salaryTo: '',
    employment: '',
    workFormat: '',
    schedule: '',
    contract: '',
    benefits: '',
    advantages: '',
    answers: { tasks: '', project: '', plans: '', skills: '' },
  };
}

export function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

export function answerProgress(answers: Answers): number {
  return QUESTIONS.filter(({ id }) => isFilled(answers[id])).length * 25;
}

export function appendTranscript(current: string, transcript: string): string {
  const recognized = transcript.trim();
  if (!recognized) return current;
  if (!current.trim()) return recognized;
  return `${current.trimEnd()} ${recognized}`;
}

export function filterVacancies(
  vacancies: readonly VacancyRow[],
  query: string,
  region: string,
): VacancyRow[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
  const normalizedRegion = region.trim().toLocaleLowerCase('ru-RU');
  return vacancies.filter((vacancy) => {
    const matchesTitle = vacancy.title.toLocaleLowerCase('ru-RU').includes(normalizedQuery);
    const matchesRegion =
      !normalizedRegion || vacancy.region.toLocaleLowerCase('ru-RU') === normalizedRegion;
    return matchesTitle && matchesRegion;
  });
}

export function toVacancyRow(draft: VacancyDraft, id: string): VacancyRow {
  return {
    id,
    title: draft.title.trim(),
    region: draft.region.trim(),
    responses: null,
    processed: null,
    expires: null,
  };
}
