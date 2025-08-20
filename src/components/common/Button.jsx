// src/components/common/Button.jsx - COMPONENTE BUTTON MEJORADO
import React from 'react'
import { Loader2 } from 'lucide-react'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  loadingText,
  ...props
}) => {
  // ✅ Variantes de estilo
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200 border-transparent',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-200 border-transparent',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200 border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200 border-transparent',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-200 border-transparent',
    outline: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-200',
    ghost: 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-gray-200',
    link: 'bg-transparent text-blue-600 border-transparent hover:text-blue-700 focus:ring-blue-200 p-0 h-auto font-normal'
  }

  // ✅ Tamaños
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  // ✅ Tamaños de iconos
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  }

  // ✅ Clases base
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg border
    focus:outline-none focus:ring-4
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
    ${variant === 'link' ? '' : sizes[size]}
  `.trim().replace(/\s+/g, ' ')

  // ✅ Estado disabled
  const isDisabled = disabled || loading

  // ✅ Contenido del botón
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className={`${iconSizes[size]} animate-spin mr-2`} />
          {loadingText || children}
        </>
      )
    }

    if (Icon && iconPosition === 'left') {
      return (
        <>
          <Icon className={`${iconSizes[size]} ${children ? 'mr-2' : ''}`} />
          {children}
        </>
      )
    }

    if (Icon && iconPosition === 'right') {
      return (
        <>
          {children}
          <Icon className={`${iconSizes[size]} ${children ? 'ml-2' : ''}`} />
        </>
      )
    }

    return children
  }

  // ✅ Clases finales
  const finalClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <button
      className={finalClasses}
      disabled={isDisabled}
      {...props}
    >
      {renderContent()}
    </button>
  )
}

// ✅ Componentes de botón especializados
export const IconButton = ({ 
  icon: Icon, 
  size = 'md', 
  variant = 'ghost',
  className = '',
  ...props 
}) => {
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7'
  }

  const buttonSizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4'
  }

  return (
    <Button
      variant={variant}
      className={`${buttonSizes[size]} ${className}`}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  )
}

export const ButtonGroup = ({ 
  children, 
  orientation = 'horizontal',
  className = '' 
}) => {
  const orientationClasses = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col'
  }

  return (
    <div className={`${orientationClasses[orientation]} ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0
          const isLast = index === React.Children.count(children) - 1
          
          let additionalClasses = ''
          
          if (orientation === 'horizontal') {
            if (!isFirst && !isLast) additionalClasses = 'rounded-none border-l-0'
            else if (!isFirst) additionalClasses = 'rounded-l-none border-l-0'
            else if (!isLast) additionalClasses = 'rounded-r-none'
          } else {
            if (!isFirst && !isLast) additionalClasses = 'rounded-none border-t-0'
            else if (!isFirst) additionalClasses = 'rounded-t-none border-t-0'
            else if (!isLast) additionalClasses = 'rounded-b-none'
          }

          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${additionalClasses}`.trim()
          })
        }
        return child
      })}
    </div>
  )
}

export const FloatingActionButton = ({
  icon: Icon,
  className = '',
  size = 'lg',
  ...props
}) => {
  return (
    <IconButton
      icon={Icon}
      size={size}
      variant="primary"
      className={`
        fixed bottom-6 right-6 z-50
        shadow-lg hover:shadow-xl
        rounded-full
        ${className}
      `}
      {...props}
    />
  )
}

export default Button