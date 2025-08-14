// src/components/common/LoadingSpinner.js
import React from 'react'
import { Loader } from 'lucide-react'

const LoadingSpinner = ({ 
  message = 'Cargando...', 
  size = 'large',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12'
  }

  const containerClasses = size === 'large' 
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center p-4'

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <Loader className={`animate-spin ${sizeClasses[size]} text-blue-600 mx-auto`} />
        {message && (
          <p className="mt-4 text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  )
}

export default LoadingSpinner