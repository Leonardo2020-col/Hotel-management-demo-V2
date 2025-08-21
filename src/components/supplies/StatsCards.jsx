// src/components/supplies/StatsCards.jsx
import React from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign,
  Archive,
  Building2
} from 'lucide-react'

const StatsCards = ({ stats, lowStockCount, outOfStockCount }) => {
  const cards = [
    {
      title: 'Total de Artículos',
      value: stats.total || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Artículos en inventario',
      trend: null
    },
    {
      title: 'Stock Bajo',
      value: lowStockCount || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Requieren restock',
      trend: lowStockCount > 0 ? 'warning' : 'good'
    },
    {
      title: 'Agotados',
      value: outOfStockCount || 0,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Sin stock disponible',
      trend: outOfStockCount > 0 ? 'critical' : 'good'
    },
    {
      title: 'Valor Total',
      value: `S/ ${(stats.totalValue || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Valor del inventario',
      trend: null
    },
    {
      title: 'Categorías',
      value: stats.categories || 0,
      icon: Archive,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Diferentes categorías',
      trend: null
    },
    {
      title: 'Proveedores',
      value: stats.suppliers || 0,
      icon: Building2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Proveedores activos',
      trend: null
    }
  ]

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'critical':
        return 'text-red-600'
      case 'warning':
        return 'text-orange-600'
      case 'good':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIndicator = (trend, value) => {
    if (trend === 'critical' && value > 0) {
      return (
        <div className="flex items-center text-xs text-red-600 mt-1">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Atención requerida
        </div>
      )
    }
    if (trend === 'warning' && value > 0) {
      return (
        <div className="flex items-center text-xs text-orange-600 mt-1">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Revisar stock
        </div>
      )
    }
    if (trend === 'good' && value === 0) {
      return (
        <div className="flex items-center text-xs text-green-600 mt-1">
          ✓ Todo bien
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-2 ${card.bgColor} rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className={`text-2xl font-semibold ${getTrendColor(card.trend)}`}>
                        {card.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  {card.description}
                </div>
                {getTrendIndicator(card.trend, typeof card.value === 'number' ? card.value : 0)}
              </div>
            </div>

            {/* Barra de progreso para ciertos indicadores */}
            {(card.title === 'Stock Bajo' || card.title === 'Agotados') && stats.total > 0 && (
              <div className="bg-gray-50 px-5 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {card.title === 'Stock Bajo' ? 'Porcentaje con stock bajo' : 'Porcentaje agotado'}
                  </span>
                  <span className={getTrendColor(card.trend)}>
                    {((typeof card.value === 'number' ? card.value : 0) / stats.total * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      card.trend === 'critical' ? 'bg-red-500' :
                      card.trend === 'warning' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(((typeof card.value === 'number' ? card.value : 0) / stats.total * 100), 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Información adicional para el valor total */}
            {card.title === 'Valor Total' && stats.total > 0 && (
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-xs text-gray-600">
                  Valor promedio por artículo: S/ {(stats.totalValue / stats.total).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards