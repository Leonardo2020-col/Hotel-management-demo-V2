// src/components/common/PWAInstallBanner.jsx
import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import Button from './Button';

const PWAInstallBanner = () => {
  const {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    installPWA,
    updatePWA
  } = usePWA();
  
  const [showBanner, setShowBanner] = useState(true);
  const [installing, setInstalling] = useState(false);

  // No mostrar si no es instalable o ya está instalado
  if (!isInstallable || isInstalled || !showBanner) {
    return null;
  }

  const handleInstall = async () => {
    setInstalling(true);
    const success = await installPWA();
    setInstalling(false);
    
    if (success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Guardar en localStorage para no mostrar por 7 días
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Banner de instalación */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Instalar Hotel Paraíso
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Accede más rápido y funciona sin internet. Ideal para el personal del hotel.
            </p>
            
            <div className="flex space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstall}
                loading={installing}
                icon={Download}
                className="text-xs"
              >
                {installing ? 'Instalando...' : 'Instalar App'}
              </Button>
              
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 px-2"
              >
                Más tarde
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner de actualización */}
      {updateAvailable && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50 p-3">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Nueva versión disponible
              </p>
              <p className="text-xs text-green-600">
                Actualiza para obtener las últimas mejoras
              </p>
            </div>
            <Button
              variant="success"
              size="sm"
              onClick={updatePWA}
              className="text-xs"
            >
              Actualizar
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

// Componente para mostrar estado de conexión
export const ConnectionStatus = () => {
  const { isOnline } = usePWA();
  
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-50">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>Trabajando sin conexión</span>
      </div>
    </div>
  );
};

// Componente para información PWA (para desarrollo)
export const PWADebugInfo = () => {
  const {
    isInstalled,
    isOnline,
    capabilities,
    displayMode,
    getCacheInfo,
    clearCache
  } = usePWA();

  const [cacheInfo, setCacheInfo] = useState(null);

  const handleGetCacheInfo = async () => {
    const info = await getCacheInfo();
    setCacheInfo(info);
  };

  const handleClearCache = async () => {
    const success = await clearCache();
    if (success) {
      setCacheInfo(null);
      alert('Cache limpiado exitosamente');
    }
  };

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">PWA Debug Info</h4>
      
      <div className="space-y-1">
        <div>Instalado: {isInstalled ? '✅' : '❌'}</div>
        <div>Online: {isOnline ? '✅' : '❌'}</div>
        <div>Modo: {displayMode}</div>
        <div>Service Worker: {capabilities.serviceWorker ? '✅' : '❌'}</div>
        <div>Notificaciones: {capabilities.notifications ? '✅' : '❌'}</div>
      </div>

      <div className="mt-3 space-y-1">
        <button
          onClick={handleGetCacheInfo}
          className="block w-full text-left hover:bg-gray-700 p-1 rounded"
        >
          Ver Cache Info
        </button>
        
        <button
          onClick={handleClearCache}
          className="block w-full text-left hover:bg-gray-700 p-1 rounded text-red-300"
        >
          Limpiar Cache
        </button>
      </div>

      {cacheInfo && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div>Caches: {cacheInfo.caches}</div>
          <div>Items: {cacheInfo.items}</div>
        </div>
      )}
    </div>
  );
};

export default PWAInstallBanner;