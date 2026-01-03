import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import './index.css';

// Native Service Worker Registration (Bypassing Vite Plugin Magic)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Explicitly register sw.js to ensure it loads
    // We use '/custom-sw.js' if that is what VitePWA generates, or 'sw.js'. 
    // Default is usually 'sw.js' which imports 'custom-sw.js' if configured so. 
    // We will try 'sw.js' first.
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Native SW Registered Scope:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Native SW Registration Failed:', error);
        alert(`Example Error: SW Registration Failed. ${error.message}`);
      });
  });
}

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