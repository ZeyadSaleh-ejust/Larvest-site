"use client";
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg, #fff)',
          color: 'var(--toast-color, #333)',
          borderRadius: '0.75rem',
          padding: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        success: {
          style: {
            '--toast-bg': 'rgba(240, 253, 244, 1)',
            '--toast-color': 'rgba(22, 101, 52, 1)',
            borderLeft: '4px solid rgba(22, 163, 74, 1)',
          },
          iconTheme: {
            primary: 'rgba(22, 163, 74, 1)',
            secondary: 'white',
          },
        },
        error: {
          style: {
            '--toast-bg': 'rgba(254, 242, 242, 1)',
            '--toast-color': 'rgba(153, 27, 27, 1)',
            borderLeft: '4px solid rgba(220, 38, 38, 1)',
          },
          iconTheme: {
            primary: 'rgba(220, 38, 38, 1)',
            secondary: 'white',
          },
          duration: 5000,
        },
        loading: {
          style: {
            '--toast-bg': 'rgba(239, 246, 255, 1)',
            '--toast-color': 'rgba(30, 64, 175, 1)',
            borderLeft: '4px solid rgba(59, 130, 246, 1)',
          },
          iconTheme: {
            primary: 'rgba(59, 130, 246, 1)',
            secondary: 'white',
          },
        },
      }}
    />
  );
}