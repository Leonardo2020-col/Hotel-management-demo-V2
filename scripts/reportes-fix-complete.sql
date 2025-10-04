-- ============================================
-- SCRIPT COMPLETO: FUNCIONES DE REPORTES
-- ============================================

-- PASO 1: Eliminar funciones antiguas si existen
-- ============================================
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS calculate_revenue(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS generate_daily_report(UUID, DATE);

-- PASO 2: Crear tabla daily_reports si no existe
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

-- PASO 3: FUNCIÓN get_dashboard_stats
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_branch_id UUID)
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
BEGIN
  -- Contar habitaciones por estado
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'occupied'),
    COUNT(*) FILTER (WHERE status = 'available'),
    COUNT(*) FILTER (WHERE status = 'maintenance')
  INTO v_total_rooms, v_occupied_rooms, v_available_rooms, v_maintenance_rooms
  FROM rooms
  WHERE branch_id = p_branch_id;

  -- Calcular tasa de ocupación
  v_occupancy_rate := CASE
    WHEN v_total_rooms > 0 THEN ROUND((v_occupied_rooms::DECIMAL / v_total_rooms * 100), 2)
    ELSE 0
  END;

  -- Contar check-ins de hoy
  SELECT COUNT(*) INTO v_today_checkins
  FROM checkin_orders ci
  JOIN rooms r ON ci.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(ci.check_in_time) = CURRENT_DATE;

  -- Contar check-outs de hoy
  SELECT COUNT(*) INTO v_today_checkouts
  FROM checkout_orders co
  JOIN rooms r ON co.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(co.checkout_time) = CURRENT_DATE;

  -- Contar reservas pendientes
  SELECT COUNT(*) INTO v_pending_reservations
  FROM reservations res
  JOIN rooms r ON res.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND res.status = 'pending';

  -- Construir objeto JSON
  result := json_build_object(
    'total_rooms', COALESCE(v_total_rooms, 0),
    'occupied_rooms', COALESCE(v_occupied_rooms, 0),
    'available_rooms', COALESCE(v_available_rooms, 0),
    'maintenance_rooms', COALESCE(v_maintenance_rooms, 0),
    'occupancy_rate', COALESCE(v_occupancy_rate, 0),
    'today_checkins', COALESCE(v_today_checkins, 0),
    'today_checkouts', COALESCE(v_today_checkouts, 0),
    'pending_reservations', COALESCE(v_pending_reservations, 0)
  );

  RETURN result;
END;
$$;

-- PASO 4: FUNCIÓN calculate_revenue
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
  -- Calcular ingresos por habitaciones
  SELECT COALESCE(SUM(total_charges), 0) INTO v_room_revenue
  FROM checkout_orders co
  JOIN rooms r ON co.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(co.checkout_time) BETWEEN p_start_date AND p_end_date;

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

-- PASO 5: FUNCIÓN generate_daily_report
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
  FROM checkin_orders ci
  JOIN rooms r ON ci.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(ci.check_in_time) = p_report_date;

  -- Check-outs del día
  SELECT COUNT(*) INTO v_checkouts
  FROM checkout_orders co
  JOIN rooms r ON co.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(co.checkout_time) = p_report_date;

  -- Estado de habitaciones
  SELECT
    COUNT(*) FILTER (WHERE status = 'occupied'),
    COUNT(*) FILTER (WHERE status = 'available'),
    COUNT(*)
  INTO v_occupied, v_available, v_total_rooms
  FROM rooms
  WHERE branch_id = p_branch_id;

  -- Ingresos del día
  SELECT COALESCE(SUM(total_charges), 0) INTO v_revenue
  FROM checkout_orders co
  JOIN rooms r ON co.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(co.checkout_time) = p_report_date;

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

  -- Insertar o actualizar
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

-- PASO 6: PERMISOS
-- ============================================
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_revenue(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_daily_report(UUID, DATE) TO authenticated;

GRANT ALL ON daily_reports TO authenticated;

-- PASO 7: RLS POLICIES
-- ============================================
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view daily reports from their branch" ON daily_reports;
CREATE POLICY "Users can view daily reports from their branch"
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

-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FUNCIONES DE REPORTES INSTALADAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 get_dashboard_stats(branch_id)';
  RAISE NOTICE '💰 calculate_revenue(branch_id, start, end)';
  RAISE NOTICE '📅 generate_daily_report(branch_id, date)';
  RAISE NOTICE '🗄️  Tabla daily_reports creada';
  RAISE NOTICE '========================================';
END $$;
