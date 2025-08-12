// src/components/common/LoadingSpinner.jsx - CREAR ESTE ARCHIVO
import React from 'react';
import { Hotel } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'default', 
  message = 'Cargando...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerClasses = fullScreen 
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Logo animado */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <Hotel className="w-8 h-8 text-blue-600" />
          </div>
          <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
        </div>
        
        {/* Mensaje */}
        <p className="text-gray-600 text-sm font-medium">{message}</p>
        
        {fullScreen && (
          <p className="text-xs text-gray-500 mt-2">Hotel Paraíso</p>
        )}
      </div>
    </div>
  );
};

// Variantes específicas para diferentes contextos
export const PageLoadingSpinner = ({ message = 'Cargando página...' }) => (
  <LoadingSpinner size="lg" message={message} fullScreen />
);

export const ComponentLoadingSpinner = ({ message = 'Cargando datos...' }) => (
  <LoadingSpinner size="default" message={message} />
);

export const ButtonLoadingSpinner = () => (
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
);

export const InlineLoadingSpinner = ({ message = 'Cargando...' }) => (
  <div className="flex items-center space-x-2">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    <span className="text-sm text-gray-600">{message}</span>
  </div>
);

export default LoadingSpinner;