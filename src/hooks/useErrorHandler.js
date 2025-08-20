// src/hooks/useErrorHandler.js - HOOKS PARA MANEJO DE ERRORES
import { useState, useCallback } from 'react'
import { handleError as handleErrorUtil, shouldRetry } from '../utils/errorUtils'

// ✅ Hook para manejo de errores en componentes
export const useErrorHandler = () => {
  const [errors, setErrors] = useState({})

  const handleError = useCallback((error, field = 'general', options = {}) => {
    const errorInfo = handleErrorUtil(error, options)
    
    setErrors(prev => ({
      ...prev,
      [field]: errorInfo
    }))

    return errorInfo
  }, [])

  const clearError = useCallback((field = 'general') => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  const hasError = useCallback((field = 'general') => {
    return !!errors[field]
  }, [errors])

  const getError = useCallback((field = 'general') => {
    return errors[field]
  }, [errors])

  return {
    errors,
    handleError,
    clearError,
    clearAllErrors,
    hasError,
    getError
  }
}

// ✅ Hook para retry automático
export const useRetry = (fn, maxRetries = 3, delay = 1000) => {
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const executeWithRetry = useCallback(async (...args) => {
    let lastError = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt)
        if (attempt > 0) {
          setIsRetrying(true)
          await new Promise(resolve => setTimeout(resolve, delay * attempt))
        }
        
        const result = await fn(...args)
        setIsRetrying(false)
        setRetryCount(0)
        return result
      } catch (error) {
        lastError = error
        
        // Si es el último intento o un error que no debe reintentarse
        if (attempt === maxRetries || !shouldRetry(error)) {
          setIsRetrying(false)
          throw error
        }
      }
    }
    
    setIsRetrying(false)
    throw lastError
  }, [fn, maxRetries, delay])

  return {
    executeWithRetry,
    retryCount,
    isRetrying
  }
}

// ✅ Hook para estados de loading
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState)
  
  const startLoading = useCallback(() => setIsLoading(true), [])
  const stopLoading = useCallback(() => setIsLoading(false), [])
  const toggleLoading = useCallback(() => setIsLoading(prev => !prev), [])
  
  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoading: setIsLoading
  }
}

// ✅ Hook para async operations con manejo de errores
export const useAsyncOperation = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null
  })

  const execute = useCallback(async (asyncFunction, ...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await asyncFunction(...args)
      setState({ loading: false, error: null, data: result })
      return result
    } catch (error) {
      setState({ loading: false, error, data: null })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}