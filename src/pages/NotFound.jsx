import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search, MapPin } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()

  const quickLinks = [
    {
      title: 'Dashboard',
      description: 'Panel principal del sistema',
      icon: Home,
      action: () => navigate('/dashboard')
    },
    {
      title: 'Check-in',
      description: 'Registro rápido de huéspedes',
      icon: MapPin,
      action: () => navigate('/checkin')
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-lg mx-auto px-6">
        {/* Animated Search Icon */}
        <div className="mb-8">
          <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="h-10 w-10 text-gray-400 animate-pulse" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-8xl font-bold text-gray-900 mb-4">404</h1>
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Página No Encontrada
        </h2>
        
        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          La página que buscas no existe, pudo haber sido movida o eliminada. 
          Verifica la URL o usa los enlaces de navegación.
        </p>

        {/* Primary Actions */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la Página Anterior
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir al Dashboard Principal
          </button>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Enlaces Rápidos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <button
                  key={index}
                  onClick={link.action}
                  className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
                >
                  <Icon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {link.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {link.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
          <p>
            <strong>Error 404:</strong> Recurso no encontrado
          </p>
          <p className="mt-1">
            Si el problema persiste, contacta al soporte técnico.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound