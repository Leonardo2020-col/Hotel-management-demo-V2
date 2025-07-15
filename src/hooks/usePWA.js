// src/hooks/usePWA.js
import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Escuchar evento de instalación
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // Escuchar cambios de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Registrar Service Worker
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          console.log('Service Worker registrado:', registration);

          // Verificar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          });

        } catch (error) {
          console.error('Error registrando Service Worker:', error);
        }
      }
    };

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Registrar SW
    registerSW();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función para instalar la PWA
  const installPWA = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        console.log('PWA instalada exitosamente');
        return true;
      } else {
        console.log('Usuario canceló la instalación');
        return false;
      }
    } catch (error) {
      console.error('Error durante la instalación:', error);
      return false;
    } finally {
      setInstallPrompt(null);
    }
  };

  // Función para actualizar la PWA
  const updatePWA = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  // Función para obtener información de cache
  const getCacheInfo = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          totalSize += keys.length;
        }
        
        return {
          caches: cacheNames.length,
          items: totalSize,
          names: cacheNames
        };
      } catch (error) {
        console.error('Error obteniendo info de cache:', error);
        return null;
      }
    }
    return null;
  };

  // Función para limpiar cache
  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Cache limpiado exitosamente');
        return true;
      } catch (error) {
        console.error('Error limpiando cache:', error);
        return false;
      }
    }
    return false;
  };

  // Función para verificar estado de conexión con el server
  const checkServerConnection = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Información de capacidades PWA
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    notifications: 'Notification' in window,
    installPrompt: 'BeforeInstallPromptEvent' in window,
    storage: 'storage' in navigator,
    caches: 'caches' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
  };

  return {
    // Estado
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    capabilities,

    // Funciones
    installPWA,
    updatePWA,
    getCacheInfo,
    clearCache,
    checkServerConnection,

    // Información adicional
    isPWACapable: capabilities.serviceWorker && capabilities.installPrompt,
    displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
  };
};