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

-- PASO 4: Verificar columnas necesarias en guests
-- ============================================
-- Esta sección verifica que guests tenga las columnas correctas

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Verificar full_name
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guests'
    AND column_name = 'full_name'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE NOTICE '⚠️ La columna full_name no existe en guests';
    -- Intentar agregarla si no existe
    ALTER TABLE guests ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
  END IF;

  -- Verificar document_number
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guests'
    AND column_name = 'document_number'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE NOTICE '⚠️ La columna document_number no existe en guests';
    ALTER TABLE guests ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);
  END IF;

  -- Verificar document_type
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guests'
    AND column_name = 'document_type'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE NOTICE '⚠️ La columna document_type no existe en guests';
    ALTER TABLE guests ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) DEFAULT 'dni';
  END IF;

  -- Verificar phone
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guests'
    AND column_name = 'phone'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE NOTICE '⚠️ La columna phone no existe en guests';
    ALTER TABLE guests ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
  END IF;
END $$;

-- PASO 5: Datos de prueba (opcional)
-- ============================================
-- Crear un huésped de prueba para testing

INSERT INTO guests (full_name, document_type, document_number, phone)
VALUES ('Juan Pérez (PRUEBA)', 'DNI', '12345678', '+51 999 999 999')
ON CONFLICT (document_number) DO NOTHING;

-- PASO 6: Verificación Final
-- ============================================
DO $$
DECLARE
  guest_count INTEGER;
  status_count INTEGER;
BEGIN
  -- Contar huéspedes
  SELECT COUNT(*) INTO guest_count FROM guests;

  -- Contar estados de reservación
  SELECT COUNT(*) INTO status_count FROM reservation_status;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECCIONES APLICADAS EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTADÍSTICAS:';
  RAISE NOTICE '- Huéspedes en BD: %', guest_count;
  RAISE NOTICE '- Estados de reservación: %', status_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONFIGURACIONES:';
  RAISE NOTICE '1. Estados de reservación creados';
  RAISE NOTICE '2. Políticas RLS para guests configuradas';
  RAISE NOTICE '3. Políticas RLS para reservations configuradas';
  RAISE NOTICE '4. Columnas de guests verificadas';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 SIGUIENTE PASO:';
  RAISE NOTICE '1. Recarga la aplicación (F5)';
  RAISE NOTICE '2. Abre el modal de nueva reservación';
  RAISE NOTICE '3. Prueba buscar huéspedes existentes';
  RAISE NOTICE '4. Crea una nueva reservación';
  RAISE NOTICE '========================================';
END $$;
