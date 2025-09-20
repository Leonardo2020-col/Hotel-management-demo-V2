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
        const result = await adminService.getSystemSettings(primaryBranch.id);
        
        if (result.error) {
          console.warn('⚠️ Error loading settings:', result.error);
          toast.error('Error al cargar configuraciones, usando valores por defecto');
          return;
        }
        
        if (result.data && result.data.length > 0) {
          console.log('✅ Settings loaded successfully:', result.data.length, 'settings');
          
          const mappedSettings = { ...settings };
          
          result.data.forEach(setting => {
            const keys = setting.setting_key.split('.');
            if (keys.length === 2 && mappedSettings[keys[0]]) {
              let value = setting.setting_value;
              
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

      const results = await Promise.allSettled(savePromises);
      
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
          {/* PESTAÑA GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información General del Hotel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="h-4 w-4 inline mr-1" />
                      Nombre del Hotel
                    </label>
                    <input
                      type="text"
                      value={settings.general.hotelName}
                      onChange={(e) => updateSetting('general', 'hotelName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre del hotel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email Principal
                    </label>
                    <input
                      type="email"
                      value={settings.general.email}
                      onChange={(e) => updateSetting('general', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@hotel.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Teléfono Principal
                    </label>
                    <input
                      type="tel"
                      value={settings.general.phone}
                      onChange={(e) => updateSetting('general', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+51 1 234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="h-4 w-4 inline mr-1" />
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={settings.general.website}
                      onChange={(e) => updateSetting('general', 'website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://www.hotel.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Dirección
                    </label>
                    <textarea
                      value={settings.general.address}
                      onChange={(e) => updateSetting('general', 'address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Dirección completa del hotel"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={settings.general.description}
                      onChange={(e) => updateSetting('general', 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción del hotel..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUC/Tax ID
                    </label>
                    <input
                      type="text"
                      value={settings.general.taxId}
                      onChange={(e) => updateSetting('general', 'taxId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="20123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={settings.general.currency}
                      onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PEN">Soles Peruanos (PEN)</option>
                      <option value="USD">Dólares Americanos (USD)</option>
                      <option value="EUR">Euros (EUR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="America/Lima">Lima (UTC-5)</option>
                      <option value="America/New_York">Nueva York (UTC-5)</option>
                      <option value="Europe/Madrid">Madrid (UTC+1)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSetting('general', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA RESERVACIONES */}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Reservaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Hora de Check-in
                    </label>
                    <input
                      type="time"
                      value={settings.booking.checkInTime}
                      onChange={(e) => updateSetting('booking', 'checkInTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Hora de Check-out
                    </label>
                    <input
                      type="time"
                      value={settings.booking.checkOutTime}
                      onChange={(e) => updateSetting('booking', 'checkOutTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reserva máxima anticipada (días)
                    </label>
                    <input
                      type="number"
                      value={settings.booking.maxAdvanceBooking}
                      onChange={(e) => updateSetting('booking', 'maxAdvanceBooking', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="730"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estancia mínima (días)
                    </label>
                    <input
                      type="number"
                      value={settings.booking.minStayDays}
                      onChange={(e) => updateSetting('booking', 'minStayDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estancia máxima (días)
                    </label>
                    <input
                      type="number"
                      value={settings.booking.maxStayDays}
                      onChange={(e) => updateSetting('booking', 'maxStayDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="365"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Porcentaje de depósito (%)
                    </label>
                    <input
                      type="number"
                      value={settings.booking.depositPercentage}
                      onChange={(e) => updateSetting('booking', 'depositPercentage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="allowSameDayBooking"
                      type="checkbox"
                      checked={settings.booking.allowSameDayBooking}
                      onChange={(e) => updateSetting('booking', 'allowSameDayBooking', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowSameDayBooking" className="ml-2 block text-sm text-gray-900">
                      Permitir reservas el mismo día
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="requireDeposit"
                      type="checkbox"
                      checked={settings.booking.requireDeposit}
                      onChange={(e) => updateSetting('booking', 'requireDeposit', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireDeposit" className="ml-2 block text-sm text-gray-900">
                      Requerir depósito para confirmar reserva
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA NOTIFICACIONES */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Notificaciones</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email para notificaciones
                  </label>
                  <input
                    type="email"
                    value={settings.notifications.notificationEmail}
                    onChange={(e) => updateSetting('notifications', 'notificationEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@hotel.com"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="emailNotifications"
                      type="checkbox"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                      Habilitar notificaciones por email
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="smsNotifications"
                      type="checkbox"
                      checked={settings.notifications.smsNotifications}
                      onChange={(e) => updateSetting('notifications', 'smsNotifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-900">
                      Habilitar notificaciones por SMS
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="lowStockAlerts"
                      type="checkbox"
                      checked={settings.notifications.lowStockAlerts}
                      onChange={(e) => updateSetting('notifications', 'lowStockAlerts', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="lowStockAlerts" className="ml-2 block text-sm text-gray-900">
                      Alertas de stock bajo en inventario
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="paymentReminders"
                      type="checkbox"
                      checked={settings.notifications.paymentReminders}
                      onChange={(e) => updateSetting('notifications', 'paymentReminders', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="paymentReminders" className="ml-2 block text-sm text-gray-900">
                      Recordatorios de pagos pendientes
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="checkInReminders"
                      type="checkbox"
                      checked={settings.notifications.checkInReminders}
                      onChange={(e) => updateSetting('notifications', 'checkInReminders', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="checkInReminders" className="ml-2 block text-sm text-gray-900">
                      Recordatorios de check-in programados
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="maintenanceAlerts"
                      type="checkbox"
                      checked={settings.notifications.maintenanceAlerts}
                      onChange={(e) => updateSetting('notifications', 'maintenanceAlerts', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="maintenanceAlerts" className="ml-2 block text-sm text-gray-900">
                      Alertas de mantenimiento de habitaciones
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA FACTURACIÓN */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Facturación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prefijo de facturas
                    </label>
                    <input
                      type="text"
                      value={settings.billing.invoicePrefix}
                      onChange={(e) => updateSetting('billing', 'invoicePrefix', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="INV"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prefijo de recibos
                    </label>
                    <input
                      type="text"
                      value={settings.billing.receiptPrefix}
                      onChange={(e) => updateSetting('billing', 'receiptPrefix', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="REC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numeración de facturas
                    </label>
                    <select
                      value={settings.billing.invoiceNumbering}
                      onChange={(e) => updateSetting('billing', 'invoiceNumbering', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="sequential">Secuencial</option>
                      <option value="yearly">Por año</option>
                      <option value="monthly">Por mes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tasa de IGV (%)
                    </label>
                    <input
                      type="number"
                      value={settings.billing.taxRate}
                      onChange={(e) => updateSetting('billing', 'taxRate', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="50"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Términos de pago
                    </label>
                    <select
                      value={settings.billing.paymentTerms}
                      onChange={(e) => updateSetting('billing', 'paymentTerms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="immediate">Inmediato</option>
                      <option value="7days">7 días</option>
                      <option value="15days">15 días</option>
                      <option value="30days">30 días</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="includeIgv"
                      type="checkbox"
                      checked={settings.billing.includeIgv}
                      onChange={(e) => updateSetting('billing', 'includeIgv', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeIgv" className="ml-2 block text-sm text-gray-900">
                      Incluir IGV en precios mostrados
                    </label>
                  </div>

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

          {/* PESTAÑA SEGURIDAD */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Seguridad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Key className="h-4 w-4 inline mr-1" />
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
                      <Clock className="h-4 w-4 inline mr-1" />
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
                      <Shield className="h-4 w-4 inline mr-1" />
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
                  <h4 className="text-md font-medium text-gray-900">Requisitos de Contraseña</h4>
                  
                  <div className="flex items-center">
                    <input
                      id="requireUppercase"
                      type="checkbox"
                      checked={settings.security.requireUppercase}
                      onChange={(e) => updateSetting('security', 'requireUppercase', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireUppercase" className="ml-2 block text-sm text-gray-900">
                      Requerir al menos una mayúscula (A-Z)
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
                      Requerir al menos un número (0-9)
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
                      Requerir caracteres especiales (!@#$%^&*)
                    </label>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Autenticación Avanzada</h4>
                    
                    <div className="flex items-center">
                      <input
                        id="twoFactorAuth"
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-900">
                        Habilitar autenticación de dos factores (2FA)
                      </label>
                    </div>
                    
                    {settings.security.twoFactorAuth && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          La autenticación de dos factores añade una capa extra de seguridad. 
                          Los usuarios deberán verificar su identidad con un código adicional.
                        </p>
                      </div>
                    )}
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

export default AdminSettings;