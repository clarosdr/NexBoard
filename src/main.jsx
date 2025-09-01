import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    console.log('SW registered: ', reg);
    
    reg.onupdatefound = () => {
      const nw = reg.installing;
      if (!nw) return;
      
      nw.onstatechange = () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          // aquí muestra un toast/botón "Actualizar ahora"
          // y al clicar envía: reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
          if (confirm('Nueva versión disponible. ¿Desea actualizar ahora?')) {
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      };
    };
  }).catch((error) => {
    console.log('SW registration failed: ', error);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
