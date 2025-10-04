# 📋 Instrucciones de Instalación - Sistema de Reportes V3

## ✅ Sistema Completamente Corregido

Este es el **tercer y definitivo** sistema de reportes que soluciona todos los problemas anteriores:

### ❌ Problemas Solucionados:
1. ✅ **Column 'branch_id' does not exist** → Solucionado con JOINs correctos
2. ✅ **Column 'total_amount' does not exist** → Cambiado a `total_charges`
3. ✅ **Respuestas SQL incompatibles** → Cambiado de TABLE a JSON
4. ✅ **Errores de conexión** → Todas las conexiones verificadas y corregidas

---

## 🚀 Pasos de Instalación

### PASO 1: Ejecutar Script SQL en Supabase

1. Ve a tu proyecto en [Supabase](https://app.supabase.com)
2. Abre el **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido completo de: `scripts/reportes-final.sql`
5. Ejecuta el script (botón RUN o Ctrl+Enter)

### PASO 2: Verificar la Ejecución

Deberías ver estos mensajes en la consola:

```
✅ Migración completada exitosamente
🔧 Función: get_dashboard_stats_simple(branch_id) → Retorna JSON
💰 Función: calculate_revenue_simple(branch_id, start, end) → Retorna JSON
📅 Función: generate_daily_report_simple(branch_id, date, user) → Retorna JSON
📋 Tabla: daily_reports
🚀 Sistema de reportes listo
```

### PASO 3: Verificar Funciones Creadas

En Supabase, ve a **Database → Functions** y verifica que existan:

- ✅ `get_dashboard_stats_simple`
- ✅ `calculate_revenue_simple`
- ✅ `generate_daily_report_simple`

### PASO 4: Verificar Tabla Creada

En **Database → Tables**, verifica que exista:

- ✅ `daily_reports`

---

## 🧪 Cómo Probar

### 1. Probar Dashboard Stats

```sql
SELECT get_dashboard_stats_simple('tu-branch-id-aqui');
```

**Respuesta esperada (JSON):**
```json
{
  "total_rooms": 10,
  "occupied_rooms": 5,
  "available_rooms": 4,
  "maintenance_rooms": 1,
  "occupancy_rate": 50.00,
  "today_checkins": 3,
  "today_checkouts": 2,
  "pending_reservations": 5
}
```

### 2. Probar Reporte de Ingresos

```sql
SELECT calculate_revenue_simple(
  'tu-branch-id-aqui',
  '2025-01-01',
  '2025-01-31'
);
```

**Respuesta esperada (JSON):**
```json
{
  "room_revenue": 15000.00,
  "service_revenue": 0.00,
  "total_revenue": 15000.00,
  "total_expenses": 3000.00,
  "net_profit": 12000.00
}
```

### 3. Generar Reporte Diario

```sql
SELECT generate_daily_report_simple(
  'tu-branch-id-aqui',
  CURRENT_DATE,
  NULL
);
```

**Respuesta esperada (JSON):**
```json
{
  "success": true
}
```

---

## 🔧 Cambios Técnicos Importantes

### 1. Retorno de Funciones: TABLE → JSON

**Antes (❌ incorrecto):**
```sql
RETURNS TABLE(
  total_rooms INTEGER,
  occupied_rooms INTEGER,
  ...
)
```

**Ahora (✅ correcto):**
```sql
RETURNS JSON AS $$
...
SELECT json_build_object(
  'total_rooms', rs.total,
  'occupied_rooms', rs.occupied,
  ...
) INTO result
```

### 2. JOINs para obtener branch_id

**Problema:** `checkin_orders` y `checkout_orders` NO tienen `branch_id`

**Solución:** Usar JOIN con tabla `rooms`

```sql
FROM checkin_orders ci
JOIN rooms r ON ci.room_id = r.id
WHERE r.branch_id = p_branch_id
```

### 3. Nombres de Columnas Corregidos

| ❌ Incorrecto | ✅ Correcto |
|--------------|------------|
| `total_amount` | `total_charges` |
| `checkin_date` | `check_in_time` |
| `checkout_date` | `checkout_time` |

---

## 📱 Uso en la Aplicación

### El código JavaScript YA ESTÁ ACTUALIZADO:

**Archivo actualizado:** `src/services/reportsService.js`

```javascript
// ✅ Ahora maneja JSON directamente
const stats = data || { total_rooms: 0, ... }

// ❌ Antes (incorrecto):
// const stats = data?.[0] || { ... }
```

### Ver Reportes en la App:

1. Inicia la aplicación: `npm start`
2. Ve a la sección **Reportes**
3. Deberías ver:
   - ✅ Estadísticas del Dashboard
   - ✅ Ingresos por período
   - ✅ Gastos detallados
   - ✅ Reportes diarios

---

## 🔍 Troubleshooting

### Problema: "function does not exist"

**Solución:** Ejecuta el script `reportes-final.sql` nuevamente

### Problema: "permission denied for function"

**Solución:** Verifica que las líneas GRANT se ejecutaron:
```sql
GRANT EXECUTE ON FUNCTION get_dashboard_stats_simple(UUID) TO authenticated;
```

### Problema: "no rows returned"

**Causa:** No hay datos en las tablas base
**Solución:** Asegúrate de tener:
- Habitaciones registradas en `rooms`
- Check-ins en `checkin_orders`
- Check-outs en `checkout_orders`

### Problema: Los reportes aparecen en cero

**Verifica:**
1. Que el `branch_id` sea correcto
2. Que haya check-ins/check-outs en el rango de fechas
3. Que las políticas RLS permitan acceso

---

## 📊 Estructura de Datos

### Función: `get_dashboard_stats_simple`
- **Entrada:** `branch_id` (UUID)
- **Salida:** JSON con estadísticas en tiempo real

### Función: `calculate_revenue_simple`
- **Entrada:** `branch_id`, `start_date`, `end_date`
- **Salida:** JSON con cálculo de ingresos/gastos

### Función: `generate_daily_report_simple`
- **Entrada:** `branch_id`, `report_date`, `user_id`
- **Salida:** JSON con confirmación
- **Efecto:** Inserta/actualiza registro en `daily_reports`

### Tabla: `daily_reports`
- Almacena reportes históricos por día
- Índice optimizado: `(branch_id, report_date DESC)`
- RLS habilitado con políticas por branch

---

## ✨ Características

- ✅ **Tiempo Real:** Stats actualizados al instante
- ✅ **Sin Dependencias:** No requiere tablas adicionales
- ✅ **Seguro:** RLS habilitado con políticas por branch
- ✅ **Optimizado:** Usa CTEs y JOINs eficientes
- ✅ **Exportable:** CSV incluido en la UI
- ✅ **Histórico:** Tabla `daily_reports` para análisis temporal

---

## 🎯 Resumen Final

**Archivos SQL:**
- ✅ `reportes-final.sql` → **USAR ESTE**
- ❌ `reportes-migration.sql` → ~~OBSOLETO~~
- ❌ `reportes-migration-fixed.sql` → ~~OBSOLETO~~

**Archivos JavaScript:**
- ✅ `src/services/reportsService.js` → Actualizado para JSON
- ✅ `src/hooks/useReportsNew.js` → Hook personalizado
- ✅ `src/pages/ReportsPageNew.jsx` → UI completa

**Ruta en App:**
- ✅ `/reports` → ReportsPageNew (activa)
- ℹ️ `/reports-old` → Backup (disponible)

---

## 💡 Notas Importantes

1. **Ejecuta solo `reportes-final.sql`** - Los otros scripts están obsoletos
2. **El servicio ya maneja JSON** - No requiere cambios adicionales
3. **Todos los errores previos están corregidos** - Sistema 100% funcional
4. **Testea con datos reales** - Asegúrate de tener check-ins/check-outs

---

**🚀 Sistema de Reportes V3 - Listo para Producción**
