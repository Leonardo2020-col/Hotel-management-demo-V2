// src/components/supplies/AlertsPanel.jsx
import React, { useState } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Clock, 
  Package,
  TrendingDown,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'

const AlertsPanel = ({
  alerts,
  supplies,
  onResolve,
  onDismiss,
  loading = false
}) => {
  const [showResolved, setShowResolved] = useState(false)
  const [processingAlert, setProcessingAlert] = useState(null)

  // Filtrar alertas según el estado de visualización
  const filteredAlerts = alerts.filter(alert => 
    showResolved ? true : !alert.is_resolved
  )

  // Agrupar alertas por tipo
  const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
    if (!groups[alert.alert_type]) {
      groups[alert.alert_type] = []
    }
    groups[alert.alert_type].push(alert)
    return groups
  }, {})

  // Configuración de tipos de alerta
  const alertTypeConfig = {
    'low_stock': {
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      title: 'Stock Bajo',
      description: 'Artículos que necesitan restock'
    },
    'out_of_stock': {
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50 border-red-200',
      title: 'Agotado',
      description: 'Artículos sin stock disponible'
    },
    'expired': {
      icon: Clock,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      title: 'Vencido',
      description: 'Artículos que han expirado'
    }
  }

  const handleResolveAlert = async (alertId) => {
    if (!onResolve) return
    
    try {
      setProcessingAlert(alertId)
      await onResolve(alertId)
    } catch (error) {
      console.error('Error resolviendo alerta:', error)
    } finally {
      setProcessingAlert(null)
    }
  }

  const handleDismissAlert = async (alertId) => {
    if (!onDismiss) return
    
    try {
      setProcessingAlert(alertId)
      await onDismiss(alertId)
    } catch (error) {
      console.error('Error descartando alerta:', error)
    } finally {
      setProcessingAlert(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Hace unos minutos'
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
    
    return date.toLocaleDateString('es-PE')
  }

  const unresolvedCount = alerts.filter(a => !a.is_resolved).length
  const resolvedCount = alerts.filter(a => a.is_resolved).length

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando alertas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de alertas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Centro de Alertas
          </h3>
          <p className="text-sm text-gray-600">
            {unresolvedCount} alerta{unresolvedCount !== 1 ? 's' : ''} pendiente{unresolvedCount !== 1 ? 's' : ''}
            {resolvedCount > 0 && `, ${resolvedCount} resuelta${resolvedCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        
        <button
          onClick={() => setShowResolved(!showResolved)}
          className={`
            inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors
            ${showResolved 
              ? 'border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }
          `}
        >
          {showResolved ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Ocultar resueltas
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Mostrar resueltas
            </>
          )}
        </button>
      </div>

      {/* Resumen rápido */}
      {unresolvedCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(groupedAlerts).map(([type, typeAlerts]) => {
            const config = alertTypeConfig[type]
            if (!config || typeAlerts.filter(a => !a.is_resolved).length === 0) return null
            
            const Icon = config.icon
            const activeAlerts = typeAlerts.filter(a => !a.is_resolved)
            
            return (
              <div key={type} className={`p-4 rounded-lg border ${config.color}`}>
                <div className="flex items-center">
                  <Icon className="h-5 w-5 mr-2" />
                  <div>
                    <h4 className="font-medium">{config.title}</h4>
                    <p className="text-sm opacity-75">{activeAlerts.length} alerta{activeAlerts.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista de alertas */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showResolved ? 'No hay alertas' : '¡Todo en orden!'}
            </h3>
            <p className="text-sm text-gray-600">
              {showResolved 
                ? 'No se encontraron alertas para mostrar.'
                : 'No hay alertas pendientes en este momento.'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedAlerts).map(([type, typeAlerts]) => {
            const config = alertTypeConfig[type]
            if (!config) return null
            
            const Icon = config.icon
            
            return (
              <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 mr-2 ${config.color.split(' ')[0]}`} />
                    <h4 className="font-medium text-gray-900">{config.title}</h4>
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                      {typeAlerts.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {typeAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-4 ${alert.is_resolved ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {alert.supply?.name || 'Suministro eliminado'}
                            </span>
                            {alert.is_resolved && (
                              <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.message}
                          </p>
                          
                          {alert.supply && (
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                              <span>
                                Stock: {alert.supply.current_stock} / {alert.supply.minimum_stock}
                              </span>
                              <span>•</span>
                              <span>
                                {formatDate(alert.created_at)}
                              </span>
                            </div>
                          )}
                          
                          {alert.is_resolved && alert.resolved_by_user && (
                            <div className="mt-2 text-xs text-green-600">
                              Resuelto por {alert.resolved_by_user.first_name} {alert.resolved_by_user.last_name}
                              {alert.resolved_at && ` el ${formatDate(alert.resolved_at)}`}
                            </div>
                          )}
                        </div>
                        
                        {/* Acciones */}
                        {!alert.is_resolved && (onResolve || onDismiss) && (
                          <div className="flex items-center space-x-2 ml-4">
                            {onResolve && (
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                disabled={processingAlert === alert.id}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50 transition-colors"
                              >
                                {processingAlert === alert.id ? (
                                  <>
                                    <div className="animate-spin h-3 w-3 border border-green-600 border-t-transparent rounded-full mr-1"></div>
                                    Resolviendo...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolver
                                  </>
                                )}
                              </button>
                            )}
                            
                            {onDismiss && (
                              <button
                                onClick={() => handleDismissAlert(alert.id)}
                                disabled={processingAlert === alert.id}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                title="Descartar alerta"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Barra de progreso de stock */}
                      {alert.supply && alert.supply.minimum_stock > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Nivel de stock</span>
                            <span>
                              {Math.round((alert.supply.current_stock / alert.supply.minimum_stock) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                alert.supply.current_stock === 0 ? 'bg-red-500' :
                                alert.supply.current_stock <= alert.supply.minimum_stock ? 'bg-orange-500' :
                                'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((alert.supply.current_stock / (alert.supply.minimum_stock * 2)) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Información adicional */}
      {filteredAlerts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Recomendaciones
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Revisa regularmente las alertas de stock bajo para evitar desabastecimiento</li>
                  <li>Considera ajustar los niveles mínimos de stock según el consumo real</li>
                  <li>Contacta a los proveedores con anticipación para reabastecer</li>
                  {unresolvedCount > 5 && (
                    <li className="font-medium">Tienes muchas alertas pendientes. Considera revisar tu gestión de inventario.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertsPanel