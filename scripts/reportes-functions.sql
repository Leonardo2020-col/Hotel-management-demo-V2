-- ============================================
-- FUNCIONES SQL PARA SISTEMA DE REPORTES
-- ============================================

-- FUNCIÓN 1: Estadísticas del Dashboard
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_branch_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_rooms', COUNT(*),
    'occupied_rooms', COUNT(*) FILTER (WHERE status = 'occupied'),
    'available_rooms', COUNT(*) FILTER (WHERE status = 'available'),
    'maintenance_rooms', COUNT(*) FILTER (WHERE status = 'maintenance'),
    'occupancy_rate', ROUND(
      (COUNT(*) FILTER (WHERE status = 'occupied')::DECIMAL /
       NULLIF(COUNT(*), 0) * 100), 2
    ),
    'today_checkins', (
      SELECT COUNT(*)
      FROM checkin_orders ci
      JOIN rooms r ON ci.room_id = r.id
      WHERE r.branch_id = p_branch_id
      AND DATE(ci.check_in_time) = CURRENT_DATE
    ),
    'today_checkouts', (
      SELECT COUNT(*)
      FROM checkout_orders co
      JOIN rooms r ON co.room_id = r.id
      WHERE r.branch_id = p_branch_id
      AND DATE(co.checkout_time) = CURRENT_DATE
    ),
    'pending_reservations', (
      SELECT COUNT(*)
      FROM reservations res
      JOIN rooms r ON res.room_id = r.id
      WHERE r.branch_id = p_branch_id
      AND res.status = 'pending'
    )
  ) INTO result
  FROM rooms
  WHERE branch_id = p_branch_id;

  RETURN result;
END;
$$;

-- FUNCIÓN 2: Cálculo de Ingresos
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

  -- Calcular ingresos por servicios (si existe tabla de servicios)
  v_service_revenue := 0;

  -- Calcular gastos
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM expenses
  WHERE branch_id = p_branch_id
  AND expense_date BETWEEN p_start_date AND p_end_date;

  -- Construir resultado
  SELECT json_build_object(
    'room_revenue', v_room_revenue,
    'service_revenue', v_service_revenue,
    'total_revenue', v_room_revenue + v_service_revenue,
    'total_expenses', v_total_expenses,
    'net_profit', (v_room_revenue + v_service_revenue) - v_total_expenses
  ) INTO result;

  RETURN result;
END;
$$;

-- FUNCIÓN 3: Crear Tabla de Reportes Diarios (si no existe)
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

-- Índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_branch_date
ON daily_reports(branch_id, report_date DESC);

-- FUNCIÓN 4: Generar Reporte Diario
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
  -- Contar check-ins del día
  SELECT COUNT(*) INTO v_checkins
  FROM checkin_orders ci
  JOIN rooms r ON ci.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(ci.check_in_time) = p_report_date;

  -- Contar check-outs del día
  SELECT COUNT(*) INTO v_checkouts
  FROM checkout_orders co
  JOIN rooms r ON co.room_id = r.id
  WHERE r.branch_id = p_branch_id
  AND DATE(co.checkout_time) = p_report_date;

  -- Estado actual de habitaciones
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
  v_occupancy := ROUND((v_occupied::DECIMAL / NULLIF(v_total_rooms, 0) * 100), 2);

  -- Insertar o actualizar reporte
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

-- PERMISOS
-- ============================================
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_revenue(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_daily_report(UUID, DATE) TO authenticated;

GRANT ALL ON daily_reports TO authenticated;

-- RLS POLICIES
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

DROP POLICY IF EXISTS "Users can insert daily reports for their branch" ON daily_reports;
CREATE POLICY "Users can insert daily reports for their branch"
ON daily_reports FOR INSERT
WITH CHECK (
  branch_id IN (
    SELECT ub.branch_id
    FROM user_branches ub
    WHERE ub.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update daily reports for their branch" ON daily_reports;
CREATE POLICY "Users can update daily reports for their branch"
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
  RAISE NOTICE '✅ Funciones de reportes creadas exitosamente';
  RAISE NOTICE '📊 get_dashboard_stats(branch_id)';
  RAISE NOTICE '💰 calculate_revenue(branch_id, start_date, end_date)';
  RAISE NOTICE '📅 generate_daily_report(branch_id, report_date)';
  RAISE NOTICE '🗄️ Tabla daily_reports creada';
END $$;
