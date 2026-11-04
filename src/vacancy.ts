export const MAX_ANSWER_LENGTH = 4_000;

export const QUESTIONS = [
  {
    id: 'tasks',
    text: 'Какие две-три задачи ежедневно он выполняет?',
    section: 'Основные обязанности',
    placeholder: 'Например: общается с клиентами, готовит предложения и ведёт сделки в CRM.',
  },
  {
    id: 'project',
    text: 'Над каким проектом он работает эти 6 месяцев?',
    section: 'О проекте',
    placeholder: 'Например: первые шесть месяцев развивает продажи нового сервиса для малого бизнеса.',
  },
  {
    id: 'plans',
    text: 'В ближайшие полгода он продолжит работать над этим проектом или возьмётся за другой? Какой именно?',
    section: 'Планы на полгода',
    placeholder: 'Например: продолжит развивать этот сервис и займётся выходом в новые регионы.',
  },
  {
    id: 'skills',
    text: 'Какими особыми инструментами, программами и знаниями он должен владеть, чтобы эффективно выполнять свою работу?',
    section: 'Требования и ключевые навыки',
    placeholder: 'Например: умеет вести переговоры, работает в CRM и анализирует данные в Excel.',
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
  employment: string[];
  workFormat: string[];
  schedule: string[];
  contract: string[];
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
    employment: [],
    workFormat: [],
    schedule: [],
    contract: [],
    answers: { tasks: '', project: '', plans: '', skills: '' },
  };
}

export type VacancyFields = Omit<VacancyDraft, 'answers'>;
export type IntakeStage = 'main' | 'conditions';
export interface VacancyRevision {
  fields: Partial<VacancyFields>;
  sections: Partial<VacancySections>;
}
export const MAIN_FIELDS = ['title', 'region', 'experience'] as const;
export const CONDITION_FIELDS = ['salaryFrom', 'salaryTo', 'employment', 'workFormat', 'schedule', 'contract'] as const;
const TEXT_FIELDS = ['title', 'region', 'experience', 'salaryFrom', 'salaryTo'] as const;
const ARRAY_FIELDS = ['employment', 'workFormat', 'schedule', 'contract'] as const;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function readFieldPatch(value: unknown, stage?: IntakeStage): Partial<VacancyFields> | null {
  const data = record(value);
  if (!data) return null;
  const allowed: readonly string[] = stage === 'main' ? MAIN_FIELDS : stage === 'conditions' ? CONDITION_FIELDS : [...MAIN_FIELDS, ...CONDITION_FIELDS];
  if (Object.keys(data).some((key) => !allowed.includes(key))) return null;
  if (stage && allowed.some((key) => !(key in data))) return null;
  const fields: Partial<VacancyFields> = {};
  for (const key of TEXT_FIELDS) {
    if (!(key in data)) continue;
    const text = data[key];
    if (typeof text !== 'string' || text.length > 200) return null;
    if ((key === 'salaryFrom' || key === 'salaryTo') && text !== '' && (!/^\d{1,12}(?:\.\d{1,2})?$/.test(text) || !Number.isFinite(Number(text)))) return null;
    fields[key] = text.trim();
  }
  for (const key of ARRAY_FIELDS) {
    if (!(key in data)) continue;
    const items = data[key];
    if (!Array.isArray(items) || items.length > 20 || !items.every((item): item is string => typeof item === 'string' && !!item.trim() && item.length <= 200)) return null;
    fields[key] = [...new Set(items.map((item) => item.trim()))];
  }
  if (fields.salaryFrom && fields.salaryTo && Number(fields.salaryFrom) > Number(fields.salaryTo)) return null;
  return fields;
}

export function readRevision(value: unknown): VacancyRevision | null {
  const data = record(value);
  const fields = readFieldPatch(data?.fields);
  const rawSections = record(data?.sections);
  if (!fields || !rawSections || Object.keys(rawSections).some((key) => !QUESTIONS.some(({ id }) => key === id))) return null;
  const sections: Partial<VacancySections> = {};
  for (const { id } of QUESTIONS) {
    if (!(id in rawSections)) continue;
    const text = rawSections[id];
    if (typeof text !== 'string' || text.length > 12_000) return null;
    sections[id] = text.trim();
  }
  if (!Object.keys(fields).length && !Object.keys(sections).length) return null;
  return { fields, sections };
}

export function draftError(draft: VacancyDraft): string {
  if (!isFilled(draft.title)) return 'Назовите должность, чтобы продолжить.';
  if (draft.salaryFrom && draft.salaryTo && Number(draft.salaryFrom) > Number(draft.salaryTo)) return 'Сумма «от» не может быть больше суммы «до».';
  return '';
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
