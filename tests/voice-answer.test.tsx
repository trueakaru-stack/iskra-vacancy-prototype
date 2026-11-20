import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider } from '@neobook/i18n';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { VoiceAnswer } from '../src/VoiceAnswer';

describe('кнопка голосового ответа', () => {
  it('после распознавания показывает микрофон и начинает запись для дополнения ответа', () => {
    const speech: ComponentProps<typeof VoiceAnswer>['speech'] = {
      state: 'success',
      message: '',
      level: 0,
      start: vi.fn(async () => undefined),
      stop: vi.fn(),
      retry: vi.fn(),
      canRetry: false,
      reset: vi.fn(),
      busy: false,
    };
    const { container } = render(<LocaleProvider locale="ru-RU"><VoiceAnswer value="Первый ответ" placeholder="Введите ответ" onChange={vi.fn()} speech={speech} progress={25} /></LocaleProvider>);

    const button = screen.getByRole('button', { name: 'Дополнить ответ голосом' });
    expect(button.querySelector('svg')).toHaveClass('lucide-mic');
    expect(container.querySelector('.lucide-check')).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(speech.start).toHaveBeenCalledOnce();
  });
});
