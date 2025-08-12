// src/App.js - VERSIÓN ULTRA SIMPLE PARA DEPLOY INMEDIATO
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Componente simple de bienvenida para evitar problemas de dependencias
const WelcomeScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2m0 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Hotel Paraíso</h1>
          <p className="text-xl text-gray-600 mb-2">Sistema de Gestión Hotelera</p>
          <p className="text-sm text-gray-500">Demo en desarrollo</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">¡Bienvenido!</h2>
          <p className="text-gray-600 mb-6">
            La aplicación de gestión hotelera está siendo configurada. 
            Pronto estará disponible con todas sus funcionalidades.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Dashboard</span>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">En desarrollo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Reservaciones</span>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Próximamente</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Check-in/Check-out</span>
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Próximamente</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>Demo • Versión de Desarrollo</p>
          <p className="mt-1">Actualizado: {new Date().toLocaleDateString('es-PE')}</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <WelcomeScreen />
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '8px',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;