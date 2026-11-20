import { CONDITION_FIELDS, createEmptyDraft, DEMO_VACANCIES, MAIN_FIELDS, MAX_ANSWER_LENGTH, QUESTIONS, readFieldPatch, type Answers, type IntakeStage, type VacancyDraft, type VacancyRow, type VacancySections } from './vacancy';

export interface SavedVacancy { draft: VacancyDraft; sections: VacancySections; sectionEdits: Partial<VacancySections> }
export type CreationPhase = 'main' | 'conditions' | 'questions' | 'review';
export interface CreationSession {
  open: boolean;
  draft: VacancyDraft;
  intake: Record<IntakeStage, string>;
  parsedIntake: Record<IntakeStage, string | null>;
  phase: CreationPhase;
  question: number;
  sections: VacancySections | null;
  generatedInput: { title: string; answers: Answers } | null;
  sectionEdits: Partial<VacancySections>;
}
export interface VacancyStorage { vacancies: VacancyRow[]; savedDrafts: Record<string, SavedVacancy>; creationSession: CreationSession | null }
export const VACANCY_STORAGE_KEY = 'voice-vacancies';
const CREATION_PHASES: readonly CreationPhase[] = ['main', 'conditions', 'questions', 'review'];

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readAnswers(value: unknown): Answers | null {
  const data = record(value);
  if (!data || Object.keys(data).some((key) => !QUESTIONS.some(({ id }) => id === key))) return null;
  const answers = {} as Answers;
  for (const { id } of QUESTIONS) {
    const answer = data[id];
    if (typeof answer !== 'string' || answer.length > MAX_ANSWER_LENGTH) return null;
    answers[id] = answer;
  }
  return answers;
}

function readDraft(value: unknown): VacancyDraft | null {
  const data = record(value), answers = readAnswers(record(value)?.answers);
  if (!data || !answers || ![...MAIN_FIELDS, ...CONDITION_FIELDS].every((key) => key in data)) return null;
  const fields = readFieldPatch(Object.fromEntries([...MAIN_FIELDS, ...CONDITION_FIELDS].map((key) => [key, data[key]])));
  if (!fields || ![...MAIN_FIELDS, ...CONDITION_FIELDS].every((key) => key in fields)) return null;
  return { ...createEmptyDraft(), ...fields, answers };
}

function readSections(value: unknown): VacancySections | null {
  const data = record(value);
  if (!data || Object.keys(data).some((key) => !QUESTIONS.some(({ id }) => id === key))) return null;
  const sections = {} as VacancySections;
  for (const { id } of QUESTIONS) {
    const section = data[id];
    if (typeof section !== 'string' || section.length > 12_000) return null;
    sections[id] = section;
  }
  return sections;
}

function readSectionEdits(value: unknown): Partial<VacancySections> | null {
  const data = record(value);
  if (!data || Object.keys(data).some((key) => !QUESTIONS.some(({ id }) => id === key))) return null;
  const edits: Partial<VacancySections> = {};
  for (const { id } of QUESTIONS) {
    if (!(id in data)) continue;
    const section = data[id];
    if (typeof section !== 'string' || section.length > 12_000) return null;
    edits[id] = section;
  }
  return edits;
}

function readIntake(value: unknown, allowNull: boolean): Record<IntakeStage, string | null> | null {
  const data = record(value);
  if (!data || !['main', 'conditions'].every((stage) => stage in data) || Object.keys(data).some((key) => key !== 'main' && key !== 'conditions')) return null;
  const intake = { main: data.main, conditions: data.conditions };
  if (Object.values(intake).some((answer) => !(typeof answer === 'string' || (allowNull && answer === null)) || (typeof answer === 'string' && answer.length > MAX_ANSWER_LENGTH))) return null;
  return intake as Record<IntakeStage, string | null>;
}

function readGeneratedInput(value: unknown): { title: string; answers: Answers } | null {
  const data = record(value), answers = readAnswers(record(value)?.answers);
  if (!data || !answers || typeof data.title !== 'string' || !data.title.trim() || data.title.length > 200) return null;
  return { title: data.title, answers };
}

function readSaved(value: unknown): SavedVacancy | null {
  const data = record(value), draft = readDraft(record(value)?.draft), sections = readSections(record(value)?.sections), edits = readSectionEdits(record(value)?.sectionEdits);
  if (!data || !draft?.title || !sections || !edits) return null;
  return {
    draft,
    sections,
    sectionEdits: edits,
  };
}

function readCreationSession(value: unknown): CreationSession | null {
  const data = record(value);
  const draft = readDraft(data?.draft);
  const intake = readIntake(data?.intake, false);
  const parsedIntake = readIntake(data?.parsedIntake, true);
  const sections = data?.sections === null ? null : readSections(data?.sections);
  const generatedInput = data?.generatedInput === null ? null : readGeneratedInput(data?.generatedInput);
  const sectionEdits = readSectionEdits(data?.sectionEdits);
  if (!data || typeof data.open !== 'boolean' || !draft || !intake || !parsedIntake || !sectionEdits || typeof data.phase !== 'string' || !CREATION_PHASES.includes(data.phase as CreationPhase) || typeof data.question !== 'number' || !Number.isInteger(data.question) || data.question < 0 || data.question >= QUESTIONS.length) return null;
  if (data.phase !== 'main' && !draft.title.trim()) return null;
  if (data.phase === 'review' && (!sections || !generatedInput || !QUESTIONS.every(({ id }) => draft.answers[id].trim()))) return null;
  return {
    open: data.open,
    draft,
    intake: intake as Record<IntakeStage, string>,
    parsedIntake,
    phase: data.phase as CreationPhase,
    question: data.question,
    sections,
    generatedInput,
    sectionEdits,
  };
}

export function loadVacancies(): VacancyStorage {
  const text = window.localStorage.getItem(VACANCY_STORAGE_KEY);
  if (text === null) return { vacancies: [...DEMO_VACANCIES], savedDrafts: {}, creationSession: null };
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
  return { vacancies, savedDrafts, creationSession: readCreationSession(data.creationSession) };
}

export function storeVacancies(data: VacancyStorage): void {
  window.localStorage.setItem(VACANCY_STORAGE_KEY, JSON.stringify(data));
}
