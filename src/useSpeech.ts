import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechState = 'idle' | 'starting' | 'listening' | 'processing' | 'success' | 'error';
type AudioWindow = Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const STOP_BEFORE_BYTES = 1.75 * 1024 * 1024;

export function useSpeech(onTranscript: (text: string) => void) {
  const [state, setState] = useState<SpeechState>('idle');
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingAudioRef = useRef<Blob | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const liveRef = useRef(true);
  const userStoppedRef = useRef(false);
  const generationRef = useRef(0);

  const releaseAudio = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioRef.current) void audioRef.current.close();
    audioRef.current = null;
    if (liveRef.current) setLevel(0);
  }, []);

  useEffect(() => {
    liveRef.current = true;
    const generation = generationRef;
    return () => {
      liveRef.current = false;
      generation.current++;
      requestRef.current?.abort();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }
      recorderRef.current = null;
      releaseAudio();
    };
  }, [releaseAudio]);

  const transcribe = useCallback(async (audio: Blob) => {
    const generation = generationRef.current;
    const configuredUrl: string | undefined = import.meta.env.VITE_GENERATION_URL;
    if (!configuredUrl) {
      setMessage('Сервис распознавания недоступен. Введите ответ вручную.');
      setState('error');
      return;
    }
    setState('processing');
    setMessage('Распознаём речь…');
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const url = new URL('/transcribe', configuredUrl);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': audio.type || 'audio/webm' },
        body: audio,
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== 'object' || !('text' in data) || typeof data.text !== 'string') {
        throw new Error('Сервис распознавания временно недоступен.');
      }
      if (!liveRef.current || generationRef.current !== generation) return;
      if (!data.text.trim()) {
        pendingAudioRef.current = null;
        setCanRetry(false);
        setMessage('Голос не распознан. Попробуйте записать ответ ещё раз.');
        setState('error');
        return;
      }
      onTranscript(data.text.trim());
      pendingAudioRef.current = null;
      setCanRetry(false);
      setMessage('');
      setState('success');
    } catch {
      if (!liveRef.current || generationRef.current !== generation) return;
      setCanRetry(true);
      setMessage('Не удалось распознать запись. Нажмите кнопку, чтобы повторить.');
      setState('error');
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [onTranscript]);

  const start = useCallback(async () => {
    const browser = window as AudioWindow;
    const AudioContextClass = browser.AudioContext ?? browser.webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setState('error');
      setMessage('Голосовой ввод не поддерживается в этом браузере. Введите ответ вручную.');
      return;
    }
    setState('starting');
    setMessage('');
    setCanRetry(false);
    pendingAudioRef.current = null;
    userStoppedRef.current = false;
    const generation = ++generationRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!liveRef.current || generationRef.current !== generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      if (AudioContextClass) {
        try {
          const audio = new AudioContextClass();
          audioRef.current = audio;
          if (audio.state === 'suspended') void audio.resume().catch(() => undefined);
          const source = audio.createMediaStreamSource(stream);
          const analyser = audio.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const samples = new Uint8Array(analyser.fftSize);
          let lastPaint = 0;
          const measure = (time: number) => {
            if (time - lastPaint > 80) {
              analyser.getByteTimeDomainData(samples);
              let energy = 0;
              for (const sample of samples) energy += ((sample - 128) / 128) ** 2;
              setLevel(Math.min(1, Math.sqrt(energy / samples.length) * 5));
              lastPaint = time;
            }
            frameRef.current = requestAnimationFrame(measure);
          };
          frameRef.current = requestAnimationFrame(measure);
        } catch {
          if (audioRef.current) void audioRef.current.close();
          audioRef.current = null;
        }
      }

      const recorder = new MediaRecorder(stream, { audioBitsPerSecond: 64_000 });
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      let size = 0;
      let recordingFailed = false;
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        chunks.push(event.data);
        size += event.data.size;
        if (size >= STOP_BEFORE_BYTES && recorder.state === 'recording') recorder.stop();
      };
      recorder.onerror = () => { recordingFailed = true; };
      recorder.onstop = () => {
        recorderRef.current = null;
        releaseAudio();
        if (!liveRef.current || generationRef.current !== generation) return;
        const audio = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' });
        if (recordingFailed || !audio.size || audio.size > MAX_AUDIO_BYTES) {
          setMessage(audio.size > MAX_AUDIO_BYTES ? 'Запись слишком длинная. Запишите ответ ещё раз.' : 'Не удалось записать звук. Попробуйте ещё раз.');
          setState('error');
          return;
        }
        pendingAudioRef.current = audio;
        setCanRetry(true);
        if (!userStoppedRef.current) {
          setMessage('Запись остановлена. Нажмите кнопку, чтобы распознать её.');
          setState('error');
          return;
        }
        void transcribe(audio);
      };
      recorder.start(1000);
      setState('listening');
    } catch (error) {
      recorderRef.current = null;
      releaseAudio();
      if (!liveRef.current || generationRef.current !== generation) return;
      const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
      setMessage(name === 'NotAllowedError'
        ? 'Нет доступа к микрофону. Разрешите доступ или введите ответ вручную.'
        : 'Не удалось начать запись. Проверьте микрофон или введите ответ вручную.');
      setState('error');
    }
  }, [releaseAudio, transcribe]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    userStoppedRef.current = true;
    setState('processing');
    setMessage('Распознаём речь…');
    recorder.stop();
  }, []);

  const retry = useCallback(() => {
    if (pendingAudioRef.current) void transcribe(pendingAudioRef.current);
  }, [transcribe]);

  const reset = useCallback(() => {
    generationRef.current++;
    requestRef.current?.abort();
    pendingAudioRef.current = null;
    setCanRetry(false);
    setState('idle');
    setMessage('');
  }, []);

  return { state, message, level, start, stop, retry, canRetry, reset, busy: state === 'starting' || state === 'listening' || state === 'processing' };
}
