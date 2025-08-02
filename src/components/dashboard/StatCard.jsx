// src/components/dashboard/StatCard.jsx - VERSIÓN COMPLETA CORREGIDA
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue',
  loading = false 
}) => {
  // ✅ TODOS LOS COLORES DEFINIDOS INCLUYENDO LOS FALTANTES
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      text: 'text-yellow-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-600'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-600',
      text: 'text-gray-600'
    },
    // ✅ COLORES FALTANTES AGREGADOS
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      text: 'text-indigo-600'
    },
    violet: {
      bg: 'bg-violet-50',
      icon: 'text-violet-600',
      text: 'text-violet-600'
    },
    pink: {
      bg: 'bg-pink-50',
      icon: 'text-pink-600',
      text: 'text-pink-600'
    },
    cyan: {
      bg: 'bg-cyan-50',
      icon: 'text-cyan-600',
      text: 'text-cyan-600'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      text: 'text-emerald-600'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      text: 'text-orange-600'
    },
    teal: {
      bg: 'bg-teal-50',
      icon: 'text-teal-600',
      text: 'text-teal-600'
    },
    lime: {
      bg: 'bg-lime-50',
      icon: 'text-lime-600',
      text: 'text-lime-600'
    }
  };

  // ✅ VALIDACIÓN MEJORADA: Usar color por defecto si no existe
  const currentColor = colorClasses[color] || colorClasses.blue;

  // ✅ LOADING STATE MEJORADO
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ VALIDACIÓN DE PROPS
  const safeValue = value ?? '0';
  const safeTitle = title || 'Sin título';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{safeTitle}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{safeValue}</p>
          
          {subtitle && (
            <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center space-x-1">
              {trend.isPositive ? (
                <TrendingUp size={16} className="text-green-500" />
              ) : (
                <TrendingDown size={16} className="text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.percentage}%
              </span>
              <span className="text-sm text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-lg ${currentColor.bg}`}>
            <Icon className={`w-8 h-8 ${currentColor.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;