'use client';

import { ThemeProvider } from 'next-themes';
import ToastProvider from './ToastProvider';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/app/[locale]/lib/store';
export function Providers({ children }) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ToastProvider />
        {children}
      </ThemeProvider>
    </ReduxProvider>
  );
}
