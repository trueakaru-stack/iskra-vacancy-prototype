import { Check, CircleAlert, LoaderCircle, Mic, Square } from 'lucide-react';
import { Button } from '@neobook/react/components/Button/Button';
import { ProgressRing } from '@neobook/react/components/ProgressRing/ProgressRing';
import { Textarea } from '@neobook/react/components/Textarea/Textarea';
import type { useSpeech } from './useSpeech';

interface Props {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  speech: ReturnType<typeof useSpeech>;
  progress: number;
  disabled?: boolean;
}

export function VoiceAnswer({ value, placeholder, onChange, speech, progress, disabled = false }: Props) {
  return <>
    <div className="answer-wrap">
      <Textarea className="answer-field" label="Ваш ответ" placeholder={placeholder} rows={5} value={value} onChange={onChange} isDisabled={disabled} />
      <div className="voice-control">
        {speech.state === 'listening' && <span className="voice-level" aria-hidden="true">{[0.45, 0.8, 1, 0.65, 0.35].map((weight, index) => <span key={index} style={{ transform: 'scaleY(' + Math.max(0.18, speech.level * weight) + ')' }} />)}</span>}
        <div className="voice-ring">
          <ProgressRing size="sm" value={progress} aria-label="Заполненность ответов" valueLabel={<span aria-hidden="true" />} />
          <Button variant="ghost" size="sm" isIconOnly className="voice-button"
            aria-label={speech.state === 'listening' ? 'Остановить запись' : speech.state === 'processing' ? 'Распознаём речь' : speech.state === 'starting' ? 'Подключаем микрофон' : speech.canRetry ? 'Повторить распознавание' : speech.state === 'error' ? 'Повторить запись' : 'Начать запись'}
            isDisabled={disabled || speech.state === 'starting' || speech.state === 'processing'}
            onPress={() => speech.state === 'listening' ? speech.stop() : speech.canRetry ? speech.retry() : void speech.start()}>
            {speech.state === 'listening' ? <Square size={14} fill="currentColor" /> : speech.state === 'processing' || speech.state === 'starting' ? <span className="spinner" aria-hidden="true"><LoaderCircle size={17} /></span> : speech.state === 'success' ? <Check size={18} /> : speech.state === 'error' ? <CircleAlert size={18} /> : <Mic size={18} />}
          </Button>
        </div>
      </div>
    </div>
    {speech.state === 'error' && speech.message && <p className="voice-message error" role="alert">{speech.message}</p>}
    {speech.state !== 'error' && (speech.message || speech.state === 'success') && <span className="visually-hidden" role="status">{speech.state === 'success' ? 'Речь распознана' : speech.message}</span>}
  </>;
}
