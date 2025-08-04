// src/components/debug/BranchSwitcherDebug.jsx - COMPONENTE DE DEBUG
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../hooks/useBranch';

const BranchSwitcherDebug = () => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const { selectedBranch, user, loading: authLoading } = useAuth();
  const { 
    availableBranches, 
    branchesLoading, 
    loading: branchLoading 
  } = useBranch();

  useEffect(() => {
    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    // Interceptar console.log para capturar logs relacionados con branches
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const logInterceptor = (level, ...args) => {
      const message = args.join(' ');
      if (message.includes('branch') || message.includes('Branch') || message.includes('🏢')) {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-9), {
          id: Date.now(),
          timestamp,
          level,
          message,
          args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)
        }]);
      }
      
      // Llamar al método original
      if (level === 'log') originalLog(...args);
      else if (level === 'error') originalError(...args);
      else if (level === 'warn') originalWarn(...args);
    };

    console.log = (...args) => logInterceptor('log', ...args);
    console.error = (...args) => logInterceptor('error', ...args);
    console.warn = (...args) => logInterceptor('warn', ...args);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Detectar reloads/refreshes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      console.error('🚨 PAGE REFRESH DETECTED - This should not happen during branch switching!');
      event.preventDefault();
      event.returnValue = '';
    };

    const handleUnload = () => {
      console.error('🚨 PAGE UNLOAD DETECTED');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn('📱 Page became hidden');
      } else {
        console.log('👁️ Page became visible');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'warn': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Branch Debug Monitor</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">User:</span> {user?.name || 'None'}
          </div>
          <div>
            <span className="font-medium">Role:</span> {user?.role || 'None'}
          </div>
          <div>
            <span className="font-medium">Selected:</span> {selectedBranch?.name || 'None'}
          </div>
          <div>
            <span className="font-medium">Available:</span> {availableBranches?.length || 0}
          </div>
          <div className="col-span-2 flex space-x-4">
            <div className={`flex items-center space-x-1 ${authLoading ? 'text-yellow-600' : 'text-green-600'}`}>
              <div className={`w-2 h-2 rounded-full ${authLoading ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
              <span>Auth: {authLoading ? 'Loading' : 'Ready'}</span>
            </div>
            <div className={`flex items-center space-x-1 ${branchesLoading ? 'text-yellow-600' : 'text-green-600'}`}>
              <div className={`w-2 h-2 rounded-full ${branchesLoading ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
              <span>Branches: {branchesLoading ? 'Loading' : 'Ready'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Esperando logs de cambio de sucursal...
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`border-l-4 p-2 rounded-r text-xs ${getLevelColor(log.level)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    {getLevelIcon(log.level)}
                    <span className="font-medium">{log.level.toUpperCase()}</span>
                  </div>
                  <span className="text-gray-500">{log.timestamp}</span>
                </div>
                <div className="text-gray-800">
                  {log.message}
                </div>
                {log.args.length > 1 && (
                  <div className="mt-1 text-gray-600 bg-white bg-opacity-50 p-1 rounded text-xs overflow-x-auto">
                    <pre>{log.args.slice(1).join('\n')}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {logs.length} logs captured
          </span>
          <button
            onClick={clearLogs}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="p-2 bg-yellow-50 border-t border-yellow-200">
        <div className="flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-yellow-600" />
          <span className="text-xs text-yellow-800">
            Si ves "PAGE REFRESH DETECTED", hay un problema con el cambio de sucursal
          </span>
        </div>
      </div>
    </div>
  );
};

export default BranchSwitcherDebug;