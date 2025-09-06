import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContextProvider.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AppStateProvider } from './contexts/AppStateContext.jsx'

// Registrar Service Worker para PWA con mejor manejo de errores
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Service Worker registrado exitosamente
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nueva versión disponible
                const shouldUpdate = confirm(
                  'Nueva versión de la aplicación disponible. ¿Desea actualizar ahora?'
                );
                if (shouldUpdate) {
                  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('Error al registrar Service Worker:', error);
      });
  });

  // Escuchar mensajes del Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      window.location.reload();
    }
  });
}

// Manejo de errores globales
window.addEventListener('error', (event) => {
  console.error('Error global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rechazada no manejada:', event.reason);
  event.preventDefault();
});

// Inicializar la aplicación
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento root en el DOM');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
