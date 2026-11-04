import { describe, expect, it, vi } from 'vitest';
import { handleRequest } from '../worker/src/index';
import { createEmptyDraft } from '../src/vacancy';

const answers = { tasks: 'Исследовать', project: 'Сервис', plans: 'Развивать сервис', skills: 'Figma' };
const sections = { tasks: 'Проводить исследования', project: 'Сервис', plans: 'Развитие сервиса', skills: 'Figma' };

function request(body: unknown, origin = 'https://example.com') {
  return new Request('https://worker.example/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

describe('генерация описания', () => {
  it('передаёт ответы модели и принимает только четыре проверенных блока', async () => {
    const run = vi.fn().mockResolvedValue({ choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(sections)}\n\`\`\`` } }] });
    const result = await handleRequest(request({ title: 'Дизайнер', answers }), { AI: { run }, ALLOWED_ORIGIN: 'https://example.com' });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ sections });
    expect(run).toHaveBeenCalledOnce();
    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
  });

  it('отклоняет пустой ответ до вызова модели', async () => {
    const run = vi.fn();
    const result = await handleRequest(request({ title: '', answers: { ...answers, tasks: '  ' } }), { AI: { run }, ALLOWED_ORIGIN: 'https://example.com' });
    expect(result.status).toBe(400);
    expect(run).not.toHaveBeenCalled();
  });

  it('принимает максимально длинные ответы на русском', async () => {
    const long = 'а'.repeat(4000);
    const run = vi.fn().mockResolvedValue({ response: JSON.stringify(sections) });
    const result = await handleRequest(request({ title: '', answers: { tasks: long, project: long, plans: long, skills: long } }), { AI: { run }, ALLOWED_ORIGIN: 'https://example.com' });
    expect(result.status).toBe(200);
    expect(run).toHaveBeenCalledOnce();
  });

  it('сообщает об ошибке, если модель вернула неполный результат', async () => {
    const run = vi.fn().mockResolvedValue({ response: '{"tasks":"Только один блок"}' });
    const result = await handleRequest(request({ title: '', answers }), { AI: { run }, ALLOWED_ORIGIN: 'https://example.com' });
    expect(result.status).toBe(502);
  });

  it('не принимает запрос с постороннего origin', async () => {
    const run = vi.fn();
    const result = await handleRequest(request({ title: '', answers }, 'https://other.example'), { AI: { run }, ALLOWED_ORIGIN: 'https://example.com' });
    expect(result.status).toBe(403);
    expect(run).not.toHaveBeenCalled();
  });
});

describe('распознавание записи', () => {
  it('принимает звук и возвращает только распознанный текст', async () => {
    const run = vi.fn().mockResolvedValue({ text: '  Тестовый ответ  ' });
    const audio = new Request('https://worker.example/transcribe', {
      method: 'POST', headers: { 'Content-Type': 'audio/webm', Origin: 'https://example.com' }, body: 'fake audio',
    });
    const result = await handleRequest(audio, { AI: { run }, ALLOWED_ORIGIN: 'https://example.com' });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ text: 'Тестовый ответ' });
    expect(run).toHaveBeenCalledWith('@cf/openai/whisper-large-v3-turbo', expect.objectContaining({ language: 'ru', audio: btoa('fake audio') }));
    expect(result.headers.get('Cache-Control')).toBe('no-store');
  });

  it('отклоняет слишком большой звук до вызова модели', async () => {
    const run = vi.fn();
    const audio = new Request('https://worker.example/transcribe', {
      method: 'POST', headers: { 'Content-Type': 'audio/webm' }, body: new Uint8Array(2 * 1024 * 1024 + 1),
    });
    const result = await handleRequest(audio, { AI: { run } });
    expect(result.status).toBe(400);
    expect(run).not.toHaveBeenCalled();
  });

  it('отклоняет неподдерживаемый формат', async () => {
    const run = vi.fn();
    const audio = new Request('https://worker.example/transcribe', {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'fake audio',
    });
    const result = await handleRequest(audio, { AI: { run } });
    expect(result.status).toBe(415);
    expect(run).not.toHaveBeenCalled();
  });
});

function assistantRequest(path: string, data: unknown) {
  return new Request('https://worker.example/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

describe('сведения и голосовые правки', () => {
  it('выделяет основные сведения без заполнения неизвестного опыта', async () => {
    const fields = { title: 'Дизайнер', region: 'Москва', experience: '' };
    const run = vi.fn().mockResolvedValue({ response: JSON.stringify(fields) });
    const result = await handleRequest(assistantRequest('structure', { stage: 'main', text: 'Нужен дизайнер в Москве' }), { AI: { run } });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ fields });
  });

  it('выделяет все группы условий и допускает одну границу зарплаты', async () => {
    const fields = { salaryFrom: '120000', salaryTo: '', employment: ['Полная занятость'], workFormat: ['Удалённо'], schedule: ['5/2'], contract: ['Трудовой договор'] };
    const run = vi.fn().mockResolvedValue({ response: JSON.stringify(fields) });
    const result = await handleRequest(assistantRequest('structure', { stage: 'conditions', text: 'От 120 тысяч, удалённо, полная занятость, 5/2, трудовой договор' }), { AI: { run } });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ fields });
  });

  it('сохраняет явно названную нижнюю границу опыта, даже если модель её опустила', async () => {
    const run = vi.fn().mockResolvedValue({ response: '{"title":"Дизайнер","region":"Москва","experience":"3 года"}' });
    const result = await handleRequest(assistantRequest('structure', { stage: 'main', text: 'Дизайнер, Москва. Опыт от 3 лет.' }), { AI: { run } });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ fields: { title: 'Дизайнер', region: 'Москва', experience: 'от 3 лет' } });
  });

  it('не вызывает модель для пустого ответа и не принимает неверную структуру', async () => {
    const run = vi.fn().mockResolvedValue({ response: '{"title":"Дизайнер"}' });
    const empty = await handleRequest(assistantRequest('structure', { stage: 'main', text: '  ' }), { AI: { run } });
    expect(empty.status).toBe(400);
    expect(run).not.toHaveBeenCalled();
    const invalid = await handleRequest(assistantRequest('structure', { stage: 'main', text: 'Дизайнер' }), { AI: { run } });
    expect(invalid.status).toBe(502);
  });

  it('возвращает только запрошенные правки без переписывания вакансии', async () => {
    const { answers: _answers, ...draft } = { ...createEmptyDraft(), title: 'Дизайнер' };
    const patch = { fields: { salaryFrom: '150000' }, sections: { skills: 'Figma, HTML' } };
    const run = vi.fn().mockResolvedValue({ response: JSON.stringify(patch) });
    const result = await handleRequest(assistantRequest('revise', { instruction: 'От 150 тысяч и добавь HTML', draft, sections }), { AI: { run } });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual(patch);
  });

  it('не разрешает голосовой правке удалить обязательное название или перевернуть диапазон', async () => {
    const { answers: _answers, ...draft } = { ...createEmptyDraft(), title: 'Дизайнер', salaryTo: '180000' };
    const run = vi.fn().mockResolvedValueOnce({ response: '{"fields":{"title":""},"sections":{}}' }).mockResolvedValueOnce({ response: '{"fields":{"salaryFrom":"200000"},"sections":{}}' });
    const data = { instruction: 'Измени вакансию', draft, sections };
    expect((await handleRequest(assistantRequest('revise', data), { AI: { run } })).status).toBe(422);
    expect((await handleRequest(assistantRequest('revise', data), { AI: { run } })).status).toBe(422);
  });
});
