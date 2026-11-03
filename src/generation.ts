import type { Answers, VacancySections } from './vacancy';

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
