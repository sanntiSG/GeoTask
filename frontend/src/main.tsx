import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Register SW via vite-plugin-pwa: uses /dev-sw.js?dev-sw in dev, /sw.js in prod.
// Must be imported before any push-subscription code to ensure serviceWorker.ready resolves.
import { registerSW } from 'virtual:pwa-register';
import App from './App.js';
import './styles/globals.css';

// Registers the service worker immediately in both dev and production.
registerSW({ immediate: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
