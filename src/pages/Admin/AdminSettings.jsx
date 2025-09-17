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
  const [settings, setSettings] = useState({
    general: {
      hotelName: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      taxId: '',
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
      notificationEmail: ''
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
      if (primaryBranch) {
        const result = await adminService.getHotelSettings(primaryBranch.id);
        if (result.data) {
          // Mapear configuraciones de la base de datos al estado local
          const mappedSettings = { ...settings };
          result.data.forEach(setting => {
            const keys = setting.setting_key.split('.');
            if (keys.length === 2 && mappedSettings[keys[0]]) {
              mappedSettings[keys[0]][keys[1]] = setting.setting_value;
            }
          });
          setSettings(mappedSettings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const primaryBranch = getPrimaryBranch();
      if (!primaryBranch) {
        toast.error('No se pudo determinar la sucursal');
        return;
      }

      // Convertir settings a formato de base de datos
      const settingsToSave = [];
      Object.keys(settings).forEach(category => {
        Object.keys(settings[category]).forEach(key => {
          settingsToSave.push({
            branch_id: primaryBranch.id,
            setting_key: `${category}.${key}`,
            setting_value: settings[category][key]
          });
        });
      });

      const result = await adminService.updateHotelSettings(settingsToSave);
      if (result.error) {
        toast.error('Error al guardar configuraciones');
        return;
      }

      toast.success('Configuraciones guardadas exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
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
            onClick={handleSaveSettings}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Alertas */}
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

        {/* Contenido */}
        <div className="p-6">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Hotel
                    </label>
                    <input
                      type="text"
                      value={settings.general.hotelName}
                      onChange={(e) => updateSetting('general', 'hotelName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Hotel Lima Plaza"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUC / Identificación Fiscal
                    </label>
                    <input
                      type="text"
                      value={settings.general.taxId}
                      onChange={(e) => updateSetting('general', 'taxId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="20123456789"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      value={settings.general.description}
                      onChange={(e) => updateSetting('general', 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Hotel boutique en el corazón de Lima..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={settings.general.address}
                      onChange={(e) => updateSetting('general', 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Av. Javier Prado 1234, San Isidro, Lima"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={settings.general.phone}
                      onChange={(e) => updateSetting('general', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+51 1 234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.general.email}
                      onChange={(e) => updateSetting('general', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="info@hotellima.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={settings.general.website}
                      onChange={(e) => updateSetting('general', 'website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.hotellima.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={settings.general.currency}
                      onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PEN">Soles Peruanos (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                      <option value="EUR">Euros (EUR)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reservaciones */}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Reservaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Check-in
                    </label>
                    <input
                      type="time"
                      value={settings.booking.checkInTime}
                      onChange={(e) => updateSetting('booking', 'checkInTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Check-out
                    </label>
                    <input
                      type="time"
                      value={settings.booking.checkOutTime}
                      onChange={(e) => updateSetting('booking', 'checkOutTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días máximos de anticipación
                    </label>
                    <input
                      type="number"
                      value={settings.booking.maxAdvanceBooking}
                      onChange={(e) => updateSetting('booking', 'maxAdvanceBooking', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              Configuraciones sincronizadas - Última actualización: {new Date().toLocaleString('es-PE')}
            </span>
          </div>
          <button
            onClick={loadSettings}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;