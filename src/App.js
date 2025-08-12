// src/App.js - VERSIÓN ULTRA SIMPLIFICADA PARA DEPLOY INMEDIATO
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Importaciones directas de páginas para evitar problemas de rutas
import Dashboard from './pages/Dashboard/Dashboard';
import CheckIn from './pages/CheckIn/CheckIn';
import Reservations from './pages/Reservations/Reservations';
import Guests from './pages/Guests/Guests';
import Rooms from './pages/Rooms/Rooms';
import Supplies from './pages/Supplies/Supplies';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import LoginPage from './pages/Auth/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          {/* Por ahora solo mostrar Dashboard para que compile */}
          <Dashboard />
          
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;