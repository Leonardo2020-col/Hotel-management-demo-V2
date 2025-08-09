// src/hooks/useAppUpdates.js - Hook para manejar actualizaciones de la app
import { useState, useEffect, useCallback } from 'react';

const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';
const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || Date.now();

export const useAppUpdates = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateData, setUpdateData] = useState(null);

  // Verificar actualizaciones
  const checkForUpdates = useCallback(async () => {
    try {
      // Verificar si hay nueva versión en el manifest
      const response = await fetch('/manifest.json?' + Date.now());
      const manifest = await response.json();
      
      const storedVersion = localStorage.getItem('hotel_app_version');
      const storedBuildTime = localStorage.getItem('hotel_build_time');
      
      if (storedVersion && storedVersion !== APP_VERSION) {
        setUpdateData({
          currentVersion: storedVersion,
          newVersion: APP_VERSION,
          buildTime: BUILD_TIME
        });
        setUpdateAvailable(true);
      }
      
      // También verificar mediante el service worker si existe
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Verificar si hay una actualización esperando
          if (registration.waiting) {
            setUpdateAvailable(true);
          }
          
          // Listener para nuevas actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      }
      
    } catch (error) {
      console.warn('Error checking for updates:', error);
    }
  }, []);

  // Aplicar actualización
  const applyUpdate = useCallback(() => {
    setIsUpdating(true);
    
    try {
      // Limpiar cache de la aplicación
      const keysToKeep = ['hotel_selected_branch'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key) && key.startsWith('hotel_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpiar sessionStorage
      sessionStorage.clear();
      
      // Guardar nueva versión
      localStorage.setItem('hotel_app_version', APP_VERSION);
      localStorage.setItem('hotel_build_time', BUILD_TIME.toString());
      
      // Si hay service worker, activar la nueva versión
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
      
      // Mostrar notificación y recargar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error applying update:', error);
      setIsUpdating(false);
    }
  }, []);

  // Posponer actualización
  const postponeUpdate = useCallback(() => {
    setUpdateAvailable(false);
    
    // Posponer por 1 hora
    const postponeUntil = Date.now() + (60 * 60 * 1000);
    localStorage.setItem('hotel_update_postponed', postponeUntil.toString());
  }, []);

  // Verificar si la actualización fue pospuesta
  const isUpdatePostponed = useCallback(() => {
    const postponedUntil = localStorage.getItem('hotel_update_postponed');
    if (postponedUntil && Date.now() < parseInt(postponedUntil)) {
      return true;
    }
    localStorage.removeItem('hotel_update_postponed');
    return false;
  }, []);

  // Effect principal
  useEffect(() => {
    // Verificar actualizaciones al montar
    if (!isUpdatePostponed()) {
      checkForUpdates();
    }

    // Verificar periódicamente (cada 30 minutos)
    const interval = setInterval(() => {
      if (!isUpdatePostponed()) {
        checkForUpdates();
      }
    }, 30 * 60 * 1000);

    // Verificar cuando la ventana recupera el foco
    const handleFocus = () => {
      if (!isUpdatePostponed()) {
        checkForUpdates();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdates, isUpdatePostponed]);

  return {
    updateAvailable,
    isUpdating,
    updateData,
    applyUpdate,
    postponeUpdate,
    checkForUpdates
  };
};

export default useAppUpdates;