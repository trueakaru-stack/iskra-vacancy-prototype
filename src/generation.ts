import { readFieldPatch, readRevision, type Answers, type IntakeStage, type VacancyDraft, type VacancyFields, type VacancyRevision, type VacancySections } from './vacancy';

async function ask(path: string, body: unknown): Promise<Record<string, unknown>> {
  const endpoint: string | undefined = import.meta.env.VITE_GENERATION_URL;
  if (!endpoint) throw new Error('Голосовой помощник пока недоступен. Введённый текст сохранён.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(new URL(path, endpoint), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal,
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok || !data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : 'Не удалось обработать ответ. Попробуйте ещё раз.');
    }
    return data as Record<string, unknown>;
  } catch (error) {
    if (error instanceof TypeError || controller.signal.aborted) throw new Error('Нет ответа от голосового помощника. Текст сохранён, попробуйте ещё раз.');
    throw error;
  } finally { clearTimeout(timeout); }
}

export async function structureAnswer(stage: IntakeStage, text: string): Promise<Partial<VacancyFields>> {
  const data = await ask('/structure', { stage, text, multipleRegions: true });
  const fields = readFieldPatch(data.fields, stage);
  if (!fields) throw new Error('Не удалось выделить сведения. Уточните ответ и попробуйте ещё раз.');
  return fields;
}

export async function reviseVacancy(instruction: string, draft: VacancyDraft, sections: VacancySections): Promise<VacancyRevision> {
  const { answers: _answers, ...fields } = draft;
  const data = await ask('/revise', { instruction, draft: fields, sections, multipleRegions: true });
  const revision = readRevision(data);
  if (!revision) throw new Error('Не удалось подготовить изменения. Уточните, что нужно исправить.');
  return revision;
}

export async function generateDescription(title: string, answers: Answers): Promise<VacancySections> {
  const endpoint: string | undefined = import.meta.env.VITE_GENERATION_URL;
  if (!endpoint) throw new Error('Сервис генерации пока не подключён. Ответы сохранены.');
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, answers }),
    });
  } catch {
    throw new Error('Нет связи с сервисом генерации. Проверьте подключение и повторите попытку.');
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object' || !('sections' in data)) {
    throw new Error('Не удалось подготовить описание. Ответы сохранены, попробуйте ещё раз.');
  }
  const sections: unknown = data.sections;
  if (!sections || typeof sections !== 'object') throw new Error('Получен неполный результат. Попробуйте ещё раз.');
  const record = sections as Record<string, unknown>;
  if (!['tasks', 'project', 'plans', 'skills'].every((key) => typeof record[key] === 'string')) {
    throw new Error('Получен неполный результат. Попробуйте ещё раз.');
  }
  return record as unknown as VacancySections;
}
