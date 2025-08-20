// src/components/common/ErrorFallback.jsx - VERSIÓN CORREGIDA
import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // NO usar useNavigate aquí porque puede ejecutarse fuera del Router
  
  const handleGoHome = () => {
    // Usar window.location en lugar de navigate
    window.location.href = '/dashboard'
    resetErrorBoundary()
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Algo salió mal
        </h2>
        <p className="text-gray-600 mb-6">
          Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
        </p>
        
        {/* Mostrar detalles del error solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left bg-red-50 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-red-800 mb-2">
              Detalles del error (desarrollo)
            </summary>
            <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </button>
          
          <button
            onClick={handleReload}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar Página
          </button>

          <button
            onClick={handleGoHome}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorFallback