-- ============================================
-- DATOS DE DEMO PARA HOTEL CENTRO LIMA
-- ============================================

-- NOTA: Este script asume que ya existe una sucursal llamada "Hotel Centro Lima"
-- Si no existe, primero créala en la aplicación o con este query:
-- INSERT INTO branches (name, address, phone, email, is_active)
-- VALUES ('Hotel Centro Lima', 'Av. Centro 123, Lima', '+51 999 999 999', 'centro@hotel.com', true);

-- ============================================
-- PASO 1: Obtener el ID de Hotel Centro Lima
-- ============================================
DO $$
DECLARE
  v_branch_id UUID;
  v_room_id_101 UUID;
  v_room_id_102 UUID;
  v_room_id_103 UUID;
  v_room_id_201 UUID;
  v_room_id_202 UUID;
  v_guest_id_1 UUID;
  v_guest_id_2 UUID;
  v_guest_id_3 UUID;
  v_expense_category_id UUID;
  v_payment_method_id UUID;
BEGIN
  -- Buscar sucursal
  SELECT id INTO v_branch_id
  FROM branches
  WHERE name ILIKE '%centro%lima%' OR name ILIKE 'centro%'
  LIMIT 1;

  IF v_branch_id IS NULL THEN
    RAISE NOTICE '❌ No se encontró la sucursal Hotel Centro Lima';
    RAISE NOTICE '💡 Crea la sucursal primero o modifica el nombre en este script';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Sucursal encontrada: %', v_branch_id;

  -- ============================================
  -- PASO 2: Crear habitaciones si no existen
  -- ============================================

  -- Habitación 101
  INSERT INTO rooms (branch_id, room_number, room_type, price_per_night, status, floor)
  VALUES (v_branch_id, '101', 'Simple', 80.00, 'occupied', 1)
  ON CONFLICT (branch_id, room_number) DO UPDATE
  SET status = 'occupied'
  RETURNING id INTO v_room_id_101;

  -- Habitación 102
  INSERT INTO rooms (branch_id, room_number, room_type, price_per_night, status, floor)
  VALUES (v_branch_id, '102', 'Doble', 120.00, 'occupied', 1)
  ON CONFLICT (branch_id, room_number) DO UPDATE
  SET status = 'occupied'
  RETURNING id INTO v_room_id_102;

  -- Habitación 103
  INSERT INTO rooms (branch_id, room_number, room_type, price_per_night, status, floor)
  VALUES (v_branch_id, '103', 'Suite', 200.00, 'available', 1)
  ON CONFLICT (branch_id, room_number) DO UPDATE
  SET status = 'available'
  RETURNING id INTO v_room_id_103;

  -- Habitación 201
  INSERT INTO rooms (branch_id, room_number, room_type, price_per_night, status, floor)
  VALUES (v_branch_id, '201', 'Doble', 120.00, 'occupied', 2)
  ON CONFLICT (branch_id, room_number) DO UPDATE
  SET status = 'occupied'
  RETURNING id INTO v_room_id_201;

  -- Habitación 202
  INSERT INTO rooms (branch_id, room_number, room_type, price_per_night, status, floor)
  VALUES (v_branch_id, '202', 'Suite', 200.00, 'maintenance', 2)
  ON CONFLICT (branch_id, room_number) DO UPDATE
  SET status = 'maintenance'
  RETURNING id INTO v_room_id_202;

  RAISE NOTICE '✅ Habitaciones creadas/actualizadas';

  -- ============================================
  -- PASO 3: Crear huéspedes de demo
  -- ============================================

  INSERT INTO guests (first_name, last_name, document_type, document_number, phone, email, nationality)
  VALUES ('Juan', 'Pérez García', 'DNI', '12345678', '+51 987 654 321', 'juan.perez@email.com', 'Peruana')
  ON CONFLICT (document_number) DO UPDATE
  SET first_name = EXCLUDED.first_name
  RETURNING id INTO v_guest_id_1;

  INSERT INTO guests (first_name, last_name, document_type, document_number, phone, email, nationality)
  VALUES ('María', 'López Sánchez', 'DNI', '87654321', '+51 987 123 456', 'maria.lopez@email.com', 'Peruana')
  ON CONFLICT (document_number) DO UPDATE
  SET first_name = EXCLUDED.first_name
  RETURNING id INTO v_guest_id_2;

  INSERT INTO guests (first_name, last_name, document_type, document_number, phone, email, nationality)
  VALUES ('Carlos', 'Rodríguez Díaz', 'Pasaporte', 'AB123456', '+51 999 888 777', 'carlos.r@email.com', 'Española')
  ON CONFLICT (document_number) DO UPDATE
  SET first_name = EXCLUDED.first_name
  RETURNING id INTO v_guest_id_3;

  RAISE NOTICE '✅ Huéspedes creados';

  -- ============================================
  -- PASO 4: Crear check-ins (ocupaciones actuales)
  -- ============================================

  -- Check-in de hoy - Habitación 101
  INSERT INTO checkin_orders (
    room_id, guest_id, check_in_time, expected_checkout,
    number_of_guests, payment_method, advance_payment, status
  )
  SELECT
    v_room_id_101, v_guest_id_1,
    CURRENT_DATE + TIME '14:00:00',
    CURRENT_DATE + INTERVAL '2 days',
    1, 'Efectivo', 80.00, 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM checkin_orders
    WHERE room_id = v_room_id_101 AND status = 'active'
  );

  -- Check-in de hace 2 días - Habitación 102
  INSERT INTO checkin_orders (
    room_id, guest_id, check_in_time, expected_checkout,
    number_of_guests, payment_method, advance_payment, status
  )
  SELECT
    v_room_id_102, v_guest_id_2,
    CURRENT_DATE - INTERVAL '2 days' + TIME '15:30:00',
    CURRENT_DATE + INTERVAL '1 day',
    2, 'Tarjeta', 120.00, 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM checkin_orders
    WHERE room_id = v_room_id_102 AND status = 'active'
  );

  -- Check-in de hace 1 día - Habitación 201
  INSERT INTO checkin_orders (
    room_id, guest_id, check_in_time, expected_checkout,
    number_of_guests, payment_method, advance_payment, status
  )
  SELECT
    v_room_id_201, v_guest_id_3,
    CURRENT_DATE - INTERVAL '1 day' + TIME '16:00:00',
    CURRENT_DATE + INTERVAL '3 days',
    2, 'Transferencia', 120.00, 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM checkin_orders
    WHERE room_id = v_room_id_201 AND status = 'active'
  );

  RAISE NOTICE '✅ Check-ins creados';

  -- ============================================
  -- PASO 5: Crear check-outs históricos
  -- ============================================

  -- Checkout de hace 3 días
  INSERT INTO checkout_orders (
    room_id, guest_id, checkout_time, total_charges,
    payment_method, additional_charges, notes
  )
  SELECT
    v_room_id_103, v_guest_id_1,
    CURRENT_DATE - INTERVAL '3 days' + TIME '12:00:00',
    400.00, 'Tarjeta', 0, 'Checkout demo - hace 3 días'
  WHERE NOT EXISTS (
    SELECT 1 FROM checkout_orders
    WHERE room_id = v_room_id_103
    AND DATE(checkout_time) = CURRENT_DATE - INTERVAL '3 days'
  );

  -- Checkout de hace 5 días
  INSERT INTO checkout_orders (
    room_id, guest_id, checkout_time, total_charges,
    payment_method, additional_charges, notes
  )
  SELECT
    v_room_id_102, v_guest_id_2,
    CURRENT_DATE - INTERVAL '5 days' + TIME '11:00:00',
    360.00, 'Efectivo', 50.00, 'Checkout demo - hace 5 días'
  WHERE NOT EXISTS (
    SELECT 1 FROM checkout_orders
    WHERE room_id = v_room_id_102
    AND DATE(checkout_time) = CURRENT_DATE - INTERVAL '5 days'
  );

  -- Checkout de hace 7 días
  INSERT INTO checkout_orders (
    room_id, guest_id, checkout_time, total_charges,
    payment_method, additional_charges, notes
  )
  SELECT
    v_room_id_101, v_guest_id_3,
    CURRENT_DATE - INTERVAL '7 days' + TIME '10:30:00',
    240.00, 'Transferencia', 0, 'Checkout demo - hace 7 días'
  WHERE NOT EXISTS (
    SELECT 1 FROM checkout_orders
    WHERE room_id = v_room_id_101
    AND DATE(checkout_time) = CURRENT_DATE - INTERVAL '7 days'
  );

  RAISE NOTICE '✅ Check-outs históricos creados';

  -- ============================================
  -- PASO 6: Crear gastos de demo
  -- ============================================

  -- Obtener categoría de gastos (crear si no existe)
  SELECT id INTO v_expense_category_id
  FROM expense_categories
  WHERE name ILIKE '%mantenimiento%' OR name ILIKE 'mantenimiento'
  LIMIT 1;

  IF v_expense_category_id IS NULL THEN
    INSERT INTO expense_categories (name, description)
    VALUES ('Mantenimiento', 'Gastos de mantenimiento del hotel')
    RETURNING id INTO v_expense_category_id;
  END IF;

  -- Obtener método de pago
  SELECT id INTO v_payment_method_id
  FROM payment_methods
  WHERE name ILIKE '%efectivo%'
  LIMIT 1;

  IF v_payment_method_id IS NULL THEN
    INSERT INTO payment_methods (name)
    VALUES ('Efectivo')
    RETURNING id INTO v_payment_method_id;
  END IF;

  -- Gasto de hoy
  INSERT INTO expenses (
    branch_id, description, amount, expense_date,
    category_id, payment_method_id
  )
  SELECT
    v_branch_id, 'Reparación de aire acondicionado Hab 202',
    150.00, CURRENT_DATE,
    v_expense_category_id, v_payment_method_id
  WHERE NOT EXISTS (
    SELECT 1 FROM expenses
    WHERE branch_id = v_branch_id
    AND expense_date = CURRENT_DATE
    AND description ILIKE '%aire%'
  );

  -- Gasto de hace 2 días
  INSERT INTO expenses (
    branch_id, description, amount, expense_date,
    category_id, payment_method_id
  )
  SELECT
    v_branch_id, 'Compra de productos de limpieza',
    85.50, CURRENT_DATE - INTERVAL '2 days',
    v_expense_category_id, v_payment_method_id
  WHERE NOT EXISTS (
    SELECT 1 FROM expenses
    WHERE branch_id = v_branch_id
    AND expense_date = CURRENT_DATE - INTERVAL '2 days'
  );

  -- Gasto de hace 5 días
  INSERT INTO expenses (
    branch_id, description, amount, expense_date,
    category_id, payment_method_id
  )
  SELECT
    v_branch_id, 'Mantenimiento preventivo caldera',
    200.00, CURRENT_DATE - INTERVAL '5 days',
    v_expense_category_id, v_payment_method_id
  WHERE NOT EXISTS (
    SELECT 1 FROM expenses
    WHERE branch_id = v_branch_id
    AND expense_date = CURRENT_DATE - INTERVAL '5 days'
  );

  RAISE NOTICE '✅ Gastos creados';

  -- ============================================
  -- PASO 7: Crear reservas pendientes
  -- ============================================

  INSERT INTO reservations (
    room_id, guest_id, reservation_date,
    check_in_date, check_out_date,
    number_of_guests, status, total_amount
  )
  SELECT
    v_room_id_103, v_guest_id_1,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '5 days',
    2, 'pending', 400.00
  WHERE NOT EXISTS (
    SELECT 1 FROM reservations
    WHERE room_id = v_room_id_103
    AND status = 'pending'
    AND check_in_date = CURRENT_DATE + INTERVAL '3 days'
  );

  INSERT INTO reservations (
    room_id, guest_id, reservation_date,
    check_in_date, check_out_date,
    number_of_guests, status, total_amount
  )
  SELECT
    v_room_id_102, v_guest_id_2,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '7 days',
    1, 'pending', 240.00
  WHERE NOT EXISTS (
    SELECT 1 FROM reservations
    WHERE room_id = v_room_id_102
    AND status = 'pending'
    AND check_in_date = CURRENT_DATE + INTERVAL '5 days'
  );

  RAISE NOTICE '✅ Reservas creadas';

  -- ============================================
  -- RESUMEN FINAL
  -- ============================================
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATOS DE DEMO CREADOS EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sucursal: Hotel Centro Lima';
  RAISE NOTICE 'ID: %', v_branch_id;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Habitaciones: 5 (3 ocupadas, 1 disponible, 1 mantenimiento)';
  RAISE NOTICE '👥 Huéspedes: 3';
  RAISE NOTICE '✅ Check-ins activos: 3';
  RAISE NOTICE '🚪 Check-outs históricos: 3';
  RAISE NOTICE '💸 Gastos: 3';
  RAISE NOTICE '📅 Reservas pendientes: 2';
  RAISE NOTICE '========================================';
  RAISE NOTICE '💡 Ahora puedes ver los reportes con datos';
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;
