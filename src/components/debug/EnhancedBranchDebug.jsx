// src/components/debug/EnhancedBranchDebug.jsx - RASTREADOR AVANZADO
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Info, CheckCircle, X, Search, Zap } from 'lucide-react';

const EnhancedBranchDebug = () => {
  const [logs, setLogs] = useState([]);
  const [refreshCause, setRefreshCause] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [trackingEvents, setTrackingEvents] = useState(true);
  
  const refreshDetectedRef = useRef(false);
  const eventCountRef = useRef({
    clicks: 0,
    submits: 0,
    navigations: 0,
    stateChanges: 0
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!trackingEvents) return;

    // 🔍 RASTREADOR DE CLICKS GLOBALES
    const trackClick = (event) => {
      eventCountRef.current.clicks++;
      
      const target = event.target;
      const targetInfo = {
        tagName: target.tagName,
        type: target.type,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 50),
        hasForm: !!target.closest('form'),
        isButton: target.tagName === 'BUTTON',
        isLink: target.tagName === 'A',
        hasHref: !!target.href,
        hasOnClick: !!target.onclick
      };

      addLog('CLICK', `Click on ${target.tagName}`, targetInfo);

      // 🚨 DETECTAR CLICKS PELIGROSOS
      if (target.tagName === 'A' && target.href && !target.href.startsWith('#')) {
        addLog('WARNING', '⚠️ Link with href detected - potential cause of refresh!', {
          href: target.href,
          target: target.target
        });
        setRefreshCause({
          type: 'LINK_NAVIGATION',
          element: targetInfo,
          href: target.href
        });
      }

      if (target.tagName === 'BUTTON' && (!target.type || target.type === 'submit')) {
        const form = target.closest('form');
        if (form) {
          addLog('WARNING', '⚠️ Submit button in form - potential cause of refresh!', {
            formAction: form.action,
            formMethod: form.method,
            hasAction: !!form.action
          });
          setRefreshCause({
            type: 'FORM_SUBMIT',
            element: targetInfo,
            form: {
              action: form.action,
              method: form.method
            }
          });
        }
      }

      // Detectar clicks en elementos relacionados con branch switching
      if (target.textContent?.includes('Sucursal') || 
          target.className?.includes('branch') || 
          target.className?.includes('Branch')) {
        addLog('BRANCH', '🏢 Branch-related click detected', targetInfo);
      }
    };

    // 🔍 RASTREADOR DE FORMULARIOS
    const trackSubmit = (event) => {
      eventCountRef.current.submits++;
      
      const form = event.target;
      const formInfo = {
        action: form.action,
        method: form.method,
        elements: form.elements.length,
        hasPreventDefault: event.defaultPrevented
      };

      addLog('FORM', `Form submit ${event.defaultPrevented ? '(prevented)' : '(NOT prevented)'}`, formInfo);

      if (!event.defaultPrevented) {
        addLog('ERROR', '🚨 Form submit NOT prevented - this WILL cause refresh!', formInfo);
        setRefreshCause({
          type: 'FORM_SUBMIT_NOT_PREVENTED',
          form: formInfo
        });
      }
    };

    // 🔍 RASTREADOR DE NAVEGACIÓN
    const trackNavigation = (event) => {
      eventCountRef.current.navigations++;
      addLog('NAV', 'Navigation event', {
        url: window.location.href,
        type: event.type
      });
    };

    // 🔍 RASTREADOR DE POPSTATE (Back button)
    const trackPopState = (event) => {
      addLog('NAV', 'PopState (back/forward)', {
        state: event.state,
        url: window.location.href
      });
    };

    // 🔍 RASTREADOR DE ERRORES NO CAPTURADOS
    const trackError = (event) => {
      addLog('ERROR', `Uncaught error: ${event.error?.message || event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });

      setRefreshCause({
        type: 'UNCAUGHT_ERROR',
        error: {
          message: event.error?.message || event.message,
          filename: event.filename,
          line: event.lineno
        }
      });
    };

    // 🔍 RASTREADOR DE RECHAZOS DE PROMISES
    const trackUnhandledRejection = (event) => {
      addLog('ERROR', `Unhandled promise rejection: ${event.reason}`, {
        reason: event.reason,
        promise: event.promise
      });

      setRefreshCause({
        type: 'UNHANDLED_PROMISE_REJECTION',
        reason: event.reason?.toString()
      });
    };

    // 🔍 RASTREADOR DE BEFOREUNLOAD MEJORADO
    const trackBeforeUnload = (event) => {
      refreshDetectedRef.current = true;
      
      addLog('CRITICAL', '🚨 REFRESH/RELOAD INITIATED!', {
        timestamp: Date.now(),
        url: window.location.href,
        clickCount: eventCountRef.current.clicks,
        submitCount: eventCountRef.current.submits,
        lastCause: refreshCause
      });

      // Capturar stack trace del momento del refresh
      const stack = new Error().stack;
      addLog('CRITICAL', 'Stack trace at refresh:', { stack });

      console.error('🚨 PAGE REFRESH DETECTED - Stack trace:', stack);
      console.error('🚨 Event counts:', eventCountRef.current);
      console.error('🚨 Suspected cause:', refreshCause);
    };

    // Agregar event listeners
    document.addEventListener('click', trackClick, true); // Capture phase
    document.addEventListener('submit', trackSubmit, true);
    window.addEventListener('beforeunload', trackBeforeUnload);
    window.addEventListener('unload', trackNavigation);
    window.addEventListener('popstate', trackPopState);
    window.addEventListener('error', trackError);
    window.addEventListener('unhandledrejection', trackUnhandledRejection);

    return () => {
      document.removeEventListener('click', trackClick, true);
      document.removeEventListener('submit', trackSubmit, true);
      window.removeEventListener('beforeunload', trackBeforeUnload);
      window.removeEventListener('unload', trackNavigation);
      window.removeEventListener('popstate', trackPopState);
      window.removeEventListener('error', trackError);
      window.removeEventListener('unhandledrejection', trackUnhandledRejection);
    };
  }, [trackingEvents, refreshCause]);

  const addLog = (level, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-19), {
      id: Date.now() + Math.random(),
      timestamp,
      level,
      message,
      data: data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : data) : null
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
    setRefreshCause(null);
    refreshDetectedRef.current = false;
    eventCountRef.current = {
      clicks: 0,
      submits: 0,
      navigations: 0,
      stateChanges: 0
    };
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'CRITICAL': return <Zap className="w-4 h-4 text-red-600" />;
      case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'BRANCH': return <Search className="w-4 h-4 text-purple-500" />;
      case 'CLICK': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'FORM': return <Info className="w-4 h-4 text-orange-500" />;
      case 'NAV': return <Info className="w-4 h-4 text-indigo-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'border-l-red-600 bg-red-100 text-red-900';
      case 'ERROR': return 'border-l-red-500 bg-red-50 text-red-800';
      case 'WARNING': return 'border-l-yellow-500 bg-yellow-50 text-yellow-800';
      case 'BRANCH': return 'border-l-purple-500 bg-purple-50 text-purple-800';
      case 'CLICK': return 'border-l-blue-500 bg-blue-50 text-blue-800';
      case 'FORM': return 'border-l-orange-500 bg-orange-50 text-orange-800';
      case 'NAV': return 'border-l-indigo-500 bg-indigo-50 text-indigo-800';
      default: return 'border-l-gray-500 bg-gray-50 text-gray-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 w-[600px] max-h-[500px] bg-white border-2 border-red-300 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-red-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span className="font-bold">🚨 REFRESH DETECTOR</span>
          {refreshDetectedRef.current && (
            <span className="bg-yellow-400 text-red-900 px-2 py-1 rounded text-xs font-bold animate-pulse">
              REFRESH DETECTED!
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={trackingEvents}
              onChange={(e) => setTrackingEvents(e.target.checked)}
              className="mr-1"
            />
            Track
          </label>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suspected Cause */}
      {refreshCause && (
        <div className="p-3 bg-red-100 border-b-2 border-red-300">
          <div className="text-sm font-bold text-red-900 mb-2">
            🎯 SUSPECTED REFRESH CAUSE:
          </div>
          <div className="text-xs bg-white p-2 rounded border">
            <div className="font-bold text-red-800">{refreshCause.type}</div>
            <pre className="mt-1 text-red-700 overflow-x-auto">
              {JSON.stringify(refreshCause, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Event Counters */}
      <div className="p-2 bg-gray-100 border-b border-gray-300">
        <div className="grid grid-cols-4 gap-2 text-xs text-center">
          <div>
            <div className="font-bold text-blue-600">{eventCountRef.current.clicks}</div>
            <div>Clicks</div>
          </div>
          <div>
            <div className="font-bold text-orange-600">{eventCountRef.current.submits}</div>
            <div>Submits</div>
          </div>
          <div>
            <div className="font-bold text-indigo-600">{eventCountRef.current.navigations}</div>
            <div>Navigations</div>
          </div>
          <div>
            <div className="font-bold text-green-600">{logs.length}</div>
            <div>Logs</div>
          </div>
        </div>
      </div>

      {/* Event Logs */}
      <div className="max-h-80 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Rastreando eventos... Haz clic en cambiar sucursal.
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
                    <span className="font-bold">{log.level}</span>
                  </div>
                  <span className="text-gray-600 text-xs">{log.timestamp}</span>
                </div>
                <div className="font-medium mb-1">
                  {log.message}
                </div>
                {log.data && (
                  <div className="bg-white bg-opacity-70 p-1 rounded text-xs overflow-x-auto max-h-24">
                    <pre>{log.data}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-300 bg-gray-100 flex justify-between items-center">
        <div className="text-xs text-gray-600">
          Rastreando: {trackingEvents ? '✅ Activo' : '❌ Desactivado'}
        </div>
        <button
          onClick={clearLogs}
          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Clear All
        </button>
      </div>

      {/* Instructions */}
      <div className="p-2 bg-yellow-50 border-t border-yellow-300">
        <div className="text-xs text-yellow-800">
          <strong>🔍 Instrucciones:</strong> Haz clic en "Cambiar Sucursal" y observa qué evento aparece justo antes del refresh.
        </div>
      </div>
    </div>
  );
};

export default EnhancedBranchDebug;