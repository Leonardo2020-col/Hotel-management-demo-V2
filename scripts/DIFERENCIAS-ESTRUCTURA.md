# 🔧 CORRECCIONES APLICADAS AL SCRIPT SQL

## ⚠️ PROBLEMA ENCONTRADO

El script original (`reportes-migration.sql`) asumía columnas que **NO EXISTEN** en tu base de datos:

### Columnas que NO existen:
- ❌ `checkin_orders.branch_id`
- ❌ `checkout_orders.branch_id`
- ❌ `checkout_orders.total_amount`

### Columnas que SÍ existen:
- ✅ `checkin_orders.room_id` → Se obtiene branch_id desde rooms
- ✅ `checkout_orders.total_charges` (NO total_amount)
- ✅ `checkout_orders.checkin_order_id` → JOIN para obtener room_id → branch_id

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. **Función auxiliar creada:**
```sql
CREATE OR REPLACE FUNCTION get_room_branch(room_uuid UUID)
RETURNS UUID
```
Esta función obtiene el `branch_id` de una habitación.

### 2. **JOINs corregidos:**

#### ANTES (❌ INCORRECTO):
```sql
-- Esto fallaba porque branch_id no existe en checkin_orders
SELECT COUNT(*) FROM checkin_orders
WHERE branch_id = p_branch_id
AND DATE(checkin_date) = CURRENT_DATE;
```

#### AHORA (✅ CORRECTO):
```sql
-- JOIN con rooms para obtener branch_id
SELECT COUNT(DISTINCT ci.id)
FROM checkin_orders ci
JOIN rooms r ON ci.room_id = r.id
WHERE r.branch_id = p_branch_id
AND DATE(ci.check_in_time) = CURRENT_DATE;
```

### 3. **Columna total_charges (no total_amount):**

#### ANTES (❌ INCORRECTO):
```sql
SELECT SUM(total_amount) FROM checkout_orders
```

#### AHORA (✅ CORRECTO):
```sql
SELECT SUM(total_charges) FROM checkout_orders
```

### 4. **Nombres de columnas corregidos:**

| Tabla | Columna Incorrecta | Columna Correcta |
|-------|-------------------|------------------|
| `checkin_orders` | `checkin_date` | `check_in_time` |
| `checkout_orders` | `checkout_date` | `checkout_time` |
| `checkout_orders` | `total_amount` | `total_charges` |

---

## 📊 ESTRUCTURA REAL DE LAS TABLAS

### `checkin_orders`
```sql
- id UUID
- reservation_id UUID
- quick_checkin_id UUID
- room_id UUID ← Se usa para obtener branch_id
- guest_id UUID
- check_in_time TIMESTAMP ← NO checkin_date
- expected_checkout DATE
- actual_checkout TIMESTAMP
- key_cards_issued INTEGER
- deposit_amount DECIMAL
- processed_by UUID
- created_at TIMESTAMP
```

### `checkout_orders`
```sql
- id UUID
- checkin_order_id UUID ← JOIN para obtener room_id
- checkout_time TIMESTAMP ← NO checkout_date
- total_charges DECIMAL ← NO total_amount
- deposit_returned DECIMAL
- additional_charges JSONB
- room_condition TEXT
- key_cards_returned INTEGER
- processed_by UUID
- created_at TIMESTAMP
```

---

## 🔄 CAMBIOS EN LAS FUNCIONES

### `get_dashboard_stats_simple()`
- ✅ Ahora usa JOIN con rooms para obtener branch_id
- ✅ Usa `check_in_time` en lugar de `checkin_date`
- ✅ Usa `checkout_time` en lugar de `checkout_date`

### `calculate_revenue_simple()`
- ✅ Usa `total_charges` en lugar de `total_amount`
- ✅ JOIN correcto: checkout_orders → checkin_orders → rooms

### `generate_daily_report_simple()`
- ✅ Todas las queries con JOINs correctos
- ✅ Columnas con nombres correctos

---

## 🧪 CÓMO VERIFICAR

### 1. Ver estructura de tabla:
```sql
-- En Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'checkin_orders';
```

### 2. Probar la función:
```sql
-- Reemplaza con tu branch_id real
SELECT * FROM get_dashboard_stats_simple('123e4567-e89b-12d3-a456-426614174000');
```

### 3. Ver debug:
```sql
SELECT * FROM report_debug_view;
```

---

## ✅ ARCHIVOS A USAR

### ⚠️ IMPORTANTE:
- ✅ **USA:** `scripts/reportes-migration-fixed.sql`
- ❌ **NO USES:** `scripts/reportes-migration.sql`

El archivo `reportes-migration-fixed.sql` contiene todas las correcciones necesarias para trabajar con tu estructura real de base de datos.

---

## 📝 NOTAS ADICIONALES

1. **branch_id en checkin/checkout orders:**
   - No se agregó porque implicaría modificar la estructura existente
   - La solución con JOINs es más limpia y no requiere migrations

2. **Ingresos por servicios:**
   - Actualmente retorna 0 porque no hay tabla de servicios/snacks vinculada
   - Se puede ajustar cuando se implemente

3. **Vista de debug:**
   - Se agregó `report_debug_view` para facilitar troubleshooting
   - Muestra totales por branch de manera simple

---

## 🚀 SIGUIENTE PASO

Ejecuta `reportes-migration-fixed.sql` en Supabase SQL Editor.
