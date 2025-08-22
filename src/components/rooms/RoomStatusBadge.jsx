// components/rooms/RoomStatusBadge.jsx
import React from 'react'
import { 
  CheckCircle, 
  User, 
  Sparkles, 
  Wrench, 
  AlertTriangle,
  Clock
} from 'lucide-react'

const RoomStatusBadge = ({ 
  status, 
  size = 'md', 
  showIcon = true, 
  showText = true,
  className = '' 
}) => {
  // ✅ Configuración de estados
  const statusConfig = {
    disponible: {
      icon: CheckCircle,
      label: 'Disponible',
      color: 'bg-green-100 text-green-800 border-green-200',
      dotColor: 'bg-green-500'
    },
    ocupada: {
      icon: User,
      label: 'Ocupada',
      color: 'bg-red-100 text-red-800 border-red-200',
      dotColor: 'bg-red-500'
    },
    limpieza: {
      icon: Sparkles,
      label: 'Limpieza',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dotColor: 'bg-yellow-500'
    },
    mantenimiento: {
      icon: Wrench,
      label: 'Mantenimiento',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      dotColor: 'bg-blue-500'
    },
    fuera_servicio: {
      icon: AlertTriangle,
      label: 'Fuera de servicio',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      dotColor: 'bg-gray-500'
    },
    reservada: {
      icon: Clock,
      label: 'Reservada',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      dotColor: 'bg-purple-500'
    }
  }

  // ✅ Configuración de tamaños
  const sizeConfig = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'h-3 w-3',
      dot: 'h-2 w-2'
    },
    md: {
      container: 'px-3 py-1 text-sm',
      icon: 'h-4 w-4',
      dot: 'h-2.5 w-2.5'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
      dot: 'h-3 w-3'
    }
  }

  const config = statusConfig[status] || statusConfig.disponible
  const sizeStyles = sizeConfig[size] || sizeConfig.md
  const Icon = config.icon

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${config.color} 
      ${sizeStyles.container}
      ${className}
    `}>
      {showIcon && (
        <Icon className={`${sizeStyles.icon} ${showText ? 'mr-1.5' : ''}`} />
      )}
      {!showIcon && (
        <span className={`${sizeStyles.dot} ${config.dotColor} rounded-full ${showText ? 'mr-2' : ''}`}></span>
      )}
      {showText && (
        <span className="capitalize">
          {config.label}
        </span>
      )}
    </span>
  )
}

// ✅ Componente especializado para lista de estados
export const RoomStatusList = ({ statuses, onStatusSelect, selectedStatus }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map(status => (
        <button
          key={status}
          onClick={() => onStatusSelect?.(status)}
          className={`transition-all duration-200 hover:scale-105 ${
            selectedStatus === status 
              ? 'ring-2 ring-blue-500 ring-offset-2' 
              : 'hover:shadow-md'
          }`}
        >
          <RoomStatusBadge status={status} size="md" />
        </button>
      ))}
    </div>
  )
}

// ✅ Componente de indicador de estado con animación
export const RoomStatusIndicator = ({ status, animated = false, pulse = false }) => {
  const config = {
    disponible: 'bg-green-500',
    ocupada: 'bg-red-500',
    limpieza: 'bg-yellow-500',
    mantenimiento: 'bg-blue-500',
    fuera_servicio: 'bg-gray-500',
    reservada: 'bg-purple-500'
  }

  return (
    <div className={`
      h-3 w-3 rounded-full 
      ${config[status] || config.disponible}
      ${animated ? 'transition-all duration-300' : ''}
      ${pulse ? 'animate-pulse' : ''}
    `} />
  )
}

// ✅ Componente de estado con progreso (para limpieza)
export const RoomStatusProgress = ({ status, progress = 0, showProgress = false }) => {
  const statusConfig = {
    disponible: {
      icon: CheckCircle,
      label: 'Disponible',
      color: 'bg-green-100 text-green-800 border-green-200',
      dotColor: 'bg-green-500'
    },
    ocupada: {
      icon: User,
      label: 'Ocupada',
      color: 'bg-red-100 text-red-800 border-red-200',
      dotColor: 'bg-red-500'
    },
    limpieza: {
      icon: Sparkles,
      label: 'Limpieza',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dotColor: 'bg-yellow-500'
    },
    mantenimiento: {
      icon: Wrench,
      label: 'Mantenimiento',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      dotColor: 'bg-blue-500'
    },
    fuera_servicio: {
      icon: AlertTriangle,
      label: 'Fuera de servicio',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      dotColor: 'bg-gray-500'
    },
    reservada: {
      icon: Clock,
      label: 'Reservada',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      dotColor: 'bg-purple-500'
    }
  }
  
  const config = statusConfig[status] || statusConfig.disponible
  
  return (
    <div className="space-y-2">
      <RoomStatusBadge status={status} />
      
      {showProgress && status === 'limpieza' && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default RoomStatusBadge