import React from 'react';

const Rooms = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Habitaciones</h1>
        <p className="text-gray-600 mt-1">Administra el inventario de habitaciones del hotel</p>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2m0 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo de Habitaciones</h3>
        <p className="text-gray-600">Funcionalidad en desarrollo</p>
      </div>
    </div>
  );
};

export default Rooms;