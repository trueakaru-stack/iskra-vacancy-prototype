import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechState = 'idle' | 'starting' | 'listening' | 'processing' | 'success' | 'error';

interface RecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface RecognitionEvent extends Event {
  results: { length: number; [index: number]: RecognitionResult };
}

interface RecognitionError extends Event { error: string }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionError) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function explainError(error: string): string {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'Нет доступа к микрофону. Разрешите доступ или введите ответ вручную.';
  if (error === 'network') return 'Не удалось связаться со службой распознавания. Попробуйте ещё раз или введите ответ вручную.';
  if (error === 'audio-capture') return 'Микрофон не найден. Подключите его или введите ответ вручную.';
  return 'Голос не распознан. Попробуйте ещё раз или введите ответ вручную.';
}

export function useSpeech(onTranscript: (text: string) => void) {
  const [state, setState] = useState<SpeechState>('idle');
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState(0);
  const recognitionRef = useRef<Recognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const liveRef = useRef(true);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

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
    return () => {
      liveRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      releaseAudio();
    };
  }, [releaseAudio]);

  const start = useCallback(async () => {
    const browser = window as SpeechWindow;
    const Recognizer = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    const AudioContextClass = browser.AudioContext ?? browser.webkitAudioContext;
    if (!Recognizer || !navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
      setState('error');
      setMessage('Голосовой ввод не поддерживается в этом браузере. Введите ответ вручную.');
      return;
    }
    setState('starting');
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!liveRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      const audio = new AudioContextClass();
      audioRef.current = audio;
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

      const recognition = new Recognizer();
      recognitionRef.current = recognition;
      recognition.lang = 'ru-RU';
      recognition.continuous = true;
      recognition.interimResults = true;
      let finalText = '';
      let recognitionError = '';
      recognition.onresult = (event) => {
        const results: string[] = [];
        for (let index = 0; index < event.results.length; index++) {
          if (event.results[index].isFinal) results.push(event.results[index][0].transcript);
        }
        finalText = results.join(' ').trim();
      };
      recognition.onerror = (event) => { recognitionError = event.error; };
      recognition.onend = () => {
        recognitionRef.current = null;
        releaseAudio();
        if (!liveRef.current) return;
        if (finalText) onTranscriptRef.current(finalText);
        if (recognitionError || !finalText) {
          setMessage(explainError(recognitionError));
          setState('error');
        } else {
          setMessage('Речь распознана. Проверьте ответ.');
          setState('success');
        }
      };
      recognition.start();
      setState('listening');
    } catch (error) {
      recognitionRef.current = null;
      releaseAudio();
      if (!liveRef.current) return;
      const name = error && typeof error === 'object' && 'name' in error && typeof error.name === 'string' ? error.name : '';
      setMessage(explainError(name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture'));
      setState('error');
    }
  }, [releaseAudio]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    setState('processing');
    setMessage('Распознаём речь…');
    recognitionRef.current.stop();
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setMessage('');
  }, []);

  return { state, message, level, start, stop, reset, busy: state === 'starting' || state === 'listening' || state === 'processing' };
}
