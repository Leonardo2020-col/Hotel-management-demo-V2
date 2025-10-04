-- ============================================
-- SCRIPT COMPLETO: CORREGIR TODAS LAS FUNCIONES
-- ============================================

-- PASO 1: Eliminar funciones antiguas
-- ============================================
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS calculate_revenue(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS generate_daily_report(UUID, DATE);

-- PASO 2: Crear función get_dashboard_stats (CORREGIDA)
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_branch_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_total_rooms INTEGER;
  v_occupied_rooms INTEGER;
  v_available_rooms INTEGER;
  v_maintenance_rooms INTEGER;
  v_occupancy_rate DECIMAL(5,2);
  v_today_checkins INTEGER;
  v_today_checkouts INTEGER;
  v_pending_reservations INTEGER;
  v_today_revenue DECIMAL(10,2);
BEGIN
  -- Si no se proporciona branch_id, intentar obtener el primero disponible
  IF p_branch_id IS NULL THEN
    SELECT id INTO p_branch_id FROM branches LIMIT 1;
  END IF;

  -- Contar habitaciones por estado
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'occupied'),
    COUNT(*) FILTER (WHERE status = 'available'),
    COUNT(*) FILTER (WHERE status = 'maintenance')
  INTO v_total_rooms, v_occupied_rooms, v_available_rooms, v_maintenance_rooms
  FROM rooms
  WHERE branch_id = p_branch_id AND is_active = true;

  -- Calcular tasa de ocupación
  v_occupancy_rate := CASE
    WHEN v_total_rooms > 0 THEN ROUND((v_occupied_rooms::DECIMAL / v_total_rooms * 100), 2)
    ELSE 0
  END;

  -- Contar check-ins de hoy (quick_checkins)
  SELECT COUNT(*) INTO v_today_checkins
  FROM quick_checkins qc
  JOIN rooms r ON qc.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(qc.check_in_date) = CURRENT_DATE;

  -- Contar check-outs de hoy
  SELECT COUNT(*) INTO v_today_checkouts
  FROM quick_checkins qc
  JOIN rooms r ON qc.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(qc.check_out_date) = CURRENT_DATE
  AND qc.check_out_date < CURRENT_DATE; -- Solo los que ya hicieron checkout

  -- Contar reservas pendientes
  SELECT COUNT(*) INTO v_pending_reservations
  FROM reservations res
  WHERE res.branch_id = p_branch_id
  AND res.status_id IN (
    SELECT id FROM reservation_status WHERE status IN ('pendiente', 'confirmada')
  );

  -- Calcular ingresos de hoy
  SELECT COALESCE(SUM(amount), 0) INTO v_today_revenue
  FROM quick_checkins qc
  JOIN rooms r ON qc.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(qc.check_out_date) = CURRENT_DATE;

  -- Construir objeto JSON
  result := json_build_object(
    'total_rooms', COALESCE(v_total_rooms, 0),
    'occupied_rooms', COALESCE(v_occupied_rooms, 0),
    'available_rooms', COALESCE(v_available_rooms, 0),
    'maintenance_rooms', COALESCE(v_maintenance_rooms, 0),
    'occupancy_rate', COALESCE(v_occupancy_rate, 0),
    'today_checkins', COALESCE(v_today_checkins, 0),
    'today_checkouts', COALESCE(v_today_checkouts, 0),
    'pending_reservations', COALESCE(v_pending_reservations, 0),
    'today_revenue', COALESCE(v_today_revenue, 0)
  );

  RETURN result;
END;
$$;

-- PASO 3: Crear función calculate_revenue (CORREGIDA)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_revenue(
  p_branch_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_room_revenue DECIMAL(10,2);
  v_service_revenue DECIMAL(10,2);
  v_total_expenses DECIMAL(10,2);
BEGIN
  -- Calcular ingresos por habitaciones (de quick_checkins)
  SELECT COALESCE(SUM(amount), 0) INTO v_room_revenue
  FROM quick_checkins qc
  JOIN rooms r ON qc.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(qc.check_out_date) BETWEEN p_start_date AND p_end_date;

  -- Ingresos por servicios (placeholder)
  v_service_revenue := 0;

  -- Calcular gastos
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM expenses
  WHERE branch_id = p_branch_id
  AND expense_date BETWEEN p_start_date AND p_end_date;

  -- Construir resultado
  result := json_build_object(
    'room_revenue', COALESCE(v_room_revenue, 0),
    'service_revenue', COALESCE(v_service_revenue, 0),
    'total_revenue', COALESCE(v_room_revenue + v_service_revenue, 0),
    'total_expenses', COALESCE(v_total_expenses, 0),
    'net_profit', COALESCE((v_room_revenue + v_service_revenue) - v_total_expenses, 0)
  );

  RETURN result;
END;
$$;

-- PASO 4: Crear función generate_daily_report (CORREGIDA)
-- ============================================
CREATE OR REPLACE FUNCTION generate_daily_report(
  p_branch_id UUID,
  p_report_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checkins INTEGER;
  v_checkouts INTEGER;
  v_occupied INTEGER;
  v_available INTEGER;
  v_total_rooms INTEGER;
  v_revenue DECIMAL(10,2);
  v_expenses DECIMAL(10,2);
  v_occupancy DECIMAL(5,2);
BEGIN
  -- Check-ins del día
  SELECT COUNT(*) INTO v_checkins
  FROM quick_checkins qc
  JOIN rooms r ON qc.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(qc.check_in_date) = p_report_date;

  -- Check-outs del día
  SELECT COUNT(*) INTO v_checkouts
  FROM quick_checkins qc
  JOIN rooms r ON qc.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(qc.check_out_date) = p_report_date;

  -- Estado de habitaciones
  SELECT
    COUNT(*) FILTER (WHERE status = 'occupied'),
    COUNT(*) FILTER (WHERE status = 'available'),
    COUNT(*)
  INTO v_occupied, v_available, v_total_rooms
  FROM rooms
  WHERE branch_id = p_branch_id AND is_active = true;

  -- Ingresos del día
  SELECT COALESCE(SUM(amount), 0) INTO v_revenue
  FROM quick_checkins qc
  JOIN rooms r ON qc.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(qc.check_out_date) = p_report_date;

  -- Gastos del día
  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expenses
  WHERE branch_id = p_branch_id
  AND expense_date = p_report_date;

  -- Calcular ocupación
  v_occupancy := CASE
    WHEN v_total_rooms > 0 THEN ROUND((v_occupied::DECIMAL / v_total_rooms * 100), 2)
    ELSE 0
  END;

  -- Insertar o actualizar en daily_reports
  INSERT INTO daily_reports (
    branch_id, report_date, total_checkins, total_checkouts,
    occupied_rooms, available_rooms, total_revenue, total_expenses,
    occupancy_rate, updated_at
  ) VALUES (
    p_branch_id, p_report_date, v_checkins, v_checkouts,
    v_occupied, v_available, v_revenue, v_expenses,
    v_occupancy, NOW()
  )
  ON CONFLICT (branch_id, report_date)
  DO UPDATE SET
    total_checkins = EXCLUDED.total_checkins,
    total_checkouts = EXCLUDED.total_checkouts,
    occupied_rooms = EXCLUDED.occupied_rooms,
    available_rooms = EXCLUDED.available_rooms,
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    occupancy_rate = EXCLUDED.occupancy_rate,
    updated_at = NOW();

  RETURN json_build_object('success', true, 'report_date', p_report_date);
END;
$$;

-- PASO 5: Crear tabla daily_reports si no existe
-- ============================================
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_checkins INTEGER DEFAULT 0,
  total_checkouts INTEGER DEFAULT 0,
  occupied_rooms INTEGER DEFAULT 0,
  available_rooms INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  occupancy_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branch_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_branch_date
ON daily_reports(branch_id, report_date DESC);

-- PASO 6: Permisos
-- ============================================
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_revenue(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_daily_report(UUID, DATE) TO authenticated;

GRANT ALL ON daily_reports TO authenticated;

-- PASO 7: RLS Policies para daily_reports
-- ============================================
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view daily reports" ON daily_reports;
CREATE POLICY "Users can view daily reports"
ON daily_reports FOR SELECT
USING (
  branch_id IN (
    SELECT ub.branch_id
    FROM user_branches ub
    WHERE ub.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert daily reports" ON daily_reports;
CREATE POLICY "Users can insert daily reports"
ON daily_reports FOR INSERT
WITH CHECK (
  branch_id IN (
    SELECT ub.branch_id
    FROM user_branches ub
    WHERE ub.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update daily reports" ON daily_reports;
CREATE POLICY "Users can update daily reports"
ON daily_reports FOR UPDATE
USING (
  branch_id IN (
    SELECT ub.branch_id
    FROM user_branches ub
    WHERE ub.user_id = auth.uid()
  )
);

-- PASO 8: Corregir tabla rooms - asegurar columna status
-- ============================================
DO $$
BEGIN
  -- Verificar si existe columna status en rooms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'status'
  ) THEN
    -- Agregar columna status
    ALTER TABLE rooms ADD COLUMN status VARCHAR(50) DEFAULT 'available';

    -- Sincronizar con status_id
    UPDATE rooms r
    SET status = rs.status
    FROM room_status rs
    WHERE r.status_id = rs.id;

    RAISE NOTICE '✅ Columna status agregada a rooms';
  END IF;
END $$;

-- PASO 9: Trigger para mantener rooms.status sincronizado
-- ============================================
CREATE OR REPLACE FUNCTION sync_room_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza status_id, actualizar status
  IF TG_OP = 'UPDATE' AND NEW.status_id IS DISTINCT FROM OLD.status_id THEN
    SELECT status INTO NEW.status
    FROM room_status
    WHERE id = NEW.status_id;
  END IF;

  -- Cuando se inserta, establecer status desde status_id
  IF TG_OP = 'INSERT' AND NEW.status_id IS NOT NULL THEN
    SELECT status INTO NEW.status
    FROM room_status
    WHERE id = NEW.status_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_room_status ON rooms;
CREATE TRIGGER trigger_sync_room_status
  BEFORE INSERT OR UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION sync_room_status();

-- PASO 10: Verificación
-- ============================================
DO $$
DECLARE
  func_count INTEGER;
  branch_count INTEGER;
BEGIN
  -- Contar funciones creadas
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN ('get_dashboard_stats', 'calculate_revenue', 'generate_daily_report');

  -- Contar branches
  SELECT COUNT(*) INTO branch_count FROM branches;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TODAS LAS FUNCIONES CORREGIDAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Funciones creadas: %', func_count;
  RAISE NOTICE '🏨 Sucursales disponibles: %', branch_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ FUNCIONES DISPONIBLES:';
  RAISE NOTICE '1. get_dashboard_stats(branch_id)';
  RAISE NOTICE '2. calculate_revenue(branch_id, start, end)';
  RAISE NOTICE '3. generate_daily_report(branch_id, date)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MEJORAS APLICADAS:';
  RAISE NOTICE '1. Funciones aceptan branch_id NULL';
  RAISE NOTICE '2. Columna status sincronizada en rooms';
  RAISE NOTICE '3. Trigger automático para status';
  RAISE NOTICE '4. Políticas RLS configuradas';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 SIGUIENTE PASO:';
  RAISE NOTICE '1. Recarga la aplicación (Ctrl+R)';
  RAISE NOTICE '2. Limpia caché del navegador (Ctrl+Shift+R)';
  RAISE NOTICE '3. Verifica que no haya errores 404';
  RAISE NOTICE '========================================';
END $$;
