const isProd = process.env.NODE_ENV === 'production';

// In development, we use relative paths and proxy via Next.js dev server (handles both local and ngrok tunnels automatically)
export const API_URL = isProd
  ? 'https://api.larvest.ai/api'
  : (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://127.0.0.1:8000/api');

export const SERVER_URL = isProd
  ? 'https://api.larvest.ai'
  : (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000');