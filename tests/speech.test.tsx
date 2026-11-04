import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpeech } from '../src/useSpeech';

class MockRecorder {
  static last: MockRecorder;
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onerror: (() => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() { MockRecorder.last = this; }
  start = vi.fn(() => { this.state = 'recording'; });
  stop = vi.fn(() => {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    this.onstop?.();
  });
}

class MockAudioContext {
  close = vi.fn(async () => undefined);
  createMediaStreamSource() { return { connect: vi.fn() }; }
  createAnalyser() { return { fftSize: 0, getByteTimeDomainData: vi.fn() }; }
}

const trackStop = vi.fn();
const getUserMedia = vi.fn();
const fetchAudio = vi.fn();

beforeEach(() => {
  trackStop.mockClear();
  getUserMedia.mockReset().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] });
  fetchAudio.mockReset().mockResolvedValue(new Response(JSON.stringify({ text: 'Тестовый ответ' }), { status: 200 }));
  vi.stubEnv('VITE_GENERATION_URL', 'https://worker.example/generate');
  vi.stubGlobal('fetch', fetchAudio);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('MediaRecorder', MockRecorder);
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: MockAudioContext });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  Reflect.deleteProperty(window, 'AudioContext');
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

describe('голосовой ввод', () => {
  it('отправляет запись только после остановки и добавляет распознанный текст', async () => {
    const onTranscript = vi.fn();
    const hook = renderHook(() => useSpeech(onTranscript));
    await act(async () => { await hook.result.current.start(); });
    expect(hook.result.current.state).toBe('listening');
    expect(fetchAudio).not.toHaveBeenCalled();
    await act(async () => { hook.result.current.stop(); });
    expect(fetchAudio).toHaveBeenCalledOnce();
    expect(String(fetchAudio.mock.calls[0][0])).toBe('https://worker.example/transcribe');
    expect(fetchAudio.mock.calls[0][1].body).toBeInstanceOf(Blob);
    expect(hook.result.current.state).toBe('success');
    expect(onTranscript).toHaveBeenCalledWith('Тестовый ответ');
    expect(trackStop).toHaveBeenCalledOnce();
  });

  it('сохраняет запись в памяти для повторной обработки при ошибке сети', async () => {
    fetchAudio.mockRejectedValueOnce(new Error('network'));
    const onTranscript = vi.fn();
    const hook = renderHook(() => useSpeech(onTranscript));
    await act(async () => { await hook.result.current.start(); });
    await act(async () => { hook.result.current.stop(); });
    expect(hook.result.current.state).toBe('error');
    expect(hook.result.current.canRetry).toBe(true);
    expect(onTranscript).not.toHaveBeenCalled();
    const originalAudio = fetchAudio.mock.calls[0][1].body;
    await act(async () => { hook.result.current.retry(); });
    expect(fetchAudio.mock.calls[1][1].body).toBe(originalAudio);
    expect(onTranscript).toHaveBeenCalledOnce();
    expect(hook.result.current.state).toBe('success');
  });

  it('показывает обработку, пока сервис не ответил', async () => {
    let respond: (response: Response) => void = () => undefined;
    fetchAudio.mockReturnValueOnce(new Promise<Response>((resolve) => { respond = resolve; }));
    const hook = renderHook(() => useSpeech(vi.fn()));
    await act(async () => { await hook.result.current.start(); });
    await act(async () => { hook.result.current.stop(); });
    expect(hook.result.current.state).toBe('processing');
    expect(trackStop).toHaveBeenCalledOnce();
    await act(async () => { respond(new Response(JSON.stringify({ text: 'Ответ' }), { status: 200 })); });
    expect(hook.result.current.state).toBe('success');
  });

  it('не отправляет звук при неожиданной остановке, пока пользователь не подтвердит обработку', async () => {
    const hook = renderHook(() => useSpeech(vi.fn()));
    await act(async () => { await hook.result.current.start(); });
    await act(async () => { MockRecorder.last.stop(); });
    expect(fetchAudio).not.toHaveBeenCalled();
    expect(hook.result.current.canRetry).toBe(true);
    await act(async () => { hook.result.current.retry(); });
    expect(fetchAudio).toHaveBeenCalledOnce();
  });

  it('предлагает записать ответ ещё раз, если речь не распознана', async () => {
    fetchAudio.mockResolvedValue(new Response(JSON.stringify({ text: ' ' }), { status: 200 }));
    const hook = renderHook(() => useSpeech(vi.fn()));
    await act(async () => { await hook.result.current.start(); });
    await act(async () => { hook.result.current.stop(); });
    expect(hook.result.current.state).toBe('error');
    expect(hook.result.current.canRetry).toBe(false);
    expect(hook.result.current.message).toMatch(/голос не распознан/i);
  });

  it('сообщает об отказе в разрешении и не отправляет запись', async () => {
    getUserMedia.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    const hook = renderHook(() => useSpeech(vi.fn()));
    await act(async () => { await hook.result.current.start(); });
    expect(hook.result.current.state).toBe('error');
    expect(hook.result.current.message).toMatch(/нет доступа/i);
    expect(fetchAudio).not.toHaveBeenCalled();
  });
});
