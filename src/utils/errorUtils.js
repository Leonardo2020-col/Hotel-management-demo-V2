// src/utils/errorUtils.js - VERSIÓN CORREGIDA
import toast from 'react-hot-toast'

// ✅ Tipos de errores comunes
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
}

// ✅ Función para clasificar errores
export const classifyError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN

  const message = error.message?.toLowerCase() || ''
  const status = error.status || error.statusCode

  // Errores de red
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return ERROR_TYPES.NETWORK
  }

  // Errores por código de estado
  if (status) {
    if (status === 401) return ERROR_TYPES.AUTHENTICATION
    if (status === 403) return ERROR_TYPES.AUTHORIZATION
    if (status === 404) return ERROR_TYPES.NOT_FOUND
    if (status >= 400 && status < 500) return ERROR_TYPES.CLIENT
    if (status >= 500) return ERROR_TYPES.SERVER
  }

  // Errores de autenticación
  if (message.includes('unauthorized') || message.includes('invalid login') || message.includes('token')) {
    return ERROR_TYPES.AUTHENTICATION
  }

  // Errores de autorización
  if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
    return ERROR_TYPES.AUTHORIZATION
  }

  // Errores de validación
  if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
    return ERROR_TYPES.VALIDATION
  }

  return ERROR_TYPES.UNKNOWN
}

// ✅ Mensajes de error amigables
export const getErrorMessage = (error, context = '') => {
  const errorType = classifyError(error)
  
  const messages = {
    [ERROR_TYPES.NETWORK]: 'Error de conexión. Verifica tu internet y vuelve a intentar.',
    [ERROR_TYPES.AUTHENTICATION]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    [ERROR_TYPES.AUTHORIZATION]: 'No tienes permisos para realizar esta acción.',
    [ERROR_TYPES.VALIDATION]: 'Por favor, verifica que todos los campos estén correctos.',
    [ERROR_TYPES.NOT_FOUND]: 'El recurso solicitado no fue encontrado.',
    [ERROR_TYPES.SERVER]: 'Error interno del servidor. Intenta más tarde.',
    [ERROR_TYPES.CLIENT]: 'Error en la solicitud. Verifica los datos e intenta nuevamente.',
    [ERROR_TYPES.UNKNOWN]: 'Ha ocurrido un error inesperado.'
  }

  let message = messages[errorType] || messages[ERROR_TYPES.UNKNOWN]
  
  // Agregar contexto si se proporciona
  if (context) {
    message = `${context}: ${message}`
  }

  return message
}

// ✅ Handler de errores para diferentes contextos
export const handleError = (error, options = {}) => {
  const {
    context = '',
    showToast = true,
    logError = true,
    throwError = false
  } = options

  if (logError) {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)
  }

  const message = getErrorMessage(error, context)

  if (showToast) {
    const errorType = classifyError(error)
    
    // Diferentes tipos de toast según el error
    switch (errorType) {
      case ERROR_TYPES.AUTHENTICATION:
        toast.error(message, {
          id: 'auth-error',
          duration: 6000,
          icon: '🔐'
        })
        break
      case ERROR_TYPES.NETWORK:
        toast.error(message, {
          id: 'network-error',
          duration: 5000,
          icon: '🌐'
        })
        break
      case ERROR_TYPES.VALIDATION:
        toast.error(message, {
          id: 'validation-error',
          duration: 4000,
          icon: '⚠️'
        })
        break
      default:
        toast.error(message, {
          duration: 4000
        })
    }
  }

  if (throwError) {
    throw error
  }

  return { error, message, type: classifyError(error) }
}

// ✅ Función para determinar si un error debe reintentarse
export const shouldRetry = (error) => {
  const errorType = classifyError(error)
  
  // No reintentar errores de cliente (4xx excepto algunos específicos)
  if (errorType === ERROR_TYPES.AUTHENTICATION) return false
  if (errorType === ERROR_TYPES.AUTHORIZATION) return false
  if (errorType === ERROR_TYPES.NOT_FOUND) return false
  if (errorType === ERROR_TYPES.VALIDATION) return false
  
  // Reintentar errores de red y servidor
  return [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.SERVER,
    ERROR_TYPES.UNKNOWN
  ].includes(errorType)
}

// ✅ Validador de formularios con manejo de errores
export const createFormValidator = (schema) => {
  return (data) => {
    const errors = {}
    
    Object.entries(schema).forEach(([field, rules]) => {
      const value = data[field]
      
      if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[field] = `${rules.label || field} es requerido`
        return
      }
      
      if (value && rules.minLength && value.length < rules.minLength) {
        errors[field] = `${rules.label || field} debe tener al menos ${rules.minLength} caracteres`
        return
      }
      
      if (value && rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `${rules.label || field} no puede tener más de ${rules.maxLength} caracteres`
        return
      }
      
      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors[field] = rules.patternMessage || `${rules.label || field} tiene un formato inválido`
        return
      }
      
      if (value && rules.validate) {
        const customError = rules.validate(value, data)
        if (customError) {
          errors[field] = customError
          return
        }
      }
    })
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

// ✅ Utilidad para generar IDs únicos de error
export const generateErrorId = () => {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ✅ Utilidad para formatear stack traces
export const formatStackTrace = (error) => {
  if (!error.stack) return 'Stack trace no disponible'
  
  return error.stack
    .split('\n')
    .slice(1) // Remover la primera línea que es el mensaje
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}