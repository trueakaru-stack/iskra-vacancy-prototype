import { describe, expect, it, vi } from 'vitest';
import { handleRequest } from '../worker/src/index';

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
