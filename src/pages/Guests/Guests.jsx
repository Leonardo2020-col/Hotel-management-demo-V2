import React from 'react';

const Guests = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Huéspedes</h1>
        <p className="text-gray-600 mt-1">Base de datos de huéspedes del hotel</p>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Base de Datos de Huéspedes</h3>
        <p className="text-gray-600">Funcionalidad en desarrollo</p>
      </div>
    </div>
  );
};

export default Guests;