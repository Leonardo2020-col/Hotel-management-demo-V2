// src/components/common/ErrorFallback.jsx - CREAR ESTE ARCHIVO
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            ¡Oops! Algo salió mal
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            La aplicación encontró un error inesperado. 
            Por favor, intenta recargar la página.
          </p>
        </div>
        
        {isDevelopment && error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-left">
            <details className="text-xs">
              <summary className="font-medium text-red-800 cursor-pointer">
                Ver detalles del error (solo en desarrollo)
              </summary>
              <pre className="mt-2 text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                {error.message}
                {error.stack && '\n\nStack trace:\n' + error.stack}
              </pre>
            </details>
          </div>
        )}
        
        <div className="space-y-2">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Ir al Inicio</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Recargar página
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Si el problema persiste, contacta al soporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;