// src/components/common/UpdateNotification.jsx
import React from 'react';
import { Download, X, Clock, RefreshCw } from 'lucide-react';
import useAppUpdates from '../../hooks/useAppUpdates';

const UpdateNotification = () => {
  const { 
    updateAvailable, 
    isUpdating, 
    updateData, 
    applyUpdate, 
    postponeUpdate 
  } = useAppUpdates();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Nueva versión disponible
            </h3>
            
            {updateData && (
              <p className="text-xs text-gray-600 mt-1">
                v{updateData.currentVersion} → v{updateData.newVersion}
              </p>
            )}
            
            <p className="text-sm text-gray-700 mt-2">
              Hay una nueva versión de Hotel Paraíso disponible con mejoras y correcciones.
            </p>
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={applyUpdate}
                disabled={isUpdating}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 mr-1" />
                    Actualizar ahora
                  </>
                )}
              </button>
              
              {!isUpdating && (
                <button
                  onClick={postponeUpdate}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Más tarde
                </button>
              )}
            </div>
          </div>
          
          {!isUpdating && (
            <button
              onClick={postponeUpdate}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;