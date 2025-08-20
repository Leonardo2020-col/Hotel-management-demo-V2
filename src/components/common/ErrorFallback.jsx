// src/components/common/ErrorFallback.jsx - VERSIÓN OPTIMIZADA
import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, Home, Copy, CheckCircle, Bug } from 'lucide-react'

const ErrorFallback = ({ error, resetErrorBoundary, errorInfo }) => {
  const [copied, setCopied] = useState(false)
  
  // ✅ Función mejorada para ir al home
  const handleGoHome = () => {
    try {
      // Limpiar cualquier estado problemático
      if (window.localStorage) {
        // Mantener datos importantes pero limpiar cache problemático
        const importantKeys = ['auth-session', 'user-preferences']
        const toKeep = {}
        importantKeys.forEach(key => {
          const value = localStorage.getItem(key)
          if (value) toKeep[key] = value
        })
        
        localStorage.clear()
        
        Object.entries(toKeep).forEach(([key, value]) => {
          localStorage.setItem(key, value)
        })
      }
      
      resetErrorBoundary()
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Error navigating home:', err)
      window.location.reload()
    }
  }

  // ✅ Función mejorada para recargar
  const handleReload = () => {
    try {
      resetErrorBoundary()
      window.location.reload()
    } catch (err) {
      console.error('Error reloading:', err)
      window.location.href = window.location.href
    }
  }

  // ✅ Función para copiar detalles del error
  const copyErrorDetails = async () => {
    const errorDetails = `
HOTEL SYSTEM - ERROR REPORT
===========================
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Message:
${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'Not available'}

Component Stack:
${errorInfo?.componentStack || 'Not available'}

Additional Info:
${JSON.stringify(errorInfo, null, 2)}
    `.trim()

    try {
      await navigator.clipboard.writeText(errorDetails)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      // Fallback: crear un elemento textarea temporal
      const textArea = document.createElement('textarea')
      textArea.value = errorDetails
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ✅ Determinar tipo de error para mostrar mensaje apropiado
  const getErrorType = () => {
    const errorMessage = error?.message?.toLowerCase() || ''
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        type: 'network',
        title: 'Error de Conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      }
    }
    
    if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
      return {
        type: 'loading',
        title: 'Error de Carga',
        description: 'Error cargando recursos de la aplicación. Intenta recargar la página.'
      }
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return {
        type: 'permission',
        title: 'Error de Permisos',
        description: 'No tienes permisos para realizar esta acción.'
      }
    }
    
    return {
      type: 'general',
      title: 'Error Inesperado',
      description: 'Ha ocurrido un error inesperado en la aplicación.'
    }
  }

  const errorType = getErrorType()
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="text-center max-w-md mx-auto">
        {/* ✅ Card principal con mejor diseño */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
            <AlertTriangle className="h-16 w-16 mx-auto mb-3 opacity-90" />
            <h2 className="text-xl font-bold mb-1">
              {errorType.title}
            </h2>
            <p className="text-red-100 text-sm">
              Sistema de Hotel
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 mb-6 leading-relaxed">
              {errorType.description}
            </p>
            
            {/* ✅ Mostrar detalles del error solo en desarrollo */}
            {isDevelopment && error && (
              <div className="mb-6 border border-orange-200 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="bg-orange-50 px-4 py-3 cursor-pointer font-medium text-orange-800 hover:bg-orange-100 transition-colors flex items-center">
                    <Bug className="w-4 h-4 mr-2" />
                    Detalles técnicos (desarrollo)
                    <span className="ml-auto text-xs opacity-75">
                      Click para expandir
                    </span>
                  </summary>
                  <div className="p-4 bg-orange-25 border-t border-orange-200">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-orange-900 mb-1 text-sm">Mensaje:</h4>
                        <p className="text-sm text-orange-700 bg-white p-3 rounded border font-mono">
                          {error.message}
                        </p>
                      </div>
                      
                      {error.stack && (
                        <div>
                          <h4 className="font-medium text-orange-900 mb-1 text-sm">Stack Trace:</h4>
                          <pre className="text-xs text-orange-700 bg-white p-3 rounded border overflow-auto max-h-32 font-mono">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      <button
                        onClick={copyErrorDetails}
                        className="inline-flex items-center text-xs bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 transition-colors"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            ¡Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar detalles
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            )}
            
            {/* ✅ Acciones con mejor UX */}
            <div className="space-y-3">
              <button
                onClick={resetErrorBoundary}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium shadow-sm"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Intentar de nuevo
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleReload}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 transition-all text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all text-sm font-medium"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </button>
              </div>
            </div>

            {/* ✅ Información adicional */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Si el problema persiste, contacta al administrador del sistema
              </p>
              {!isDevelopment && (
                <p className="text-xs text-gray-400 text-center mt-1">
                  ID de Error: {Date.now().toString(36).toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Footer con información del sistema */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Sistema de Hotel v1.0 • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ErrorFallback