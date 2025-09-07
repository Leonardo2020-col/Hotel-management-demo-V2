import React, { useState, useEffect } from 'react';
import { XCircle, User, Mail, Phone, Building, Shield, Eye, EyeOff } from 'lucide-react';

const UserFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user = null, 
  branches = [], 
  roles = [], 
  title 
}) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role_id: user?.role_id || '',
    branch_ids: user?.user_branches?.map(ub => ub.branch?.id) || [],
    primary_branch_id: user?.user_branches?.find(ub => ub.is_primary)?.branch?.id || '',
    is_active: user?.is_active ?? true,
    password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Actualizar datos cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role_id: user.role_id || '',
        branch_ids: user.user_branches?.map(ub => ub.branch?.id) || [],
        primary_branch_id: user.user_branches?.find(ub => ub.is_primary)?.branch?.id || '',
        is_active: user.is_active ?? true,
        password: '',
        confirm_password: ''
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role_id: '',
        branch_ids: [],
        primary_branch_id: '',
        is_active: true,
        password: '',
        confirm_password: ''
      });
    }
    setErrors({});
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    // Validaciones básicas
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.role_id) {
      newErrors.role_id = 'Debe seleccionar un rol';
    }

    if (formData.branch_ids.length === 0) {
      newErrors.branch_ids = 'Debe asignar al menos una sucursal';
    }

    if (!formData.primary_branch_id) {
      newErrors.primary_branch_id = 'Debe seleccionar una sucursal principal';
    } else if (!formData.branch_ids.includes(formData.primary_branch_id)) {
      newErrors.primary_branch_id = 'La sucursal principal debe estar entre las asignadas';
    }

    if (formData.phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    // Validaciones de contraseña para usuarios nuevos
    if (!user) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (!formData.confirm_password) {
        newErrors.confirm_password = 'Debe confirmar la contraseña';
      } else if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Las contraseñas no coinciden';
      }
    } else {
      // Para usuarios existentes, validar solo si se está cambiando la contraseña
      if (formData.password) {
        if (formData.password.length < 6) {
          newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
        if (formData.password !== formData.confirm_password) {
          newErrors.confirm_password = 'Las contraseñas no coinciden';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBranchChange = (branchId, isChecked) => {
    let newBranchIds;
    
    if (isChecked) {
      newBranchIds = [...formData.branch_ids, branchId];
    } else {
      newBranchIds = formData.branch_ids.filter(id => id !== branchId);
      // Si se desmarca la sucursal principal, limpiar la selección
      if (formData.primary_branch_id === branchId) {
        setFormData(prev => ({
          ...prev,
          branch_ids: newBranchIds,
          primary_branch_id: ''
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      branch_ids: newBranchIds
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || null,
      role_id: formData.role_id,
      branch_ids: formData.branch_ids,
      primary_branch_id: formData.primary_branch_id,
      is_active: formData.is_active
    };

    // Solo incluir contraseña si se proporcionó
    if (formData.password) {
      submitData.password = formData.password;
    }

    onSubmit(submitData);
  };

  const availablePrimaryBranches = branches.filter(branch => 
    formData.branch_ids.includes(branch.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Nombre *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="María"
              />
              {errors.first_name && (
                <p className="text-red-600 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Apellido *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="García"
              />
              {errors.last_name && (
                <p className="text-red-600 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="maria@hotellima.com"
                disabled={!!user} // No permitir cambio de email en edición
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
              {user && (
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede modificar
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+51 999 123 456"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Shield className="h-4 w-4 inline mr-1" />
              Rol *
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({...formData, role_id: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.role_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar rol</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name === 'administrador' ? 'Administrador' : 'Recepción'}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="text-red-600 text-sm mt-1">{errors.role_id}</p>
            )}
          </div>

          {/* Sucursales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="h-4 w-4 inline mr-1" />
              Sucursales Asignadas *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {branches.map(branch => (
                <label key={branch.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.branch_ids.includes(branch.id)}
                    onChange={(e) => handleBranchChange(branch.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{branch.name}</span>
                </label>
              ))}
            </div>
            {errors.branch_ids && (
              <p className="text-red-600 text-sm mt-1">{errors.branch_ids}</p>
            )}
          </div>

          {/* Sucursal principal */}
          {availablePrimaryBranches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="h-4 w-4 inline mr-1" />
                Sucursal Principal *
              </label>
              <select
                value={formData.primary_branch_id}
                onChange={(e) => setFormData({...formData, primary_branch_id: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.primary_branch_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar sucursal principal</option>
                {availablePrimaryBranches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.primary_branch_id && (
                <p className="text-red-600 text-sm mt-1">{errors.primary_branch_id}</p>
              )}
            </div>
          )}

          {/* Contraseñas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña {!user && '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={user ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña {!user && '*'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${
                    errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Repetir contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-red-600 text-sm mt-1">{errors.confirm_password}</p>
              )}
            </div>
          </div>

          {/* Estado */}
          {user && (
            <div className="flex items-center">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Usuario activo
              </label>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {user ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;