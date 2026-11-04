import React from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from '@neobook/i18n';
import '@neobook/tokens/tokens.css';
import '@fontsource/manrope/cyrillic-700.css';
import '@fontsource/manrope/latin-700.css';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider locale="ru-RU">
      <App />
    </LocaleProvider>
  </React.StrictMode>,
);
