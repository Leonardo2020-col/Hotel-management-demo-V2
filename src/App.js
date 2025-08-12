// src/App.js - VERSIÓN CORREGIDA SIN DUPLICADOS
import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './context/AuthContext';

// Routes
import AppRoutes from './routes/AppRoutes';

// Components
import ErrorFallback from './components/common/ErrorFallback';

// Estilos
import './index.css';

// Componente LoadingSpinner inline para evitar conflictos
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando Hotel Paraíso...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Global Error:', error, errorInfo);
      }}
      onReset={() => window.location.reload()}
    >
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <div className="App">
              <AppRoutes />
              
              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    fontSize: '14px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10B981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;