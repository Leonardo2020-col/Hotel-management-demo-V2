import React, { useState, useEffect } from 'react';
import { User, Phone, FileText, Calendar, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GuestForm = ({ guest, onSubmit, onCancel, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    document_type: '',
    document_number: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Tipos de documento comunes en Perú
  const documentTypes = [
    { value: 'DNI', label: 'DNI - Documento Nacional de Identidad', icon: '🆔' },
    { value: 'CE', label: 'CE - Carnet de Extranjería', icon: '🌍' },
    { value: 'Pasaporte', label: 'Pasaporte', icon: '📘' },
    { value: 'RUC', label: 'RUC - Registro Único de Contribuyentes', icon: '🏢' },
    { value: 'Otro', label: 'Otro documento', icon: '📄' }
  ];

  // Llenar formulario si es edición
  useEffect(() => {
    if (guest) {
      setFormData({
        full_name: guest.full_name || '',
        phone: guest.phone || '',
        document_type: guest.document_type || '',
        document_number: guest.document_number || ''
      });
    }
  }, [guest]);

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Marcar campo como tocado
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Nombre completo es requerido
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es requerido';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Si se especifica un tipo de documento, el número es requerido
    if (formData.document_type && !formData.document_number.trim()) {
      newErrors.document_number = 'El número de documento es requerido cuando se especifica el tipo';
    }

    // Si se especifica un número de documento, el tipo es requerido
    if (formData.document_number && !formData.document_type) {
      newErrors.document_type = 'El tipo de documento es requerido cuando se especifica el número';
    }

    // Validar formato de teléfono (básico)
    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'El formato del teléfono no es válido';
    }

    // Validar DNI peruano (8 dígitos)
    if (formData.document_type === 'DNI' && formData.document_number) {
      if (!/^\d{8}$/.test(formData.document_number.replace(/\s/g, ''))) {
        newErrors.document_number = 'El DNI debe tener 8 dígitos';
      }
    }

    // Validar RUC peruano (11 dígitos)
    if (formData.document_type === 'RUC' && formData.document_number) {
      if (!/^\d{11}$/.test(formData.document_number.replace(/\s/g, ''))) {
        newErrors.document_number = 'El RUC debe tener 11 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados
    setTouched({
      full_name: true,
      phone: true,
      document_type: true,
      document_number: true
    });

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting guest form:', error);
    }
  };

  // Formatear número de documento mientras el usuario escribe
  const handleDocumentChange = (e) => {
    let value = e.target.value;
    
    // Limpiar caracteres no permitidos según el tipo de documento
    if (formData.document_type === 'DNI' || formData.document_type === 'RUC') {
      value = value.replace(/\D/g, ''); // Solo números
    }
    
    e.target.value = value;
    handleChange(e);
  };

  const getFieldStatus = (fieldName) => {
    if (errors[fieldName]) return 'error';
    if (touched[fieldName] && formData[fieldName]) return 'success';
    return 'default';
  };

  const InputField = ({ name, label, type = 'text', placeholder, required = false, icon: Icon, children }) => {
    const status = getFieldStatus(name);
    
    return (
      <div className="space-y-2">
        <label htmlFor={name} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="relative group">
          {children || (
            <input
              type={type}
              id={name}
              name={name}
              value={formData[name]}
              onChange={name === 'document_number' ? handleDocumentChange : handleChange}
              onBlur={() => setTouched(prev => ({ ...prev, [name]: true }))}
              className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                status === 'error' 
                  ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-200' 
                  : status === 'success'
                  ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-200'
                  : 'border-slate-200 bg-slate-50/50 focus:border-blue-500 focus:ring-blue-200'
              } focus:ring-4`}
              placeholder={placeholder}
              disabled={isSubmitting}
            />
          )}
          
          {/* Status icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {status === 'error' && (
              <div className="p-1 bg-red-100 rounded-full">
                <X className="w-4 h-4 text-red-500" />
              </div>
            )}
            {status === 'success' && (
              <div className="p-1 bg-green-100 rounded-full">
                <Check className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
        </div>
        
        {errors[name] && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1 h-4 bg-red-400 rounded-full"></div>
            <p className="text-sm text-red-600 font-medium">{errors[name]}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      
      {/* Nombre Completo */}
      <InputField
        name="full_name"
        label="Nombre Completo"
        placeholder="Ingresa el nombre completo del huésped"
        required
        icon={User}
      />

      {/* Teléfono */}
      <InputField
        name="phone"
        label="Teléfono"
        type="tel"
        placeholder="+51 999 123 456"
        icon={Phone}
      />

      {/* Tipo de Documento */}
      <InputField
        name="document_type"
        label="Tipo de Documento"
        icon={FileText}
      >
        <select
          id="document_type"
          name="document_type"
          value={formData.document_type}
          onChange={handleChange}
          onBlur={() => setTouched(prev => ({ ...prev, document_type: true }))}
          className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
            getFieldStatus('document_type') === 'error' 
              ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-200' 
              : getFieldStatus('document_type') === 'success'
              ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-200'
              : 'border-slate-200 bg-slate-50/50 focus:border-blue-500 focus:ring-blue-200'
          } focus:ring-4`}
          disabled={isSubmitting}
        >
          <option value="">Seleccionar tipo de documento</option>
          {documentTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
      </InputField>

      {/* Número de Documento */}
      <InputField
        name="document_number"
        label="Número de Documento"
        placeholder={
          formData.document_type === 'DNI' ? '12345678' :
          formData.document_type === 'RUC' ? '12345678901' :
          formData.document_type === 'CE' ? 'CE123456789' :
          formData.document_type === 'Pasaporte' ? 'ABC123456' :
          'Número de documento'
        }
        icon={FileText}
      />

      {/* Ayuda contextual mejorada */}
      {formData.document_type && (
        <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Información del documento</h4>
              <div className="text-sm text-blue-700">
                {formData.document_type === 'DNI' && (
                  <p>DNI peruano: Debe contener exactamente 8 dígitos numéricos (ej: 12345678)</p>
                )}
                {formData.document_type === 'RUC' && (
                  <p>RUC peruano: Debe contener exactamente 11 dígitos numéricos (ej: 12345678901)</p>
                )}
                {formData.document_type === 'CE' && (
                  <p>Carnet de Extranjería: Documento oficial para extranjeros residentes en Perú</p>
                )}
                {formData.document_type === 'Pasaporte' && (
                  <p>Número de pasaporte: Código alfanumérico único del documento de viaje</p>
                )}
                {formData.document_type === 'Otro' && (
                  <p>Otro tipo de documento: Ingresa el número tal como aparece en el documento</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional para edición */}
      {guest && (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 rounded-2xl">
              <Calendar className="w-6 h-6 text-slate-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 mb-2">Información del registro</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span><strong>Registrado:</strong> {new Date(guest.created_at).toLocaleDateString('es-PE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                {guest.updated_at !== guest.created_at && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span><strong>Actualizado:</strong> {new Date(guest.updated_at).toLocaleDateString('es-PE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Guardando...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {guest ? (
                <>
                  <Check className="w-5 h-5" />
                  Actualizar Huésped
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  Crear Huésped
                </>
              )}
            </div>
          )}
        </button>
      </div>
      
    </form>
  );
};

export default GuestForm;