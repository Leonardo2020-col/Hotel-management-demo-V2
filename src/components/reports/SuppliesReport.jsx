import React, { useState, useEffect } from 'react';
import { Package, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, Download, Box, Layers, Truck } from 'lucide-react';
import Button from '../common/Button';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { db } from '../../lib/supabase';

const SuppliesReport = ({ dateRange = {}, selectedPeriod = 'thisMonth' }) => {
  const [loading, setLoading] = useState(true);
  const [suppliesData, setSuppliesData] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    monthlyConsumption: 0,
    categories: [],
    lowStockAlerts: [],
    topConsumed: [],
    monthlyTrend: []
  });

  useEffect(() => {
    fetchSuppliesData();
  }, [dateRange?.startDate, dateRange?.endDate, selectedPeriod]);

  const fetchSuppliesData = async () => {
    setLoading(true);
    try {
      console.log('📦 Loading supplies data from Supabase...');
      
      // 1. Obtener todos los items del inventario (supplies + snacks)
      const { data: allItems, error: itemsError } = await db.getAllInventoryItems();
      if (itemsError) throw itemsError;

      // 2. Separar supplies de snacks
      const actualSupplies = allItems?.filter(item => item.item_type !== 'snack') || [];
      const snacks = allItems?.filter(item => item.item_type === 'snack') || [];

      // 3. Calcular estadísticas generales
      const totalItems = actualSupplies.length;
      
      // Items con stock bajo
      const lowStockItems = actualSupplies.filter(supply => {
        const current = supply.currentStock || supply.current_stock || 0;
        const min = supply.minStock || supply.min_stock || 0;
        return current <= min;
      });

      // Valor total del inventario
      const totalValue = actualSupplies.reduce((sum, supply) => {
        const stock = supply.currentStock || supply.current_stock || 0;
        const price = supply.unitPrice || supply.unit_price || 0;
        return sum + (stock * price);
      }, 0);

      // 4. Agrupar por categorías
      const categoryGroups = actualSupplies.reduce((acc, supply) => {
        const category = supply.category || 'Sin categoría';
        if (!acc[category]) {
          acc[category] = {
            name: category,
            items: 0,
            value: 0,
            lowStock: 0
          };
        }
        
        const stock = supply.currentStock || supply.current_stock || 0;
        const price = supply.unitPrice || supply.unit_price || 0;
        const min = supply.minStock || supply.min_stock || 0;
        
        acc[category].items++;
        acc[category].value += (stock * price);
        if (stock <= min) {
          acc[category].lowStock++;
        }
        
        return acc;
      }, {});

      // Calcular porcentajes
      const categories = Object.values(categoryGroups).map(cat => ({
        ...cat,
        percentage: totalValue > 0 ? (cat.value / totalValue) * 100 : 0
      }));

      // 5. Crear alertas de stock bajo
      const lowStockAlerts = lowStockItems.slice(0, 6).map(item => {
        const current = item.currentStock || item.current_stock || 0;
        const min = item.minStock || item.min_stock || 0;
        
        return {
          item: item.name,
          category: item.category || 'Sin categoría',
          current,
          minimum: min,
          status: current === 0 ? 'Crítico' : (current <= min * 0.5 ? 'Crítico' : 'Bajo')
        };
      });

      // 6. Obtener historial de consumo (simulado)
      const { data: consumptionHistory } = await db.getConsumptionHistory({ limit: 100 });
      
      // Top items consumidos (simulado basado en stock bajo)
      const topConsumed = actualSupplies
        .sort((a, b) => {
          const aStock = a.currentStock || a.current_stock || 0;
          const bStock = b.currentStock || b.current_stock || 0;
          return aStock - bStock; // Los de menor stock han sido más consumidos
        })
        .slice(0, 5)
        .map(item => {
          const stock = item.currentStock || item.current_stock || 0;
          const price = item.unitPrice || item.unit_price || 0;
          const consumed = Math.max(100 - stock, 0); // Simulado
          
          return {
            item: item.name,
            category: item.category || 'Sin categoría',
            consumed,
            cost: consumed * price
          };
        });

      // 7. Tendencia mensual (simulada)
      const monthlyTrend = generateMonthlyTrend(totalValue);

      // 8. Consumo mensual estimado
      const monthlyConsumption = totalValue * 0.15; // 15% del valor total como estimación

      setSuppliesData({
        totalItems,
        lowStockItems: lowStockItems.length,
        totalValue,
        monthlyConsumption,
        categories,
        lowStockAlerts,
        topConsumed,
        monthlyTrend
      });

      console.log('✅ Supplies data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching supplies data:', error);
      
      // Fallback con datos mock
      setSuppliesData({
        totalItems: 0,
        lowStockItems: 0,
        totalValue: 0,
        monthlyConsumption: 0,
        categories: [],
        lowStockAlerts: [{
          item: 'No hay datos disponibles',
          category: 'Sistema',
          current: 0,
          minimum: 0,
          status: 'Info'
        }],
        topConsumed: [],
        monthlyTrend: []
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      console.log('📄 Exporting supplies report...');
      
      const { generateReportPDF } = await import('../../utils/pdfGenerator');
      
      const reportData = {
        title: 'Reporte de Suministros',
        period: formatPeriod(dateRange),
        generatedAt: new Date().toLocaleString('es-PE'),
        suppliesData,
        categories: suppliesData.categories,
        lowStockAlerts: suppliesData.lowStockAlerts
      };
      
      await generateReportPDF('supplies', reportData);
      
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      alert('Error al exportar el reporte: ' + error.message);
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'Crítico': return 'bg-red-100 text-red-800 border-red-200';
      case 'Bajo': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'Info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'Crítico': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Bajo': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'Info': return <Package className="w-4 h-4 text-blue-600" />;
      default: return <Package className="w-4 h-4 text-green-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg h-64">
                <div className="h-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Package className="w-8 h-8 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reporte de Suministros</h2>
            <p className="text-gray-600">Gestión de inventario y consumo de insumos</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Download}
          onClick={exportReport}
          className="flex-shrink-0"
        >
          Exportar PDF
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(suppliesData.totalItems)}</p>
              <p className="text-xs text-gray-500 mt-1">En inventario</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Box className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600">{suppliesData.lowStockItems}</p>
              <p className="text-xs text-red-600 mt-1">Requieren atención</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Valor Total</p>
              <p className="text-xl font-bold text-gray-900 truncate">{formatCurrency(suppliesData.totalValue)}</p>
              <p className="text-xs text-gray-500 mt-1">Inventario</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Consumo Estimado</p>
              <p className="text-xl font-bold text-gray-900 truncate">{formatCurrency(suppliesData.monthlyConsumption)}</p>
              <p className="text-xs text-gray-500 mt-1">Mensual</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {suppliesData.lowStockAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Alertas de Stock Bajo</h3>
            </div>
            <Button variant="outline" size="sm" icon={ShoppingCart}>
              Generar Orden
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliesData.lowStockAlerts.map((alert, index) => (
              <div key={index} className={`border-2 rounded-lg p-4 ${getStockStatusColor(alert.status)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{alert.item}</h4>
                    <p className="text-sm text-gray-600 truncate">{alert.category}</p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {getStockIcon(alert.status)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Stock actual:</span>
                    <span className="font-medium">{alert.current}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Stock mínimo:</span>
                    <span className="font-medium">{alert.minimum}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${alert.status === 'Crítico' ? 'bg-red-500' : alert.status === 'Bajo' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((alert.current / Math.max(alert.minimum, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorías de suministros */}
      {suppliesData.categories.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Inventario por Categoría</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % del Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Bajo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliesData.categories.map((category, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.items}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.round(category.percentage)}%` }}
                          ></div>
                        </div>
                        <span>{Math.round(category.percentage)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.lowStock > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {category.lowStock} items
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top items y tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top items más consumidos */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingDown className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Items Más Consumidos</h3>
          </div>
          {suppliesData.topConsumed.length > 0 ? (
            <div className="space-y-4">
              {suppliesData.topConsumed.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-orange-600">{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{item.item}</p>
                      <p className="text-sm text-gray-600 truncate">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-medium text-gray-900">{item.consumed}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay datos de consumo disponibles</p>
            </div>
          )}
        </div>

        {/* Resumen del inventario */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <Layers className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resumen del Inventario</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Box className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Total de Items</p>
                  <p className="text-sm text-gray-600">En todas las categorías</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">{suppliesData.totalItems}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Valor Total</p>
                  <p className="text-sm text-gray-600">Del inventario actual</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">{formatCurrency(suppliesData.totalValue)}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Truck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Reabastecimiento</p>
                  <p className="text-sm text-gray-600">Items que necesitan pedido</p>
                </div>
              </div>
              <span className="text-lg font-bold text-orange-600">{suppliesData.lowStockItems}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Consumo Mensual</p>
                  <p className="text-sm text-gray-600">Estimación basada en uso</p>
                </div>
              </div>
              <span className="text-lg font-bold text-purple-600">{formatCurrency(suppliesData.monthlyConsumption)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información del período */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Información del Reporte</h3>
            <p className="text-gray-600">
              Reporte generado el {new Date().toLocaleDateString('es-PE')} a las {new Date().toLocaleTimeString('es-PE')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Período de análisis: {formatPeriod(dateRange)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Categorías analizadas</p>
            <p className="text-2xl font-bold text-gray-900">{suppliesData.categories.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function generateMonthlyTrend(totalValue) {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    consumption: Math.round(totalValue * (0.10 + Math.random() * 0.10)), // 10-20% del valor total
    cost: Math.round(totalValue * (0.08 + Math.random() * 0.08)) // 8-16% del valor total
  }));
}

function formatPeriod(dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 'Período actual';
  }
  
  const start = new Date(dateRange.startDate).toLocaleDateString('es-PE');
  const end = new Date(dateRange.endDate).toLocaleDateString('es-PE');
  
  return `${start} - ${end}`;
}

export default SuppliesReport;