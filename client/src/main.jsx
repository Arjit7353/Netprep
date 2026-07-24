import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Global error handler for DOM Selection / Range errors
window.addEventListener('error', (event) => {
  if (event?.message?.includes('InvalidNodeTypeError') || event?.message?.includes('selectNode')) {
    event.preventDefault();
    console.warn('[Global Error Handler] Prevented InvalidNodeTypeError:', event.message);
  }
});

// Service Worker (sirf ek jagah - yahan)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.log('SW failed:', err));
  });
}