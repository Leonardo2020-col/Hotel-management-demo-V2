# 🔧 Solución: Problemas con Reservaciones

## 🐛 Problemas Identificados:

1. **Las nuevas reservaciones no se guardan**
2. **El modal no busca huéspedes existentes**

## ✅ Análisis del Código:

### 1. Búsqueda de Huéspedes (✅ FUNCIONA)

El servicio de búsqueda está correctamente implementado en `src/lib/supabase.js`:

```javascript
export const guestService = {
  async searchGuests(searchTerm, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit)
      // ...
    }
  }
}
```

**Estado:** ✅ Correcto

### 2. Hook useReservations (✅ FUNCIONA)

La función `searchGuests` está correctamente exportada:

```javascript
const searchGuests = async (searchTerm) => {
  if (!searchTerm?.trim()) {
    setSearchResults([])
    return []
  }

  try {
    const { data, error } = await guestService.searchGuests(searchTerm, 10)
    if (error) throw error

    setSearchResults(data || [])
    return data || []
  } catch (err) {
    console.error('Error buscando huéspedes:', err)
    setSearchResults([])
    return []
  }
}
```

**Estado:** ✅ Correcto

### 3. Creación de Reservaciones (⚠️ REVISAR)

El servicio de creación está implementado en `reservationService.createReservation`:

```javascript
async createReservation(reservationData, guestData) {
  // 1. Crear o encontrar huésped
  let guest = null
  if (guestData.id) {
    guest = { id: guestData.id }
  } else {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        full_name: guestData.fullName,
        phone: guestData.phone || '',
        document_type: guestData.documentType || 'dni',
        document_number: guestData.documentNumber
      })
      .select()
      .single()
    // ...
  }

  // 2. Crear reservación
  // ...
}
```

**Estado:** ⚠️ Requiere verificación

## 🔍 Posibles Causas del Problema:

### Causa 1: Tabla `reservation_status` sin datos

El código busca el estado "pendiente" en la tabla `reservation_status`:

```javascript
const { data: statusData, error: statusError } = await supabase
  .from('reservation_status')
  .select('id')
  .eq('status', 'pendiente')
  .single()
```

**Si esta tabla está vacía o no tiene el estado "pendiente", la reservación fallará.**

### Causa 2: RLS (Row Level Security) bloqueando inserts

Las políticas de seguridad podrían estar bloqueando la inserción de nuevas reservaciones.

### Causa 3: Foreign Keys inválidas

Los campos `branch_id`, `guest_id`, `room_id`, `status_id`, `created_by` deben existir en sus respectivas tablas.

## 🛠️ Soluciones:

### Solución 1: Crear Estados de Reservación

Ejecuta este SQL en Supabase:

```sql
-- Verificar si existen estados
SELECT * FROM reservation_status;

-- Si está vacía, insertar estados básicos
INSERT INTO reservation_status (status, color, description) VALUES
  ('pendiente', '#FCD34D', 'Reservación pendiente de confirmación'),
  ('confirmada', '#34D399', 'Reservación confirmada'),
  ('cancelada', '#EF4444', 'Reservación cancelada'),
  ('en_proceso', '#60A5FA', 'Check-in en proceso'),
  ('completada', '#9CA3AF', 'Reservación completada')
ON CONFLICT (status) DO NOTHING;
```

### Solución 2: Verificar Políticas RLS

```sql
-- Ver políticas actuales de reservations
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'reservations';

-- Crear política para permitir inserts a usuarios autenticados
DROP POLICY IF EXISTS "Users can insert reservations for their branch" ON reservations;
CREATE POLICY "Users can insert reservations for their branch"
ON reservations FOR INSERT
WITH CHECK (
  branch_id IN (
    SELECT ub.branch_id
    FROM user_branches ub
    WHERE ub.user_id = auth.uid()
  )
);

-- Permitir a usuarios autenticados insertar huéspedes
DROP POLICY IF EXISTS "Authenticated users can insert guests" ON guests;
CREATE POLICY "Authenticated users can insert guests"
ON guests FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

### Solución 3: Verificar Tabla de Huéspedes

```sql
-- Verificar estructura de guests
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guests'
ORDER BY ordinal_position;

-- Verificar si RLS está habilitada
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'guests';

-- Si RLS está habilitada, agregar política de lectura
DROP POLICY IF EXISTS "Users can view guests" ON guests;
CREATE POLICY "Users can view guests"
ON guests FOR SELECT
USING (true); -- Permitir a todos ver huéspedes
```

## 📝 Script Completo de Verificación y Corrección

Ejecuta este script en Supabase SQL Editor:

```sql
-- ============================================
-- SCRIPT DE CORRECCIÓN: SISTEMA DE RESERVACIONES
-- ============================================

-- PASO 1: Verificar y crear estados de reservación
-- ============================================
INSERT INTO reservation_status (status, color, description) VALUES
  ('pendiente', '#FCD34D', 'Reservación pendiente de confirmación'),
  ('confirmada', '#34D399', 'Reservación confirmada'),
  ('cancelada', '#EF4444', 'Reservación cancelada'),
  ('en_proceso', '#60A5FA', 'Check-in en proceso'),
  ('completada', '#9CA3AF', 'Reservación completada')
ON CONFLICT (status) DO NOTHING;

-- PASO 2: Políticas RLS para guests
-- ============================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT a todos los autenticados
DROP POLICY IF EXISTS "Authenticated users can view guests" ON guests;
CREATE POLICY "Authenticated users can view guests"
ON guests FOR SELECT
TO authenticated
USING (true);

-- Permitir INSERT a usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can insert guests" ON guests;
CREATE POLICY "Authenticated users can insert guests"
ON guests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE a usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can update guests" ON guests;
CREATE POLICY "Authenticated users can update guests"
ON guests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- PASO 3: Políticas RLS para reservations
-- ============================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Ver reservaciones de su sucursal
DROP POLICY IF EXISTS "Users can view reservations from their branch" ON reservations;
CREATE POLICY "Users can view reservations from their branch"
ON reservations FOR SELECT
TO authenticated
USING (
  branch_id IN (
    SELECT ub.branch_id
    FROM user_branches ub
    WHERE ub.user_id = auth.uid()
  )
);

-- Insertar reservaciones para su sucursal
DROP POLICY IF EXISTS "Users can insert reservations for their branch" ON reservations;
CREATE POLICY "Users can insert reservations for their branch"
ON reservations FOR INSERT
TO authenticated
WITH CHECK (
  branch_id IN (
    SELECT ub.branch_id
    FROM user_branches ub
    WHERE ub.user_id = auth.uid()
  )
);

-- Actualizar reservaciones de su sucursal
DROP POLICY IF EXISTS "Users can update reservations from their branch" ON reservations;
CREATE POLICY "Users can update reservations from their branch"
ON reservations FOR UPDATE
TO authenticated
USING (
  branch_id IN (
    SELECT ub.branch_id
    FROM user_branches ub
    WHERE ub.user_id = auth.uid()
  )
);

-- PASO 4: Verificación
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECCIONES APLICADAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Estados de reservación creados';
  RAISE NOTICE '2. Políticas RLS para guests configuradas';
  RAISE NOTICE '3. Políticas RLS para reservations configuradas';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 PRUEBAS RECOMENDADAS:';
  RAISE NOTICE '1. Buscar huésped existente en el modal';
  RAISE NOTICE '2. Crear nueva reservación con huésped nuevo';
  RAISE NOTICE '3. Crear nueva reservación con huésped existente';
  RAISE NOTICE '========================================';
END $$;
```

## 🧪 Cómo Probar:

### 1. Probar Búsqueda de Huéspedes

1. Abre el modal de nueva reservación
2. Ve al paso 2 (Huésped)
3. Click en "Huésped existente"
4. Escribe al menos 3 caracteres en el campo de búsqueda
5. **Deberían aparecer resultados** si hay huéspedes en la BD

### 2. Probar Creación de Reservación

1. Completa todos los pasos del modal
2. Click en "Crear Reservación"
3. **Deberías ver un toast de éxito** con el código de reservación
4. La reservación debería aparecer en la tabla

### 3. Verificar en Base de Datos

```sql
-- Ver últimas reservaciones creadas
SELECT
  r.reservation_code,
  r.check_in_date,
  r.check_out_date,
  g.full_name as guest_name,
  rm.room_number,
  s.status,
  r.created_at
FROM reservations r
JOIN guests g ON r.guest_id = g.id
JOIN rooms rm ON r.room_id = rm.id
JOIN reservation_status s ON r.status_id = s.id
ORDER BY r.created_at DESC
LIMIT 10;
```

## 🔍 Debugging

Si sigue sin funcionar, revisa la consola del navegador (F12) y busca:

```
❌ Error creando reservación: ...
```

El mensaje de error te dirá exactamente qué está fallando.

## ✨ Resumen

- ✅ El código de búsqueda de huéspedes está correcto
- ✅ El hook de reservaciones está correcto
- ⚠️ Falta verificar: Estados de reservación en la BD
- ⚠️ Falta verificar: Políticas RLS configuradas correctamente

**Ejecuta el script SQL de corrección y prueba de nuevo.**
