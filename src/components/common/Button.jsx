// src/components/common/Button.jsx - ACTUALIZADO CON NUEVAS VARIANTES
import React from 'react';
import classNames from 'classnames';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  className = '',
  icon: Icon,
  loading = false,
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    // ✅ Nuevas variantes agregadas
    purple: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    pink: 'bg-pink-600 hover:bg-pink-700 text-white focus:ring-pink-500',
    teal: 'bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500',
    cyan: 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500',
    // Variantes outline
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500',
    'outline-green': 'border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white focus:ring-green-500',
    'outline-red': 'border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus:ring-red-500',
    // Variantes ghost
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    'ghost-blue': 'text-blue-600 hover:bg-blue-100 focus:ring-blue-500',
    'ghost-green': 'text-green-600 hover:bg-green-100 focus:ring-green-500',
    'ghost-red': 'text-red-600 hover:bg-red-100 focus:ring-red-500'
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const classes = classNames(
    baseClasses,
    variants[variant] || variants.primary, // Fallback a primary si la variante no existe
    sizes[size],
    {
      'opacity-50 cursor-not-allowed': disabled || loading,
      'w-full': fullWidth
    },
    className
  );

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {Icon && !loading && (
        <Icon size={size === 'xs' ? 14 : size === 'sm' ? 16 : size === 'lg' ? 24 : size === 'xl' ? 28 : 20} className={children ? 'mr-2' : ''} />
      )}
      {children}
    </button>
  );
};

export default Button;