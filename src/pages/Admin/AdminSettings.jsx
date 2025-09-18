import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../lib/supabase-admin';
import toast from 'react-hot-toast';
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Palette,
  Database,
  Mail,
  Phone,
  MapPin,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Building,
  Users,
  Key
} from 'lucide-react';

const AdminSettings = () => {
  const { userInfo, isAdmin, getPrimaryBranch } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const [settings, setSettings] = useState({
    general: {
      hotelName: 'Hotel Lima Plaza',
      description: 'Hotel boutique en el corazón de Lima...',
      address: 'Av. Javier Prado 1234, San Isidro, Lima',
      phone: '+51 1 234-5678',
      email: 'info@hotellima.com',
      website: 'https://www.hotellima.com',
      taxId: '20123456789',
      currency: 'PEN',
      timezone: 'America/Lima',
      language: 'es'
    },
    booking: {
      checkInTime: '14:00',
      checkOutTime: '12:00',
      maxAdvanceBooking: 365,
      minStayDays: 1,
      maxStayDays: 30,
      allowSameDayBooking: true,
      requireDeposit: true,
      depositPercentage: 50
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      lowStockAlerts: true,
      paymentReminders: true,
      checkInReminders: true,
      maintenanceAlerts: true,
      notificationEmail: 'admin@hotellima.com'
    },
    billing: {
      invoicePrefix: 'INV',
      receiptPrefix: 'REC',
      invoiceNumbering: 'sequential',
      taxRate: 18,
      includeIgv: true,
      autoInvoice: false,
      paymentTerms: 'immediate'
    },
    security: {
      passwordMinLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      sessionTimeout: 480,
      maxLoginAttempts: 5,
      twoFactorAuth: false
    }
  });

  useEffect(() => {
    if (isAdmin()) {
      loadSettings();
    }
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const primaryBranch = getPrimaryBranch();
      console.log('🔄 Loading settings for branch:', primaryBranch?.id);
      
      if (primaryBranch) {
        // ✅ CORRECCIÓN: Usar getSystemSettings en lugar de getHotelSettings
        const result = await adminService.getSystemSettings(primaryBranch.id);
        
        if (result.error) {
          console.warn('⚠️ Error loading settings:', result.error);
          toast.error('Error al cargar configuraciones, usando valores por defecto');
          return;
        }
        
        if (result.data && result.data.length > 0) {
          console.log('✅ Settings loaded successfully:', result.data.length, 'settings');
          
          // Mapear configuraciones de la base de datos al estado local
          const mappedSettings = { ...settings };
          
          result.data.forEach(setting => {
            const keys = setting.setting_key.split('.');
            if (keys.length === 2 && mappedSettings[keys[0]]) {
              // Asegurar que el valor sea del tipo correcto
              let value = setting.setting_value;
              
              // Convertir strings a tipos apropiados
              if (typeof value === 'string') {
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value !== '') value = Number(value);
              }
              
              mappedSettings[keys[0]][keys[1]] = value;
            }
          });
          
          setSettings(mappedSettings);
          console.log('📋 Settings mapped successfully');
        } else {
          console.log('ℹ️ No settings found, using defaults');
          toast.success('Configuraciones inicializadas con valores por defecto');
        }
      } else {
        toast.error('No se pudo determinar la sucursal principal');
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      toast.error('Error al cargar configuraciones: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaveLoading(true);
    try {
      const primaryBranch = getPrimaryBranch();
      if (!primaryBranch) {
        toast.error('No se pudo determinar la sucursal');
        return;
      }

      console.log('💾 Saving settings for branch:', primaryBranch.id);

      // ✅ CORRECCIÓN: Guardar configuraciones una por una usando updateSystemSetting
      const savePromises = [];
      
      Object.keys(settings).forEach(category => {
        Object.keys(settings[category]).forEach(key => {
          const settingKey = `${category}.${key}`;
          const settingValue = settings[category][key];
          
          console.log('📝 Saving setting:', settingKey, '=', settingValue);
          
          savePromises.push(
            adminService.updateSystemSetting(
              primaryBranch.id,
              settingKey,
              settingValue,
              userInfo?.id
            )
          );
        });
      });

      // Ejecutar todas las actualizaciones
      const results = await Promise.allSettled(savePromises);
      
      // Verificar resultados
      const errors = results.filter(result => result.status === 'rejected');
      const successes = results.filter(result => result.status === 'fulfilled');
      
      if (errors.length > 0) {
        console.error('❌ Some settings failed to save:', errors);
        toast.error(`Error al guardar ${errors.length} configuraciones`);
      } else {
        console.log('✅ All settings saved successfully:', successes.length);
        toast.success('Configuraciones guardadas exitosamente');
        setLastSaved(new Date());
      }

    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast.error('Error al guardar configuraciones: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaveLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
    console.log('🔄 Updating setting:', category, key, '=', value);
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'booking', name: 'Reservaciones', icon: Clock },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'billing', name: 'Facturación', icon: DollarSign },
    { id: 'security', name: 'Seguridad', icon: Shield }
  ];

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">
            No tienes permisos para acceder a la configuración del sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">
            Administra las configuraciones globales del hotel
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recargar
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saveLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saveLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Alerta de configuración global */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Configuración Global
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Los cambios realizados aquí afectan a todas las sucursales del sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-6">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <input
                      id="autoInvoice"
                      type="checkbox"
                      checked={settings.billing.autoInvoice}
                      onChange={(e) => updateSetting('billing', 'autoInvoice', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoInvoice" className="ml-2 block text-sm text-gray-900">
                      Generar facturas automáticamente
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seguridad */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Seguridad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitud mínima de contraseña
                    </label>
                    <input
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="6"
                      max="32"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de sesión (minutos)
                    </label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="30"
                      max="1440"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo intentos de login
                    </label>
                    <input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="3"
                      max="10"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="requireUppercase"
                      type="checkbox"
                      checked={settings.security.requireUppercase}
                      onChange={(e) => updateSetting('security', 'requireUppercase', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireUppercase" className="ml-2 block text-sm text-gray-900">
                      Requerir al menos una mayúscula
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="requireNumbers"
                      type="checkbox"
                      checked={settings.security.requireNumbers}
                      onChange={(e) => updateSetting('security', 'requireNumbers', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireNumbers" className="ml-2 block text-sm text-gray-900">
                      Requerir al menos un número
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="requireSpecialChars"
                      type="checkbox"
                      checked={settings.security.requireSpecialChars}
                      onChange={(e) => updateSetting('security', 'requireSpecialChars', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireSpecialChars" className="ml-2 block text-sm text-gray-900">
                      Requerir caracteres especiales
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="twoFactorAuth"
                      type="checkbox"
                      checked={settings.security.twoFactorAuth}
                      onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-900">
                      Habilitar autenticación de dos factores
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estado de la configuración */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm text-gray-700">
              {lastSaved ? (
                `Configuraciones guardadas - ${lastSaved.toLocaleString('es-PE')}`
              ) : (
                `Sistema inicializado - ${new Date().toLocaleString('es-PE')}`
              )}
            </span>
          </div>
          <button
            onClick={loadSettings}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings