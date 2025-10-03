// Debug component para diagnosticar problemas en reportes
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const ReportsDebug = () => {
  const { userInfo } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const info = {
        timestamp: new Date().toISOString(),
        userInfo: null,
        branchId: null,
        branchName: null,
        supabaseConnection: false,
        rpcTest: null,
        dashboardStatsRaw: null,
        dashboardStatsError: null,
        roomsCount: null,
        reservationsCount: null
      };

      try {
        // 1. Verificar userInfo
        console.log('🔍 UserInfo completo:', userInfo);
        info.userInfo = {
          id: userInfo?.id,
          email: userInfo?.email,
          role: userInfo?.role?.name,
          branches: userInfo?.user_branches?.length || 0
        };

        // 2. Obtener branchId
        const branchId = userInfo?.user_branches?.[0]?.branch_id;
        const branchName = userInfo?.user_branches?.[0]?.branch?.name;
        info.branchId = branchId;
        info.branchName = branchName;

        console.log('🏨 Branch ID:', branchId);
        console.log('🏨 Branch Name:', branchName);

        if (!branchId) {
          info.error = 'No se encontró branch_id en userInfo';
          setDebugInfo(info);
          setLoading(false);
          return;
        }

        // 3. Test conexión Supabase
        const { data: testConnection, error: connError } = await supabase
          .from('branches')
          .select('id, name')
          .limit(1);

        info.supabaseConnection = !connError;
        if (connError) {
          console.error('❌ Error de conexión Supabase:', connError);
          info.connectionError = connError.message;
        } else {
          console.log('✅ Conexión Supabase OK');
        }

        // 4. Test RPC get_dashboard_stats
        console.log('🧪 Probando RPC get_dashboard_stats con branchId:', branchId);

        const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats', {
          branch_uuid: branchId
        });

        console.log('📊 RPC Response:', rpcData);
        console.log('❌ RPC Error:', rpcError);

        info.rpcTest = {
          success: !rpcError,
          error: rpcError?.message,
          errorDetails: rpcError,
          data: rpcData,
          dataLength: Array.isArray(rpcData) ? rpcData.length : 'not array',
          firstItem: Array.isArray(rpcData) ? rpcData[0] : rpcData
        };

        if (rpcError) {
          console.error('❌ Error RPC get_dashboard_stats:', rpcError);
          info.dashboardStatsError = {
            message: rpcError.message,
            code: rpcError.code,
            details: rpcError.details,
            hint: rpcError.hint
          };
        } else {
          info.dashboardStatsRaw = rpcData;
          console.log('✅ Dashboard Stats:', rpcData);
        }

        // 5. Verificar si existe la función RPC
        const { data: functionsData, error: functionsError } = await supabase
          .rpc('get_dashboard_stats', { branch_uuid: branchId })
          .limit(1);

        // 6. Contar habitaciones directamente
        const { count: roomsCount, error: roomsError } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branchId);

        info.roomsCount = roomsCount;
        if (roomsError) {
          console.error('❌ Error contando rooms:', roomsError);
          info.roomsError = roomsError.message;
        } else {
          console.log('🛏️ Total rooms en branch:', roomsCount);
        }

        // 7. Contar reservaciones
        const { count: resCount, error: resError } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branchId);

        info.reservationsCount = resCount;
        if (resError) {
          console.error('❌ Error contando reservations:', resError);
        } else {
          console.log('📅 Total reservations:', resCount);
        }

        // 8. Verificar permisos RLS
        const { data: branchData, error: branchError } = await supabase
          .from('branches')
          .select('id, name, is_active')
          .eq('id', branchId)
          .single();

        info.branchAccess = {
          canRead: !branchError,
          error: branchError?.message,
          data: branchData
        };

      } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        info.globalError = error.message;
      }

      setDebugInfo(info);
      setLoading(false);
    };

    if (userInfo) {
      runDiagnostics();
    }
  }, [userInfo]);

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">🔍 Diagnóstico de Reportes</h2>
        <p>Ejecutando pruebas...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Reportes</h2>

      <div className="space-y-4">
        {/* User Info */}
        <Section title="1. Información del Usuario">
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(debugInfo.userInfo, null, 2)}
          </pre>
        </Section>

        {/* Branch Info */}
        <Section title="2. Información de Sucursal">
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Branch ID:</strong> {debugInfo.branchId || '❌ NO ENCONTRADO'}</p>
            <p><strong>Branch Name:</strong> {debugInfo.branchName || '❌ NO ENCONTRADO'}</p>
          </div>
        </Section>

        {/* Conexión Supabase */}
        <Section title="3. Conexión Supabase">
          <div className={`p-4 rounded ${debugInfo.supabaseConnection ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-bold">
              {debugInfo.supabaseConnection ? '✅ Conectado' : '❌ Error de conexión'}
            </p>
            {debugInfo.connectionError && (
              <p className="text-red-700 mt-2">{debugInfo.connectionError}</p>
            )}
          </div>
        </Section>

        {/* RPC Test */}
        <Section title="4. Prueba RPC get_dashboard_stats">
          <div className={`p-4 rounded ${debugInfo.rpcTest?.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-bold mb-2">
              {debugInfo.rpcTest?.success ? '✅ RPC Exitoso' : '❌ RPC Falló'}
            </p>
            {debugInfo.rpcTest?.error && (
              <div className="mt-2 bg-red-200 p-3 rounded">
                <p className="font-bold text-red-900">Error:</p>
                <p className="text-red-800">{debugInfo.rpcTest.error}</p>
                {debugInfo.dashboardStatsError && (
                  <pre className="mt-2 text-xs overflow-x-auto">
                    {JSON.stringify(debugInfo.dashboardStatsError, null, 2)}
                  </pre>
                )}
              </div>
            )}
            {debugInfo.rpcTest?.data && (
              <div className="mt-2">
                <p><strong>Data Type:</strong> {typeof debugInfo.rpcTest.data}</p>
                <p><strong>Data Length:</strong> {debugInfo.rpcTest.dataLength}</p>
                <pre className="bg-white p-3 rounded mt-2 overflow-x-auto text-xs">
                  {JSON.stringify(debugInfo.rpcTest.firstItem, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Section>

        {/* Datos directos */}
        <Section title="5. Verificación Directa de Datos">
          <div className="bg-gray-100 p-4 rounded space-y-2">
            <p>
              <strong>Total Habitaciones:</strong>
              {debugInfo.roomsCount !== null ? ` ${debugInfo.roomsCount}` : ' ❌ Error'}
            </p>
            <p>
              <strong>Total Reservaciones:</strong>
              {debugInfo.reservationsCount !== null ? ` ${debugInfo.reservationsCount}` : ' ❌ Error'}
            </p>
            {debugInfo.roomsError && (
              <p className="text-red-700 text-sm">{debugInfo.roomsError}</p>
            )}
          </div>
        </Section>

        {/* Acceso a Branch */}
        <Section title="6. Permisos de Acceso a Branch">
          <div className={`p-4 rounded ${debugInfo.branchAccess?.canRead ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-bold">
              {debugInfo.branchAccess?.canRead ? '✅ Acceso permitido' : '❌ Acceso denegado'}
            </p>
            {debugInfo.branchAccess?.error && (
              <p className="text-red-700 mt-2">{debugInfo.branchAccess.error}</p>
            )}
            {debugInfo.branchAccess?.data && (
              <pre className="bg-white p-2 rounded mt-2 text-xs">
                {JSON.stringify(debugInfo.branchAccess.data, null, 2)}
              </pre>
            )}
          </div>
        </Section>

        {/* Debug completo */}
        <Section title="7. Debug Completo (JSON)">
          <details>
            <summary className="cursor-pointer font-bold mb-2">Ver JSON completo</summary>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </Section>

        {/* Recomendaciones */}
        <Section title="8. Diagnóstico y Recomendaciones">
          <div className="bg-blue-50 p-4 rounded">
            {!debugInfo.branchId && (
              <p className="text-red-700 font-bold mb-2">
                ⚠️ PROBLEMA: No se encontró branch_id en el usuario
              </p>
            )}
            {debugInfo.branchId && !debugInfo.rpcTest?.success && (
              <div className="text-red-700">
                <p className="font-bold mb-2">⚠️ PROBLEMA: La función RPC get_dashboard_stats falló</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Verifica que la función existe en Supabase</li>
                  <li>Verifica los permisos de ejecución de la función</li>
                  <li>Revisa los logs de Supabase</li>
                  <li>Verifica que el branch_uuid sea válido</li>
                </ul>
              </div>
            )}
            {debugInfo.rpcTest?.success && (
              <p className="text-green-700 font-bold">
                ✅ Todo parece estar funcionando correctamente
              </p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
    {children}
  </div>
);

export default ReportsDebug;
