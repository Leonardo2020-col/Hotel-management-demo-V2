-- =====================================================
-- MIGRACIÓN REPORTES V2 - VERSIÓN FINAL Y CORREGIDA
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- PASO 1: Función simple para estadísticas de dashboard
-- RETORNA JSON en lugar de TABLE para facilitar acceso
CREATE OR REPLACE FUNCTION get_dashboard_stats_simple(p_branch_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH room_stats AS (
        SELECT
            COUNT(r.id)::INTEGER as total,
            COUNT(CASE WHEN rs.status = 'ocupada' THEN 1 END)::INTEGER as occupied,
            COUNT(CASE WHEN rs.status = 'disponible' THEN 1 END)::INTEGER as available,
            COUNT(CASE WHEN rs.status = 'mantenimiento' THEN 1 END)::INTEGER as maintenance
        FROM rooms r
        LEFT JOIN room_status rs ON r.status_id = rs.id
        WHERE r.branch_id = p_branch_id
    ),
    checkins_today AS (
        SELECT COUNT(DISTINCT ci.id)::INTEGER as count
        FROM checkin_orders ci
        JOIN rooms r ON ci.room_id = r.id
        WHERE r.branch_id = p_branch_id
        AND DATE(ci.check_in_time) = CURRENT_DATE
    ),
    checkouts_today AS (
        SELECT COUNT(DISTINCT co.id)::INTEGER as count
        FROM checkout_orders co
        JOIN checkin_orders ci ON co.checkin_order_id = ci.id
        JOIN rooms r ON ci.room_id = r.id
        WHERE r.branch_id = p_branch_id
        AND DATE(co.checkout_time) = CURRENT_DATE
    ),
    pending_res AS (
        SELECT COUNT(*)::INTEGER as count
        FROM reservations res
        JOIN reservation_status st ON res.status_id = st.id
        WHERE res.branch_id = p_branch_id
        AND st.status = 'pendiente'
    )
    SELECT json_build_object(
        'total_rooms', rs.total,
        'occupied_rooms', rs.occupied,
        'available_rooms', rs.available,
        'maintenance_rooms', rs.maintenance,
        'occupancy_rate', CASE
            WHEN rs.total > 0
            THEN ROUND((rs.occupied::DECIMAL / rs.total) * 100, 2)
            ELSE 0
        END,
        'today_checkins', COALESCE(ci.count, 0),
        'today_checkouts', COALESCE(co.count, 0),
        'pending_reservations', COALESCE(pr.count, 0)
    ) INTO result
    FROM room_stats rs
    CROSS JOIN checkins_today ci
    CROSS JOIN checkouts_today co
    CROSS JOIN pending_res pr;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Función para calcular ingresos - RETORNA JSON
CREATE OR REPLACE FUNCTION calculate_revenue_simple(
    p_branch_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH room_income AS (
        SELECT COALESCE(SUM(co.total_charges), 0) as amount
        FROM checkout_orders co
        JOIN checkin_orders ci ON co.checkin_order_id = ci.id
        JOIN rooms r ON ci.room_id = r.id
        WHERE r.branch_id = p_branch_id
        AND DATE(co.checkout_time) BETWEEN p_start_date AND p_end_date
    ),
    service_income AS (
        SELECT 0::DECIMAL as amount
    ),
    expenses_total AS (
        SELECT COALESCE(SUM(amount), 0) as amount
        FROM expenses
        WHERE branch_id = p_branch_id
        AND expense_date BETWEEN p_start_date AND p_end_date
    )
    SELECT json_build_object(
        'room_revenue', ri.amount,
        'service_revenue', si.amount,
        'total_revenue', ri.amount + si.amount,
        'total_expenses', et.amount,
        'net_profit', (ri.amount + si.amount) - et.amount
    ) INTO result
    FROM room_income ri
    CROSS JOIN service_income si
    CROSS JOIN expenses_total et;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Crear tabla para reportes diarios (si no existe)
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id),
    report_date DATE NOT NULL,
    total_checkins INTEGER DEFAULT 0,
    total_checkouts INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    occupancy_rate DECIMAL(5,2) DEFAULT 0,
    available_rooms INTEGER DEFAULT 0,
    occupied_rooms INTEGER DEFAULT 0,
    maintenance_rooms INTEGER DEFAULT 0,
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_branch_date
ON daily_reports(branch_id, report_date DESC);

-- PASO 4: Función para generar reporte diario
CREATE OR REPLACE FUNCTION generate_daily_report_simple(
    p_branch_id UUID,
    p_report_date DATE DEFAULT CURRENT_DATE,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_checkins INTEGER;
    v_checkouts INTEGER;
    v_revenue DECIMAL;
    v_expenses DECIMAL;
    v_occupancy DECIMAL;
    v_available INTEGER;
    v_occupied INTEGER;
    v_maintenance INTEGER;
BEGIN
    -- Obtener check-ins del día
    SELECT COUNT(DISTINCT ci.id)
    INTO v_checkins
    FROM checkin_orders ci
    JOIN rooms r ON ci.room_id = r.id
    WHERE r.branch_id = p_branch_id
    AND DATE(ci.check_in_time) = p_report_date;

    -- Obtener check-outs del día
    SELECT COUNT(DISTINCT co.id)
    INTO v_checkouts
    FROM checkout_orders co
    JOIN checkin_orders ci ON co.checkin_order_id = ci.id
    JOIN rooms r ON ci.room_id = r.id
    WHERE r.branch_id = p_branch_id
    AND DATE(co.checkout_time) = p_report_date;

    -- Obtener ingresos del día
    SELECT COALESCE(SUM(co.total_charges), 0)
    INTO v_revenue
    FROM checkout_orders co
    JOIN checkin_orders ci ON co.checkin_order_id = ci.id
    JOIN rooms r ON ci.room_id = r.id
    WHERE r.branch_id = p_branch_id
    AND DATE(co.checkout_time) = p_report_date;

    -- Obtener gastos del día
    SELECT COALESCE(SUM(amount), 0)
    INTO v_expenses
    FROM expenses
    WHERE branch_id = p_branch_id
    AND DATE(expense_date) = p_report_date;

    -- Obtener estado de habitaciones
    SELECT
        COUNT(CASE WHEN rs.status = 'disponible' THEN 1 END),
        COUNT(CASE WHEN rs.status = 'ocupada' THEN 1 END),
        COUNT(CASE WHEN rs.status = 'mantenimiento' THEN 1 END)
    INTO v_available, v_occupied, v_maintenance
    FROM rooms r
    JOIN room_status rs ON r.status_id = rs.id
    WHERE r.branch_id = p_branch_id;

    -- Calcular tasa de ocupación
    v_occupancy := CASE
        WHEN (v_available + v_occupied + v_maintenance) > 0
        THEN ROUND((v_occupied::DECIMAL / (v_available + v_occupied + v_maintenance)) * 100, 2)
        ELSE 0
    END;

    -- Insertar o actualizar reporte
    INSERT INTO daily_reports (
        branch_id,
        report_date,
        total_checkins,
        total_checkouts,
        total_revenue,
        total_expenses,
        occupancy_rate,
        available_rooms,
        occupied_rooms,
        maintenance_rooms,
        generated_by
    ) VALUES (
        p_branch_id,
        p_report_date,
        v_checkins,
        v_checkouts,
        v_revenue,
        v_expenses,
        v_occupancy,
        v_available,
        v_occupied,
        v_maintenance,
        p_user_id
    )
    ON CONFLICT (branch_id, report_date)
    DO UPDATE SET
        total_checkins = EXCLUDED.total_checkins,
        total_checkouts = EXCLUDED.total_checkouts,
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        occupancy_rate = EXCLUDED.occupancy_rate,
        available_rooms = EXCLUDED.available_rooms,
        occupied_rooms = EXCLUDED.occupied_rooms,
        maintenance_rooms = EXCLUDED.maintenance_rooms,
        generated_by = EXCLUDED.generated_by,
        created_at = CURRENT_TIMESTAMP;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Otorgar permisos
GRANT EXECUTE ON FUNCTION get_dashboard_stats_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_revenue_simple(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_daily_report_simple(UUID, DATE, UUID) TO authenticated;

GRANT ALL ON daily_reports TO authenticated;

-- PASO 6: Políticas RLS para daily_reports
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

-- PASO 7: Verificación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '🔧 Función: get_dashboard_stats_simple(branch_id) → Retorna JSON';
    RAISE NOTICE '💰 Función: calculate_revenue_simple(branch_id, start, end) → Retorna JSON';
    RAISE NOTICE '📅 Función: generate_daily_report_simple(branch_id, date, user) → Retorna JSON';
    RAISE NOTICE '📋 Tabla: daily_reports';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Sistema de reportes listo';
END $$;
