import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
        // Gemini model and inference configuration
        'process.env.GEMINI_MODEL': JSON.stringify(process.env.GEMINI_MODEL || env.GEMINI_MODEL),
        'process.env.GEMINI_TEMPERATURE': JSON.stringify(process.env.GEMINI_TEMPERATURE || env.GEMINI_TEMPERATURE),
        'process.env.GEMINI_TOP_P': JSON.stringify(process.env.GEMINI_TOP_P || env.GEMINI_TOP_P),
        'process.env.GEMINI_TOP_K': JSON.stringify(process.env.GEMINI_TOP_K || env.GEMINI_TOP_K),
        'process.env.GEMINI_MAX_OUTPUT_TOKENS': JSON.stringify(process.env.GEMINI_MAX_OUTPUT_TOKENS || env.GEMINI_MAX_OUTPUT_TOKENS),
        // Gemini retry configuration
        'process.env.GEMINI_MAX_RETRIES': JSON.stringify(process.env.GEMINI_MAX_RETRIES || env.GEMINI_MAX_RETRIES),
        'process.env.GEMINI_BASE_DELAY': JSON.stringify(process.env.GEMINI_BASE_DELAY || env.GEMINI_BASE_DELAY),
        'process.env.GEMINI_MAX_DELAY': JSON.stringify(process.env.GEMINI_MAX_DELAY || env.GEMINI_MAX_DELAY),
        // Gemini timeout configuration
        'process.env.GEMINI_CONNECTION_TIMEOUT': JSON.stringify(process.env.GEMINI_CONNECTION_TIMEOUT || env.GEMINI_CONNECTION_TIMEOUT),
        'process.env.GEMINI_REQUEST_TIMEOUT': JSON.stringify(process.env.GEMINI_REQUEST_TIMEOUT || env.GEMINI_REQUEST_TIMEOUT),
        'process.env.GEMINI_FIRST_TOKEN_TIMEOUT': JSON.stringify(process.env.GEMINI_FIRST_TOKEN_TIMEOUT || env.GEMINI_FIRST_TOKEN_TIMEOUT),
        'process.env.GEMINI_STREAM_HEARTBEAT_INTERVAL': JSON.stringify(process.env.GEMINI_STREAM_HEARTBEAT_INTERVAL || env.GEMINI_STREAM_HEARTBEAT_INTERVAL),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
