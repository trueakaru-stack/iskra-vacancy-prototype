import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpeech } from '../src/useSpeech';

class MockRecognition {
  static last: MockRecognition;
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() { MockRecognition.last = this; }
}

class MockAudioContext {
  close = vi.fn(async () => undefined);
  createMediaStreamSource() { return { connect: vi.fn() }; }
  createAnalyser() { return { fftSize: 0, getByteTimeDomainData: vi.fn() }; }
}

const trackStop = vi.fn();
const getUserMedia = vi.fn();

beforeEach(() => {
  trackStop.mockClear();
  getUserMedia.mockReset().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: MockRecognition });
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: MockAudioContext });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
});
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'webkitSpeechRecognition');
  Reflect.deleteProperty(window, 'AudioContext');
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

describe('голосовой ввод', () => {
  it('показывает запись и обработку, затем возвращает распознанный текст', async () => {
    const onTranscript = vi.fn();
    const hook = renderHook(() => useSpeech(onTranscript));
    await act(async () => { await hook.result.current.start(); });
    expect(hook.result.current.state).toBe('listening');
    const recognition = MockRecognition.last;
    expect(recognition.lang).toBe('ru-RU');
    act(() => recognition.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'Тестовый ответ' } }] }));
    act(() => hook.result.current.stop());
    expect(hook.result.current.state).toBe('processing');
    act(() => recognition.onend?.());
    expect(hook.result.current.state).toBe('success');
    expect(onTranscript).toHaveBeenCalledWith('Тестовый ответ');
    expect(trackStop).toHaveBeenCalledOnce();
  });

  it('сохраняет распознанную часть и показывает ошибку сети', async () => {
    const onTranscript = vi.fn();
    const hook = renderHook(() => useSpeech(onTranscript));
    await act(async () => { await hook.result.current.start(); });
    const recognition = MockRecognition.last;
    act(() => recognition.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'Уже сказано' } }] }));
    act(() => recognition.onerror?.({ error: 'network' }));
    act(() => recognition.onend?.());
    expect(hook.result.current.state).toBe('error');
    expect(hook.result.current.message).toMatch(/не удалось связаться/i);
    expect(onTranscript).toHaveBeenCalledWith('Уже сказано');
  });

  it('сообщает об отказе в разрешении и не вызывает распознавание', async () => {
    getUserMedia.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    const hook = renderHook(() => useSpeech(vi.fn()));
    await act(async () => { await hook.result.current.start(); });
    expect(hook.result.current.state).toBe('error');
    expect(hook.result.current.message).toMatch(/нет доступа/i);
  });
});
