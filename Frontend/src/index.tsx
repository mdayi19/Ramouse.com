import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Register Service Worker manually to ensure it loads
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Update available, reloading...');
  },
  onOfflineReady() {
    console.log('App is ready for offline usage');
  },
  onRegisterError(error) {
    console.error('SW Registration Failed:', error);
    alert('System Error: Service Worker failed to register. ' + error);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);