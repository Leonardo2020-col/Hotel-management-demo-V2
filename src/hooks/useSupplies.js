// src/hooks/useSupplies.js - Enhanced with Snacks & Supplies Integration
import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useSupplies = () => {
  const [supplies, setSupplies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [consumptionHistory, setConsumptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calcular estadísticas automáticamente cuando cambien los datos
  const suppliesStats = useMemo(() => {
    if (!supplies || supplies.length === 0) {
      return {
        totalSupplies: 0,
        totalSnacks: 0,
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        snacksValue: 0,
        suppliesValue: 0,
        monthlyConsumption: 0,
        categoriesCount: 0,
        suppliersCount: 0,
        recentConsumptions: 0
      };
    }

    // Separar snacks y supplies
    const snackItems = supplies.filter(item => item.item_type === 'snack');
    const supplyItems = supplies.filter(item => item.item_type === 'supply');

    const totalSupplies = supplyItems.length;
    const totalSnacks = snackItems.length;
    const totalItems = supplies.length;
    
    // Solo calcular stock bajo/agotado para supplies (los snacks no tienen stock real)
    const lowStockItems = supplyItems.filter(s => s.currentStock <= s.minStock && s.currentStock > 0).length;
    const outOfStockItems = supplyItems.filter(s => s.currentStock === 0).length;
    
    // Calcular valores
    const suppliesValue = supplyItems.reduce((sum, s) => sum + (s.currentStock * s.unitPrice), 0);
    const snacksValue = snackItems.reduce((sum, s) => sum + (100 * s.unitPrice), 0); // Mock stock for snacks
    const totalValue = suppliesValue + snacksValue;
    
    // Calcular consumo mensual
    const now = new Date();
    const monthlyConsumption = consumptionHistory
      .filter(c => {
        const date = new Date(c.timestamp);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, c) => sum + (c.quantity * (c.unitPrice || 0)), 0);

    // Consumos de hoy
    const today = new Date();
    const recentConsumptions = consumptionHistory.filter(c => {
      const date = new Date(c.timestamp);
      return date.toDateString() === today.toDateString();
    }).length;

    return {
      totalSupplies,
      totalSnacks,
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      snacksValue,
      suppliesValue,
      monthlyConsumption,
      categoriesCount: categories.length,
      suppliersCount: suppliers.length,
      recentConsumptions
    };
  }, [supplies, consumptionHistory, categories, suppliers]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Loading unified inventory data...');
        
        // Cargar todos los items (supplies + snacks)
        const { data: allItems, error: itemsError } = await db.getAllInventoryItems();
        if (itemsError) {
          console.error('Error loading items:', itemsError);
          throw new Error('Error al cargar inventario: ' + itemsError.message);
        }

        // Cargar categorías
        const { data: allCategories, error: categoriesError } = await db.getAllCategories();
        if (categoriesError) {
          console.warn('Error loading categories:', categoriesError);
        }

        // Cargar proveedores
        const { data: allSuppliers, error: suppliersError } = await db.getAllSupplierNames();
        if (suppliersError) {
          console.warn('Error loading suppliers:', suppliersError);
        }

        // Mock consumption history - you can implement real tracking later
        const mockConsumptionHistory = generateMockConsumptionHistory(allItems || []);
        
        setSupplies(allItems || []);
        setCategories(allCategories || []);
        setSuppliers(allSuppliers || []);
        setConsumptionHistory(mockConsumptionHistory);
        
        console.log(`✅ Loaded ${allItems?.length || 0} total items`);
        
      } catch (err) {
        console.error('❌ Error loading data:', err);
        setError(err.message || 'Error al cargar los datos de inventario');
        toast.error('Error al cargar inventario');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generar historial mock de consumo
  const generateMockConsumptionHistory = (items) => {
    const history = [];
    const supplyItems = items.filter(item => item.item_type === 'supply');
    
    // Generate some mock consumption for the last 30 days
    for (let i = 0; i < 20; i++) {
      const randomSupply = supplyItems[Math.floor(Math.random() * supplyItems.length)];
      if (randomSupply) {
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - randomDaysAgo);
        
        history.push({
          id: `mock-${i}`,
          supplyId: randomSupply.id,
          supplyName: randomSupply.name,
          quantity: Math.floor(Math.random() * 10) + 1,
          unitPrice: randomSupply.unitPrice,
          unit: randomSupply.unit,
          reason: 'Uso en operaciones',
          consumedBy: 'Personal',
          department: 'Housekeeping',
          timestamp: date.toISOString(),
          type: 'consumption'
        });
      }
    }
    
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Crear nuevo item (supply o snack)
  const createSupply = async (supplyData) => {
    try {
      setLoading(true);
      
      let newItem;
      
      // Determine if it's a snack based on category or explicit flag
      const isSnack = supplyData.item_type === 'snack' || 
                     ['FRUTAS', 'BEBIDAS', 'SNACKS', 'POSTRES'].includes(supplyData.category) ||
                     supplyData.category.toLowerCase().includes('snack');

      if (isSnack) {
        console.log('Creating snack item:', supplyData);
        const { data, error } = await db.createSnackItem(supplyData);
        if (error) throw new Error('Error al crear snack: ' + error.message);
        newItem = data;
      } else {
        console.log('Creating supply item:', supplyData);
        const { data, error } = await db.createSupply(supplyData);
        if (error) throw new Error('Error al crear insumo: ' + error.message);
        newItem = data;
      }

      // Refresh data
      const { data: allItems } = await db.getAllInventoryItems();
      const { data: allCategories } = await db.getAllCategories();
      const { data: allSuppliers } = await db.getAllSupplierNames();
      
      setSupplies(allItems || []);
      setCategories(allCategories || []);
      setSuppliers(allSuppliers || []);
      
      toast.success(`${isSnack ? 'Snack' : 'Insumo'} creado exitosamente`);
      return newItem;
      
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar item
  const updateSupply = async (supplyId, updateData) => {
    try {
      setLoading(true);
      
      // Find the item to determine type
      const item = supplies.find(s => s.id === supplyId);
      if (!item) {
        throw new Error('Item no encontrado');
      }

      const isSnack = item.item_type === 'snack';
      
      if (isSnack) {
        console.log('Updating snack item:', supplyId, updateData);
        const { data, error } = await db.updateSnackItem(supplyId, updateData);
        if (error) throw new Error('Error al actualizar snack: ' + error.message);
      } else {
        console.log('Updating supply item:', supplyId, updateData);
        const { data, error } = await db.updateSupply(supplyId, updateData);
        if (error) throw new Error('Error al actualizar insumo: ' + error.message);
      }

      // Refresh data
      const { data: allItems } = await db.getAllInventoryItems();
      const { data: allCategories } = await db.getAllCategories();
      const { data: allSuppliers } = await db.getAllSupplierNames();
      
      setSupplies(allItems || []);
      setCategories(allCategories || []);
      setSuppliers(allSuppliers || []);
      
      toast.success(`${isSnack ? 'Snack' : 'Insumo'} actualizado exitosamente`);
      return true;
      
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar item
  const deleteSupply = async (supplyId) => {
    try {
      setLoading(true);
      
      // Find the item to determine type
      const item = supplies.find(s => s.id === supplyId);
      if (!item) {
        throw new Error('Item no encontrado');
      }

      const isSnack = item.item_type === 'snack';
      
      if (isSnack) {
        console.log('Deleting snack item:', supplyId);
        const { data, error } = await db.deleteSnackItem(supplyId);
        if (error) throw new Error('Error al eliminar snack: ' + error.message);
      } else {
        console.log('Deleting supply item:', supplyId);
        const { data, error } = await db.deleteSupply(supplyId);
        if (error) throw new Error('Error al eliminar insumo: ' + error.message);
      }

      // Refresh data
      const { data: allItems } = await db.getAllInventoryItems();
      setSupplies(allItems || []);
      
      toast.success(`${isSnack ? 'Snack' : 'Insumo'} eliminado exitosamente`);
      return true;
      
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registrar consumo (solo para supplies, los snacks no tienen stock)
  const recordConsumption = async (consumptionData) => {
    try {
      setLoading(true);
      
      // Find the item to determine type
      const item = supplies.find(s => s.id === consumptionData.supplyId);
      if (!item) {
        throw new Error('Item no encontrado');
      }

      if (item.item_type === 'snack') {
        toast.warning('Los snacks no tienen control de stock. Esta función es solo para insumos.');
        return null;
      }

      console.log('Recording consumption for supply:', consumptionData);
      
      const consumption = {
        id: Date.now().toString(),
        ...consumptionData,
        timestamp: new Date().toISOString()
      };

      // Record in database
      const { data, error } = await db.recordSupplyConsumption(consumptionData);
      if (error) {
        console.warn('Error recording in database:', error);
      }

      // Update local stock
      setSupplies(prev => prev.map(supply => {
        if (supply.id === consumptionData.supplyId) {
          return {
            ...supply,
            currentStock: Math.max(0, supply.currentStock - consumptionData.quantity),
            lastUpdated: new Date().toISOString()
          };
        }
        return supply;
      }));

      // Add to consumption history
      setConsumptionHistory(prev => [consumption, ...prev]);
      
      toast.success('Consumo registrado exitosamente');
      return consumption;
      
    } catch (error) {
      console.error('Error recording consumption:', error);
      toast.error('Error al registrar consumo: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ajustar stock (solo para supplies)
  const adjustStock = async (supplyId, adjustmentData) => {
    try {
      setLoading(true);
      
      // Find the item to determine type
      const item = supplies.find(s => s.id === supplyId);
      if (!item) {
        throw new Error('Item no encontrado');
      }

      if (item.item_type === 'snack') {
        toast.warning('Los snacks no tienen control de stock. Esta función es solo para insumos.');
        return null;
      }

      console.log('Adjusting stock for supply:', supplyId, adjustmentData);

      const adjustment = {
        id: Date.now().toString(),
        supplyId,
        supplyName: item.name,
        quantity: adjustmentData.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit,
        reason: adjustmentData.reason,
        consumedBy: 'Sistema',
        department: 'Administración',
        timestamp: new Date().toISOString(),
        type: 'adjustment'
      };

      // Update supply stock in database
      const { data, error } = await db.updateSupply(supplyId, {
        ...item,
        currentStock: adjustmentData.newStock
      });
      
      if (error) {
        console.warn('Error updating stock in database:', error);
      }

      // Update local state
      setSupplies(prev => prev.map(supply => {
        if (supply.id === supplyId) {
          return {
            ...supply,
            currentStock: adjustmentData.newStock,
            lastUpdated: new Date().toISOString()
          };
        }
        return supply;
      }));

      // Add to history
      setConsumptionHistory(prev => [adjustment, ...prev]);
      
      toast.success('Stock ajustado exitosamente');
      return adjustment;
      
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Error al ajustar stock: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Obtener items con stock bajo (solo supplies)
  const getLowStockSupplies = () => {
    return supplies.filter(supply => 
      supply.item_type === 'supply' && 
      supply.currentStock <= supply.minStock && 
      supply.currentStock > 0
    );
  };

  // Obtener items sin stock (solo supplies)
  const getOutOfStockSupplies = () => {
    return supplies.filter(supply => 
      supply.item_type === 'supply' && 
      supply.currentStock === 0
    );
  };

  // Obtener solo snacks
  const getSnackItems = () => {
    return supplies.filter(supply => supply.item_type === 'snack');
  };

  // Obtener solo supplies
  const getSupplyItems = () => {
    return supplies.filter(supply => supply.item_type === 'supply');
  };

  // Obtener estadísticas por categoría
  const getStatsByCategory = () => {
    const categoryStats = {};
    
    supplies.forEach(supply => {
      if (!categoryStats[supply.category]) {
        categoryStats[supply.category] = {
          count: 0,
          totalValue: 0,
          lowStock: 0,
          outOfStock: 0,
          snacks: 0,
          supplies: 0
        };
      }
      
      categoryStats[supply.category].count++;
      
      if (supply.item_type === 'snack') {
        categoryStats[supply.category].snacks++;
        categoryStats[supply.category].totalValue += 100 * supply.unitPrice; // Mock stock for snacks
      } else {
        categoryStats[supply.category].supplies++;
        categoryStats[supply.category].totalValue += supply.currentStock * supply.unitPrice;
        
        if (supply.currentStock === 0) {
          categoryStats[supply.category].outOfStock++;
        } else if (supply.currentStock <= supply.minStock) {
          categoryStats[supply.category].lowStock++;
        }
      }
    });
    
    return categoryStats;
  };

  // Obtener top consumos del mes (solo supplies)
  const getTopConsumptions = (limit = 10) => {
    const now = new Date();
    const thisMonth = consumptionHistory.filter(c => {
      const date = new Date(c.timestamp);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    // Agrupar por insumo y sumar cantidades
    const consumptionBySupply = {};
    thisMonth.forEach(consumption => {
      if (!consumptionBySupply[consumption.supplyId]) {
        consumptionBySupply[consumption.supplyId] = {
          supplyId: consumption.supplyId,
          supplyName: consumption.supplyName,
          totalQuantity: 0,
          totalValue: 0,
          transactions: 0
        };
      }
      
      consumptionBySupply[consumption.supplyId].totalQuantity += consumption.quantity;
      consumptionBySupply[consumption.supplyId].totalValue += consumption.quantity * (consumption.unitPrice || 0);
      consumptionBySupply[consumption.supplyId].transactions++;
    });

    return Object.values(consumptionBySupply)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit);
  };

  // Refrescar datos
  const refreshData = async () => {
    try {
      setLoading(true);
      
      const { data: allItems } = await db.getAllInventoryItems();
      const { data: allCategories } = await db.getAllCategories();
      const { data: allSuppliers } = await db.getAllSupplierNames();
      
      setSupplies(allItems || []);
      setCategories(allCategories || []);
      setSuppliers(allSuppliers || []);
      
      toast.success('Datos actualizados');
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error al actualizar datos');
    } finally {
      setLoading(false);
    }
  };

  return {
    // Datos
    supplies, // Unified list of supplies + snacks
    categories,
    suppliers,
    suppliesStats,
    consumptionHistory,
    loading,
    error,
    
    // Métodos CRUD
    createSupply, // Works for both supplies and snacks
    updateSupply, // Works for both supplies and snacks
    deleteSupply, // Works for both supplies and snacks
    recordConsumption, // Only for supplies
    adjustStock, // Only for supplies
    
    // Métodos de análisis
    getLowStockSupplies, // Only supplies
    getOutOfStockSupplies, // Only supplies
    getSnackItems, // Only snacks
    getSupplyItems, // Only supplies
    getStatsByCategory,
    getTopConsumptions,
    
    // Utilidades
    refreshData,
    
    // Información adicional
    hasUnifiedInventory: true,
    supportedItemTypes: ['supply', 'snack'],
    itemTypeCounts: {
      supplies: supplies.filter(s => s.item_type === 'supply').length,
      snacks: supplies.filter(s => s.item_type === 'snack').length,
      total: supplies.length
    }
  };
};