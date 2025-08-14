import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, Home } from 'lucide-react'

const Unauthorized = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Icon */}
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Acceso Denegado
        </h2>
        
        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          No tienes permisos para acceder a esta página. Si crees que esto es un error, 
          contacta a tu administrador de sistema.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver Atrás
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir al Dashboard
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
          <p>
            <strong>Código de error:</strong> HTTP 403 - Forbidden
          </p>
          <p className="mt-1">
            Si necesitas acceso a esta sección, solicítalo a tu administrador.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized