import React from 'react';
import { createRoot } from 'react-dom/client';
import { NeoBookProvider } from '@neobook/react/theme/NeoBookProvider';
import '@neobook/tokens/tokens.css';
import '@fontsource/manrope/cyrillic-700.css';
import '@fontsource/manrope/latin-700.css';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NeoBookProvider locale="ru-RU" defaultPreference="light" persist={false}>
      <App />
    </NeoBookProvider>
  </React.StrictMode>,
);
