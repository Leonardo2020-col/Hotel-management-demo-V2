// src/components/common/LoadingSpinner.jsx - VERSIÓN MEJORADA
import React from 'react'
import { Loader2, Loader, RotateCw } from 'lucide-react'

const LoadingSpinner = ({ 
  message = 'Cargando...', 
  size = 'md',
  variant = 'default',
  className = '',
  showMessage = true,
  fullScreen = false,
  color = 'blue'
}) => {
  // ✅ Configuraciones de tamaños más granulares
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  // ✅ Configuraciones de colores
  const colorClasses = {
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600',
    white: 'text-white'
  }

  // ✅ Variantes de spinner
  const SpinnerIcon = variant === 'dots' ? RotateCw : variant === 'loader2' ? Loader2 : Loader

  // ✅ Clases de contenedor más flexibles
  const containerClasses = fullScreen || size === 'lg' || size === 'xl'
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center p-4'

  // ✅ Tamaños de texto responsivos
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  return (
    <div className={`${containerClasses} ${className}`} role="status" aria-live="polite">
      <div className="text-center">
        {/* ✅ Spinner con animación mejorada */}
        <div className="relative">
          <SpinnerIcon 
            className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} mx-auto`} 
            strokeWidth={1.5}
          />
          
          {/* ✅ Efecto de pulso adicional para sizes grandes */}
          {(size === 'lg' || size === 'xl') && (
            <div className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[color]} opacity-25 animate-ping mx-auto`} />
          )}
        </div>
        
        {/* ✅ Mensaje condicional con mejor tipografía */}
        {showMessage && message && (
          <div className="mt-3 space-y-1">
            <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
              {message}
            </p>
            
            {/* ✅ Puntos animados para indicar progreso */}
            <div className="flex justify-center space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ✅ Componente especializado para overlays
export const LoadingOverlay = ({ 
  isLoading, 
  children, 
  message = 'Procesando...',
  className = ''
}) => {
  if (!isLoading) return children

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <LoadingSpinner 
          message={message} 
          size="md" 
          color="indigo"
          className="bg-white p-4 rounded-lg shadow-lg"
        />
      </div>
    </div>
  )
}

// ✅ Componente para botones con loading
export const LoadingButton = ({ 
  isLoading, 
  children, 
  disabled,
  loadingText = 'Procesando...',
  size = 'md',
  ...props 
}) => {
  const spinnerSize = size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs'
  
  return (
    <button 
      {...props}
      disabled={disabled || isLoading}
      className={`${props.className} ${isLoading ? 'cursor-not-allowed' : ''} inline-flex items-center justify-center`}
    >
      {isLoading && (
        <LoadingSpinner 
          size={spinnerSize}
          color="white"
          showMessage={false}
          className="mr-2 p-0"
        />
      )}
      {isLoading ? loadingText : children}
    </button>
  )
}

// ✅ Componente para skeleton loading
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  animate = true 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded ${animate ? 'animate-pulse' : ''}`}
          style={{ 
            width: `${Math.random() * 40 + 60}%`,
            animationDelay: `${index * 100}ms`
          }}
        />
      ))}
    </div>
  )
}

// ✅ Hook personalizado para estados de loading
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState)
  
  const startLoading = React.useCallback(() => setIsLoading(true), [])
  const stopLoading = React.useCallback(() => setIsLoading(false), [])
  const toggleLoading = React.useCallback(() => setIsLoading(prev => !prev), [])
  
  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoading: setIsLoading
  }
}

export default LoadingSpinner