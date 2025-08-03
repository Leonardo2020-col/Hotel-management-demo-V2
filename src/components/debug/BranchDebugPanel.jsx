// src/components/debug/BranchDebugPanel.jsx - COMPONENTE TEMPORAL PARA DEBUG
import React, { useState, useEffect } from 'react';
import { Bug, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../hooks/useBranch';

const BranchDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const auth = useAuth();
  const branch = useBranch();

  // Interceptar console.log para capturar logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type, message) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev.slice(-49), { type, message: String(message), timestamp }]);
    };

    console.log = (...args) => {
      originalLog(...args);
      if (args.some(arg => String(arg).includes('Branch') || String(arg).includes('🔄') || String(arg).includes('✅') || String(arg).includes('❌'))) {
        addLog('log', args.join(' '));
      }
    };

    console.error = (...args) => {
      originalError(...args);
      if (args.some(arg => String(arg).includes('Branch') || String(arg).includes('Error'))) {
        addLog('error', args.join(' '));
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      if (args.some(arg => String(arg).includes('Branch'))) {
        addLog('warn', args.join(' '));
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 z-50"
        title="Mostrar Debug Panel"
      >
        <Bug className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-purple-600 text-white">
        <div className="flex items-center space-x-2">
          <Bug className="w-4 h-4" />
          <span className="text-sm font-medium">Branch Debug Panel</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-purple-700 rounded"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* State Info */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="space-y-1 text-xs">
          <div><strong>Auth Loading:</strong> {String(auth.loading)}</div>
          <div><strong>Branch Loading:</strong> {String(branch.branchesLoading)}</div>
          <div><strong>Selected Branch:</strong> {auth.selectedBranch?.name || 'None'}</div>
          <div><strong>Available Branches:</strong> {branch.availableBranches.length}</div>
          <div><strong>Can Change:</strong> {String(branch.canChangeBranch())}</div>
          <div><strong>Needs Selection:</strong> {String(auth.needsBranchSelection)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setLogs([])}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Clear Logs
          </button>
          <button
            onClick={() => console.log('🔍 Manual debug log')}
            className="px-2 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded"
          >
            Test Log
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="max-h-48 overflow-y-auto p-3">
        <div className="space-y-1">
          {logs.length === 0 ? (
            <p className="text-xs text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded ${
                  log.type === 'error' 
                    ? 'bg-red-100 text-red-800' 
                    : log.type === 'warn'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="font-mono text-xs opacity-75">{log.timestamp}</div>
                <div className="break-words">{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-100 text-center">
        <p className="text-xs text-gray-600">Debug Panel - Remove in production</p>
      </div>
    </div>
  );
};

export default BranchDebugPanel;