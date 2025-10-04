# 🚀 SISTEMA DE REPORTES V2 - INSTRUCCIONES DE INSTALACIÓN

## 📋 RESUMEN
He creado un sistema de reportes completamente nuevo, simplificado y funcional desde cero.

---

## ⚙️ PASO 1: EJECUTAR MIGRACIÓN SQL EN SUPABASE

### 1.1. Accede a Supabase Dashboard
```
https://app.supabase.com
```

### 1.2. Ve a SQL Editor
- Click en "SQL Editor" en el menú lateral
- Click en "+ New query"

### 1.3. Copia y Ejecuta el Script CORREGIDO ⚠️
Abre el archivo: `scripts/reportes-migration-fixed.sql`

**IMPORTANTE: USA `reportes-migration-fixed.sql` NO `reportes-migration.sql`**

Copia TODO el contenido y pégalo en el SQL Editor de Supabase.

**NOTA:** Este script está corregido para la estructura real de tu base de datos.

### 1.4. Ejecuta el Script
- Click en "RUN" o presiona `Ctrl + Enter`
- Espera a que termine (debería mostrar "Success" y mensajes de confirmación)

### 1.5. Verifica la Instalación
Deberías ver estos mensajes en la consola:
```
✅ Migración completada exitosamente
📊 Vista: dashboard_stats_view
🔧 Función: get_dashboard_stats_simple(branch_id)
💰 Función: calculate_revenue_simple(branch_id, start_date, end_date)
📅 Función: generate_daily_report_simple(branch_id, date, user_id)
📋 Tabla: daily_reports
```

---

## 📂 PASO 2: VERIFICAR ARCHIVOS CREADOS

He creado los siguientes archivos nuevos:

### Archivos Creados:
1. ✅ `scripts/reportes-migration-fixed.sql` - Script SQL corregido ⚠️ **USA ESTE**
2. ✅ `src/services/reportsService.js` - Servicio de reportes
3. ✅ `src/hooks/useReportsNew.js` - Hook personalizado
4. ✅ `src/pages/ReportsPageNew.jsx` - Página de reportes nueva
5. ✅ `src/debug/ReportsDebug.jsx` - Herramienta de diagnóstico

### Archivos Modificados:
1. ✅ `src/App.js` - Ruta actualizada a ReportsPageNew

---

## 🧪 PASO 3: PROBAR EL SISTEMA

### 3.1. Reinicia el Servidor de Desarrollo
```bash
# Detén el servidor actual (Ctrl + C)
# Reinicia
npm start
```

### 3.2. Accede a Reportes
```
http://localhost:3000/reports
```

### 3.3. Verifica que Funcione
Deberías ver:
- ✅ 4 tarjetas de estadísticas en Dashboard
- ✅ Tabs: Dashboard, Ingresos, Gastos, Reportes Diarios
- ✅ Datos cargando correctamente
- ✅ Sin errores en consola

---

## 🔍 PASO 4: DIAGNÓSTICO (SI HAY PROBLEMAS)

### 4.1. Herramienta de Diagnóstico
Si algo no funciona, accede a:
```
http://localhost:3000/debug/reports
```

Esta herramienta te mostrará:
- Estado de la conexión a Supabase
- Si las funciones SQL están instaladas
- Permisos de acceso
- Datos de la sucursal
- Errores específicos

### 4.2. Consola del Navegador (F12)
Busca logs con estos prefijos:
```
📊 [Reports Service] ...
✅ [Reports Service] ...
❌ [Reports Service] ...
```

---

## 📊 FUNCIONALIDADES DEL NUEVO SISTEMA

### Dashboard
- ✅ Tasa de ocupación en tiempo real
- ✅ Habitaciones disponibles
- ✅ Check-ins de hoy
- ✅ Reservas pendientes

### Reporte de Ingresos
- ✅ Ingresos por habitaciones
- ✅ Ingresos por servicios
- ✅ Total de gastos
- ✅ Ganancia neta

### Reporte de Gastos
- ✅ Lista detallada de gastos
- ✅ Total y promedio
- ✅ Categorías
- ✅ Exportación a CSV

### Reportes Diarios
- ✅ Resumen por día
- ✅ Check-ins y check-outs
- ✅ Ingresos y gastos
- ✅ Tasa de ocupación
- ✅ Generación automática

---

## 🔧 FUNCIONES SQL CREADAS

### 1. `get_dashboard_stats_simple(branch_id)`
Retorna estadísticas del dashboard:
```sql
SELECT * FROM get_dashboard_stats_simple('tu-branch-id');
```

### 2. `calculate_revenue_simple(branch_id, start_date, end_date)`
Calcula ingresos por período:
```sql
SELECT * FROM calculate_revenue_simple(
  'tu-branch-id',
  '2025-01-01',
  '2025-01-31'
);
```

### 3. `generate_daily_report_simple(branch_id, report_date, user_id)`
Genera reporte diario:
```sql
SELECT generate_daily_report_simple(
  'tu-branch-id',
  CURRENT_DATE,
  'tu-user-id'
);
```

---

## 🗄️ TABLA CREADA

### `daily_reports`
Almacena reportes diarios generados:
- branch_id
- report_date
- total_checkins
- total_checkouts
- total_revenue
- total_expenses
- occupancy_rate
- available_rooms
- occupied_rooms
- maintenance_rooms

---

## ⚠️ SOLUCIÓN DE PROBLEMAS COMUNES

### Problema 1: "No muestra estadísticas"
**Solución:**
1. Verifica que el script SQL se ejecutó completamente
2. Accede a `/debug/reports` para ver el diagnóstico
3. Verifica que tu usuario tenga una sucursal asignada

### Problema 2: "Error: function does not exist"
**Solución:**
1. Vuelve a ejecutar el script SQL completo
2. Verifica en Supabase → Database → Functions si aparecen las 3 funciones

### Problema 3: "Permission denied"
**Solución:**
1. El script incluye GRANT EXECUTE para authenticated
2. Verifica que estés logueado correctamente
3. Verifica las RLS policies de la tabla daily_reports

### Problema 4: "No hay datos"
**Solución:**
1. Verifica que existan habitaciones en la tabla `rooms`
2. Verifica que las habitaciones tengan `branch_id` correcto
3. Verifica que exista la tabla `room_status` con estados

---

## 🎯 DIFERENCIAS CON EL SISTEMA ANTERIOR

### Sistema Anterior (Problemas):
- ❌ Dependía de función RPC compleja
- ❌ No tenía fallback
- ❌ Errores no manejados
- ❌ Logs poco claros

### Sistema Nuevo (Ventajas):
- ✅ Funciones SQL simplificadas
- ✅ Servicio dedicado con logs claros
- ✅ Manejo robusto de errores
- ✅ Herramienta de diagnóstico incluida
- ✅ Exportación a CSV
- ✅ Código limpio y documentado

---

## 📝 RUTAS DISPONIBLES

```
/reports           → Nuevo sistema de reportes
/reports-old       → Sistema anterior (temporal)
/debug/reports     → Herramienta de diagnóstico
```

---

## 🚀 DESPLIEGUE A VERCEL

### Variables de Entorno Necesarias:
Asegúrate de que estén configuradas en Vercel:
```
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-clave-anonima
```

### Deploy:
```bash
# Commit y push
git add .
git commit -m "feat: nuevo sistema de reportes v2"
git push

# Vercel desplegará automáticamente
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Script SQL ejecutado en Supabase
- [ ] 3 funciones creadas (get_dashboard_stats_simple, calculate_revenue_simple, generate_daily_report_simple)
- [ ] Tabla daily_reports creada
- [ ] Permisos GRANT EXECUTE otorgados
- [ ] RLS policies configuradas
- [ ] Servidor dev reiniciado
- [ ] `/reports` carga correctamente
- [ ] Dashboard muestra estadísticas
- [ ] Logs en consola son claros
- [ ] Exportación CSV funciona
- [ ] Reportes diarios se generan

---

## 📞 SOPORTE

Si después de seguir todos los pasos aún hay problemas:

1. Ejecuta el diagnóstico: `/debug/reports`
2. Copia el output completo del diagnóstico
3. Copia los logs de la consola del navegador (F12)
4. Verifica en Supabase → Database → Functions que las 3 funciones existan

---

## 🎉 ¡LISTO!

Tu nuevo sistema de reportes V2 está configurado y listo para usar.

**Accede a:** `http://localhost:3000/reports` 🚀
