// src/components/common/ErrorBoundary.jsx - VERSIÓN MEJORADA
import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // ✅ Generar ID único para el error
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true,
      errorId 
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error: error,
      errorInfo: errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'unknown'
    };

    this.setState(errorDetails);
    
    // ✅ Log estructurado del error
    console.group('🚨 Error Boundary - Error Capturado');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error ID:', this.state.errorId);
    console.error('Timestamp:', errorDetails.timestamp);
    console.error('URL:', errorDetails.url);
    console.groupEnd();

    // ✅ Enviar error a servicio de logging (opcional)
    this.sendErrorToLoggingService(errorDetails);
  }

  sendErrorToLoggingService = (errorDetails) => {
    // ✅ Solo en producción y si hay un servicio configurado
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ERROR_LOGGING_URL) {
      try {
        fetch(process.env.REACT_APP_ERROR_LOGGING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...errorDetails,
            errorId: this.state.errorId,
            source: 'react-error-boundary'
          })
        }).catch(err => {
          console.error('Failed to send error to logging service:', err);
        });
      } catch (err) {
        console.error('Error sending to logging service:', err);
      }
    }
  }

  handleReload = () => {
    // ✅ Limpiar estado antes de recargar
    this.setState({ hasError: false });
    window.location.reload();
  }

  handleGoHome = () => {
    // ✅ Limpiar estado y navegar
    this.setState({ hasError: false });
    window.location.href = '/dashboard';
  }

  handleReset = () => {
    // ✅ Resetear solo el error boundary
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  }

  copyErrorDetails = () => {
    const errorText = `
Error ID: ${this.state.errorId}
Timestamp: ${this.state.timestamp}
URL: ${this.state.url}
Error: ${this.state.error?.toString()}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Detalles del error copiados al portapapeles');
    }).catch(err => {
      console.error('Error copiando al portapapeles:', err);
    });
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-red-500 text-white p-6 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-3 opacity-90" />
              <h1 className="text-xl font-bold mb-1">
                ¡Oops! Algo salió mal
              </h1>
              <p className="text-red-100 text-sm">
                Error ID: {this.state.errorId}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-center mb-6">
                La aplicación encontró un error inesperado. 
                {!isDevelopment && ' Nuestro equipo ha sido notificado automáticamente.'}
              </p>
              
              {/* Error details for development */}
              {isDevelopment && this.state.error && (
                <div className="mb-6 border border-red-200 rounded-lg overflow-hidden">
                  <details className="group">
                    <summary className="bg-red-50 px-4 py-3 cursor-pointer font-medium text-red-800 hover:bg-red-100 transition-colors flex items-center">
                      <Bug className="w-4 h-4 mr-2" />
                      Ver detalles del error
                    </summary>
                    <div className="p-4 bg-red-25 border-t border-red-200">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-red-900 mb-1">Error:</h4>
                          <p className="text-sm text-red-700 bg-white p-2 rounded border">
                            {this.state.error.toString()}
                          </p>
                        </div>
                        
                        {this.state.error.stack && (
                          <div>
                            <h4 className="font-medium text-red-900 mb-1">Stack Trace:</h4>
                            <pre className="text-xs text-red-700 bg-white p-2 rounded border overflow-auto max-h-32">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}
                        
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <h4 className="font-medium text-red-900 mb-1">Component Stack:</h4>
                            <pre className="text-xs text-red-700 bg-white p-2 rounded border overflow-auto max-h-32">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}

                        <button
                          onClick={this.copyErrorDetails}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                        >
                          Copiar detalles
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              )}
              
              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Intentar de nuevo
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={this.handleReload}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 transition-all text-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recargar
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all text-sm"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Inicio
                  </button>
                </div>

                {/* Contact support (only in production) */}
                {!isDevelopment && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center mb-2">
                      Si el problema persiste, contacta soporte técnico:
                    </p>
                    <a
                      href={`mailto:soporte@tuhotel.com?subject=Error en Sistema - ${this.state.errorId}&body=Error ID: ${this.state.errorId}%0ATimestamp: ${this.state.timestamp}%0AURL: ${this.state.url}`}
                      className="w-full inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Reportar problema
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;