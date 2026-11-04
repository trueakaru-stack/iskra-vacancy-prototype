import { CONDITION_FIELDS, createEmptyDraft, DEMO_VACANCIES, MAIN_FIELDS, MAX_ANSWER_LENGTH, QUESTIONS, readFieldPatch, type VacancyDraft, type VacancyRow, type VacancySections } from './vacancy';

export interface SavedVacancy { draft: VacancyDraft; sections: VacancySections; sectionEdits: Partial<VacancySections> }
export interface VacancyStorage { vacancies: VacancyRow[]; savedDrafts: Record<string, SavedVacancy> }
export const VACANCY_STORAGE_KEY = 'voice-vacancies';

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readSaved(value: unknown): SavedVacancy | null {
  const data = record(value), draft = record(data?.draft), answers = record(draft?.answers);
  const sections = record(data?.sections), edits = record(data?.sectionEdits);
  if (!draft || !answers || !sections || !edits) return null;
  const fields = readFieldPatch(Object.fromEntries([...MAIN_FIELDS, ...CONDITION_FIELDS].filter((key) => key in draft).map((key) => [key, draft[key]])));
  if (!fields?.title || !QUESTIONS.every(({ id }) => typeof answers[id] === 'string' && (answers[id] as string).length <= MAX_ANSWER_LENGTH && typeof sections[id] === 'string' && (sections[id] as string).length <= 12_000 && (!(id in edits) || (typeof edits[id] === 'string' && (edits[id] as string).length <= 12_000)))) return null;
  return {
    draft: { ...createEmptyDraft(), ...fields, answers: { tasks: String(answers.tasks), project: String(answers.project), plans: String(answers.plans), skills: String(answers.skills) } },
    sections: { tasks: String(sections.tasks), project: String(sections.project), plans: String(sections.plans), skills: String(sections.skills) },
    sectionEdits: Object.fromEntries(QUESTIONS.filter(({ id }) => id in edits).map(({ id }) => [id, String(edits[id])])),
  };
}

export function loadVacancies(): VacancyStorage {
  const text = window.localStorage.getItem(VACANCY_STORAGE_KEY);
  if (text === null) return { vacancies: [...DEMO_VACANCIES], savedDrafts: {} };
  const data = record(JSON.parse(text)), saved = record(data?.savedDrafts);
  if (!data || !Array.isArray(data.vacancies) || !saved) throw new Error('Invalid vacancy storage');
  const vacancies: VacancyRow[] = [];
  for (const value of data.vacancies) {
    const row = record(value), fields = readFieldPatch(row && { title: row.title, region: row.region });
    if (!row || typeof row.id !== 'string' || !row.id || row.id.length > 200 || !fields?.title || !fields.region || !(row.responses === null || (typeof row.responses === 'number' && Number.isFinite(row.responses) && row.responses >= 0)) || !(row.processed === null || (typeof row.processed === 'number' && Number.isFinite(row.processed))) || !(row.expires === null || (typeof row.expires === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(row.expires)))) throw new Error('Invalid vacancy row');
    vacancies.push({ id: row.id, title: fields.title, region: fields.region, responses: row.responses, processed: row.processed, expires: row.expires });
  }
  const savedDrafts = Object.fromEntries(Object.entries(saved).map(([id, value]) => {
    const entry = readSaved(value);
    if (!entry || !vacancies.some((row) => row.id === id)) throw new Error('Invalid saved vacancy');
    return [id, entry];
  }));
  if (new Set(vacancies.map((row) => row.id)).size !== vacancies.length) throw new Error('Duplicate vacancy');
  return { vacancies, savedDrafts };
}

export function storeVacancies(data: VacancyStorage): void {
  window.localStorage.setItem(VACANCY_STORAGE_KEY, JSON.stringify(data));
}
