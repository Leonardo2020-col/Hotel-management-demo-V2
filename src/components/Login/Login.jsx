import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogIn, Loader, Hotel } from 'lucide-react'
import classNames from 'classnames'

// Schema de validación con Yup
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Debe ser un email válido')
    .required('El email es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
})

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  // React Hook Form con validación Yup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur'
  })

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const onSubmit = async (data) => {
    try {
      clearErrors()
      const result = await login(data.email, data.password)
      
      if (result.success) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('root', { 
          type: 'manual', 
          message: result.error || 'Error al iniciar sesión' 
        })
      }
    } catch (error) {
      setError('root', { 
        type: 'manual', 
        message: 'Error de conexión. Intenta nuevamente.' 
      })
    }
  }

  // Loading inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sistema de Hotel
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión para acceder al sistema
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={classNames(
                    "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm",
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  )}
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  className={classNames(
                    "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm",
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  )}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Error general */}
            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {errors.root.message}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Botón Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={classNames(
                  "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors",
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <LogIn className="-ml-1 mr-3 h-5 w-5" />
                    Iniciar Sesión
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Info de roles */}
          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">Roles disponibles:</p>
              <p><span className="font-medium">Administrador:</span> Acceso completo</p>
              <p><span className="font-medium">Recepción:</span> Operaciones del hotel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login