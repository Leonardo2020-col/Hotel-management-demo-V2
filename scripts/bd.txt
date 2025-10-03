-- =====================================================
-- SISTEMA DE HOTEL - BASE DE DATOS COMPLETA
-- =====================================================

-- Extensiones necesarias para Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLAS PRINCIPALES
-- =====================================================

-- Tabla de roles
CREATE TABLE roles (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(50) NOT NULL UNIQUE,
description TEXT,
permissions JSONB DEFAULT '{}',
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sucursales/branches
CREATE TABLE branches (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(100) NOT NULL,
address TEXT,
phone VARCHAR(20),
email VARCHAR(100),
manager_name VARCHAR(100),
is_active BOOLEAN DEFAULT TRUE,
settings JSONB DEFAULT '{}',
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE users (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
email VARCHAR(100) NOT NULL UNIQUE,
password_hash VARCHAR(255),
first_name VARCHAR(50) NOT NULL,
last_name VARCHAR(50) NOT NULL,
phone VARCHAR(20),
role_id UUID REFERENCES roles(id),
is_active BOOLEAN DEFAULT TRUE,
last_login TIMESTAMP WITH TIME ZONE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación usuario-sucursal
CREATE TABLE user_branches (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
is_primary BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(user_id, branch_id)
);

-- Tabla de estados de habitación
CREATE TABLE room_status (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
status VARCHAR(50) NOT NULL UNIQUE,
color VARCHAR(7) DEFAULT '#000000',
description TEXT,
is_available BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de habitaciones
CREATE TABLE rooms (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
branch_id UUID REFERENCES branches(id),
room_number VARCHAR(10) NOT NULL,
floor INTEGER,
description TEXT,
base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
status_id UUID REFERENCES room_status(id),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(branch_id, room_number)
);

-- Tabla de huéspedes
CREATE TABLE guests (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
full_name VARCHAR(80) NOT NULL,
phone VARCHAR(20),
document_type VARCHAR(20),
document_number VARCHAR(50),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de documentos de huéspedes
CREATE TABLE guest_documents (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
document_type VARCHAR(50) NOT NULL,
document_url TEXT NOT NULL,
file_name VARCHAR(255),
file_size INTEGER,
uploaded_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estados de reservación
CREATE TABLE reservation_status (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
status VARCHAR(50) NOT NULL UNIQUE,
color VARCHAR(7) DEFAULT '#000000',
description TEXT,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métodos de pago
CREATE TABLE payment_methods (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(50) NOT NULL UNIQUE,
description TEXT,
is_active BOOLEAN DEFAULT TRUE,
requires_reference BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reservaciones
CREATE TABLE reservations (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
branch_id UUID REFERENCES branches(id),
guest_id UUID REFERENCES guests(id),
room_id UUID REFERENCES rooms(id),
reservation_code VARCHAR(20) UNIQUE NOT NULL,
check_in_date DATE NOT NULL,
check_out_date DATE NOT NULL,
total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
paid_amount DECIMAL(10,2) DEFAULT 0,
status_id UUID REFERENCES reservation_status(id),
created_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos de reservaciones
CREATE TABLE reservation_payments (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
payment_method_id UUID REFERENCES payment_methods(id),
amount DECIMAL(10,2) NOT NULL,
payment_reference VARCHAR(100),
payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
processed_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de check-in rápido
CREATE TABLE quick_checkins (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
branch_id UUID REFERENCES branches(id),
room_id UUID REFERENCES rooms(id),
guest_name VARCHAR(100) NOT NULL,
guest_document VARCHAR(50),
guest_phone VARCHAR(20),
check_in_date DATE NOT NULL,
check_out_date DATE NOT NULL,
amount DECIMAL(10,2) NOT NULL DEFAULT 0,
payment_method_id UUID REFERENCES payment_methods(id),
created_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes de check-in
CREATE TABLE checkin_orders (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
reservation_id UUID REFERENCES reservations(id),
quick_checkin_id UUID REFERENCES quick_checkins(id),
room_id UUID REFERENCES rooms(id),
guest_id UUID REFERENCES guests(id),
check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
expected_checkout DATE,
actual_checkout TIMESTAMP WITH TIME ZONE,
key_cards_issued INTEGER DEFAULT 0,
deposit_amount DECIMAL(10,2) DEFAULT 0,
processed_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
CONSTRAINT check_source CHECK (
(reservation_id IS NOT NULL AND quick_checkin_id IS NULL) OR
(reservation_id IS NULL AND quick_checkin_id IS NOT NULL)
)
);

-- Tabla de órdenes de check-out
CREATE TABLE checkout_orders (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
checkin_order_id UUID REFERENCES checkin_orders(id),
checkout_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
total_charges DECIMAL(10,2) DEFAULT 0,
deposit_returned DECIMAL(10,2) DEFAULT 0,
additional_charges JSONB DEFAULT '[]',
room_condition TEXT,
key_cards_returned INTEGER DEFAULT 0,
processed_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de disponibilidad de habitaciones
CREATE TABLE room_availability (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
room_id UUID REFERENCES rooms(id),
date DATE NOT NULL,
is_available BOOLEAN DEFAULT TRUE,
price_override DECIMAL(10,2),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(room_id, date)
);

-- =====================================================
-- 2. TABLAS DE SUMINISTROS
-- =====================================================

-- Tabla de proveedores
CREATE TABLE suppliers (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(100) NOT NULL,
contact_person VARCHAR(100),
email VARCHAR(100),
phone VARCHAR(20),
tax_id VARCHAR(50),
payment_terms TEXT,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías de suministros
CREATE TABLE supply_categories (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(100) NOT NULL,
parent_category_id UUID REFERENCES supply_categories(id),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de suministros
CREATE TABLE supplies (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(100) NOT NULL,
category_id UUID REFERENCES supply_categories(id),
unit_of_measure VARCHAR(20) NOT NULL,
minimum_stock INTEGER DEFAULT 0,
current_stock INTEGER DEFAULT 0,
unit_cost DECIMAL(10,2) DEFAULT 0,
supplier_id UUID REFERENCES suppliers(id),
sku VARCHAR(50),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos de suministros
CREATE TABLE supply_movements (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
supply_id UUID REFERENCES supplies(id),
branch_id UUID REFERENCES branches(id),
movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
quantity INTEGER NOT NULL,
unit_cost DECIMAL(10,2),
total_cost DECIMAL(10,2),
reference_document VARCHAR(100),
processed_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
CHECK (movement_type IN ('in', 'out', 'adjustment'))
);

-- Tabla de alertas de inventario
CREATE TABLE inventory_alerts (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
supply_id UUID REFERENCES supplies(id),
alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'out_of_stock', 'expired'
message TEXT NOT NULL,
is_resolved BOOLEAN DEFAULT FALSE,
resolved_by UUID REFERENCES users(id),
resolved_at TIMESTAMP WITH TIME ZONE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías de snacks
CREATE TABLE snack_categories (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(100) NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de snacks
CREATE TABLE snack_items (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(100) NOT NULL,
category_id UUID REFERENCES snack_categories(id),
price DECIMAL(10,2) NOT NULL DEFAULT 0,
cost DECIMAL(10,2) DEFAULT 0,
stock INTEGER DEFAULT 0,
minimum_stock INTEGER DEFAULT 0,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLAS DE REPORTES Y CONFIGURACIÓN
-- =====================================================

-- Tabla de categorías de gastos
CREATE TABLE expense_categories (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(100) NOT NULL,
description TEXT,
parent_category_id UUID REFERENCES expense_categories(id),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de gastos
CREATE TABLE expenses (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
branch_id UUID REFERENCES branches(id),
category_id UUID REFERENCES expense_categories(id),
description TEXT NOT NULL,
amount DECIMAL(10,2) NOT NULL,
expense_date DATE NOT NULL,
payment_method_id UUID REFERENCES payment_methods(id),
receipt_url TEXT,
approved_by UUID REFERENCES users(id),
created_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reportes diarios
CREATE TABLE daily_reports (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
branch_id UUID REFERENCES branches(id),
report_date DATE NOT NULL,
total_checkins INTEGER DEFAULT 0,
total_checkouts INTEGER DEFAULT 0,
total_revenue DECIMAL(10,2) DEFAULT 0,
total_expenses DECIMAL(10,2) DEFAULT 0,
occupancy_rate DECIMAL(5,2) DEFAULT 0,
available_rooms INTEGER DEFAULT 0,
occupied_rooms INTEGER DEFAULT 0,
maintenance_rooms INTEGER DEFAULT 0,
additional_data JSONB DEFAULT '{}',
generated_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(branch_id, report_date)
);

-- Tabla de reportes de ocupación
CREATE TABLE occupancy_reports (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
branch_id UUID REFERENCES branches(id),
report_date DATE NOT NULL,
total_rooms INTEGER NOT NULL,
occupied_rooms INTEGER DEFAULT 0,
available_rooms INTEGER DEFAULT 0,
maintenance_rooms INTEGER DEFAULT 0,
out_of_order_rooms INTEGER DEFAULT 0,
occupancy_percentage DECIMAL(5,2) DEFAULT 0,
revenue_per_available_room DECIMAL(10,2) DEFAULT 0,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(branch_id, report_date)
);

-- Tabla de reportes de ingresos
CREATE TABLE revenue_reports (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
branch_id UUID REFERENCES branches(id),
report_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
start_date DATE NOT NULL,
end_date DATE NOT NULL,
room_revenue DECIMAL(10,2) DEFAULT 0,
service_revenue DECIMAL(10,2) DEFAULT 0,
other_revenue DECIMAL(10,2) DEFAULT 0,
total_revenue DECIMAL(10,2) DEFAULT 0,
total_expenses DECIMAL(10,2) DEFAULT 0,
net_profit DECIMAL(10,2) DEFAULT 0,
breakdown JSONB DEFAULT '{}',
generated_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reportes guardados
CREATE TABLE saved_reports (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
name VARCHAR(100) NOT NULL,
description TEXT,
report_type VARCHAR(50) NOT NULL,
parameters JSONB DEFAULT '{}',
schedule JSONB DEFAULT '{}', -- Para reportes automáticos
created_by UUID REFERENCES users(id),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuraciones del hotel
CREATE TABLE hotel_settings (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
branch_id UUID REFERENCES branches(id),
setting_key VARCHAR(100) NOT NULL,
setting_value JSONB NOT NULL,
description TEXT,
updated_by UUID REFERENCES users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(branch_id, setting_key)
);

-- Tabla de logs de auditoría
CREATE TABLE audit_logs (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
table_name VARCHAR(100) NOT NULL,
record_id UUID NOT NULL,
action VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
old_values JSONB,
new_values JSONB,
user_id UUID REFERENCES users(id),
ip_address INET,
user_agent TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. DATOS INICIALES
-- =====================================================

-- Insertar roles básicos
INSERT INTO roles (name, description, permissions) VALUES
('administrador', 'Acceso completo al sistema', '{"all": true}'),
('recepcion', 'Acceso a operaciones de recepción', '{"checkin": true, "checkout": true, "reservations": true, "guests": true, "reports_view": true}');

-- Insertar estados de habitación
INSERT INTO room_status (status, color, description, is_available) VALUES
('disponible', '#22c55e', 'Habitación disponible para ocupar', true),
('ocupada', '#ef4444', 'Habitación ocupada por huésped', false),
('limpieza', '#f59e0b', 'Habitación en proceso de limpieza', false),
('mantenimiento', '#8b5cf6', 'Habitación en mantenimiento', false),
('fuera_servicio', '#6b7280', 'Habitación fuera de servicio', false);

-- Insertar estados de reservación
INSERT INTO reservation_status (status, color, description) VALUES
('pendiente', '#f59e0b', 'Reservación pendiente de confirmación'),
('confirmada', '#22c55e', 'Reservación confirmada'),
('en_uso', '#3b82f6', 'Reservación activa (check-in realizado)'),
('completada', '#6b7280', 'Reservación completada (check-out realizado)'),
('cancelada', '#ef4444', 'Reservación cancelada'),
('no_show', '#991b1b', 'Cliente no se presentó');

-- Insertar métodos de pago
INSERT INTO payment_methods (name, description, requires_reference) VALUES
('efectivo', 'Pago en efectivo', false),
('tarjeta_debito', 'Tarjeta de débito', true),
('tarjeta_credito', 'Tarjeta de crédito', true),
('transferencia', 'Transferencia bancaria', true),
('deposito', 'Depósito bancario', true),
('pago_movil', 'Yape/Plin', true);

-- Insertar categorías de gastos básicas
INSERT INTO expense_categories (name, description) VALUES
('operativos', 'Gastos operativos diarios'),
('mantenimiento', 'Gastos de mantenimiento y reparaciones'),
('suministros', 'Compra de suministros e inventario'),
('servicios', 'Servicios básicos (agua, luz, internet)'),
('personal', 'Gastos relacionados con el personal'),
('marketing', 'Gastos de marketing y publicidad');

-- =====================================================
-- 5. VISTAS ÚTILES
-- =====================================================

-- Vista de habitaciones con estado
CREATE VIEW room_details AS
SELECT
r.id,
r.room_number,
r.floor,
r.base_price,
rs.status,
rs.color as status_color,
rs.is_available,
b.name as branch_name,
r.created_at
FROM rooms r
JOIN room_status rs ON r.status_id = rs.id
JOIN branches b ON r.branch_id = b.id
WHERE r.is_active = true;

-- Vista de reservaciones con detalles
CREATE VIEW reservation_details AS
SELECT
r.id,
r.reservation_code,
g.full_name as guest_name,
g.phone as guest_phone,
rm.room_number,
r.check_in_date,
r.check_out_date,
r.total_amount,
r.paid_amount,
(r.total_amount - r.paid_amount) as balance,
rs.status,
rs.color as status_color,
b.name as branch_name,
u.first_name || ' ' || u.last_name as created_by_name,
r.created_at
FROM reservations r
JOIN guests g ON r.guest_id = g.id
JOIN rooms rm ON r.room_id = rm.id
JOIN reservation_status rs ON r.status_id = rs.id
JOIN branches b ON r.branch_id = b.id
LEFT JOIN users u ON r.created_by = u.id;

-- Vista de ocupación actual
CREATE VIEW current_occupancy AS
SELECT
b.id as branch_id,
b.name as branch_name,
COUNT(r.id) as total_rooms,
COUNT(CASE WHEN rs.status = 'ocupada' THEN 1 END) as occupied_rooms,
COUNT(CASE WHEN rs.status = 'disponible' THEN 1 END) as available_rooms,
COUNT(CASE WHEN rs.status = 'limpieza' THEN 1 END) as cleaning_rooms,
COUNT(CASE WHEN rs.status = 'mantenimiento' THEN 1 END) as maintenance_rooms,
ROUND(
(COUNT(CASE WHEN rs.status = 'ocupada' THEN 1 END)::DECIMAL /
COUNT(r.id)::DECIMAL) \* 100, 2
) as occupancy_percentage
FROM branches b
LEFT JOIN rooms r ON b.id = r.branch_id AND r.is_active = true
LEFT JOIN room_status rs ON r.status_id = rs.id
WHERE b.is_active = true
GROUP BY b.id, b.name;

-- Vista de ingresos diarios
CREATE VIEW daily_revenue AS
SELECT
b.id as branch_id,
b.name as branch_name,
CURRENT_DATE as report_date,
COALESCE(SUM(rp.amount), 0) as reservation_payments,
COALESCE(SUM(qc.amount), 0) as quick_checkin_payments,
COALESCE(SUM(rp.amount), 0) + COALESCE(SUM(qc.amount), 0) as total_revenue
FROM branches b
LEFT JOIN reservations res ON b.id = res.branch_id
LEFT JOIN reservation_payments rp ON res.id = rp.reservation_id
AND DATE(rp.payment_date) = CURRENT_DATE
LEFT JOIN quick_checkins qc ON b.id = qc.branch_id
AND DATE(qc.created_at) = CURRENT_DATE
WHERE b.is_active = true
GROUP BY b.id, b.name;

-- Vista de suministros con stock bajo
CREATE VIEW low_stock_supplies AS
SELECT
s.id,
s.name,
s.current_stock,
s.minimum_stock,
sc.name as category_name,
sup.name as supplier_name,
(s.minimum_stock - s.current_stock) as units_needed
FROM supplies s
JOIN supply_categories sc ON s.category_id = sc.id
LEFT JOIN suppliers sup ON s.supplier_id = sup.id
WHERE s.current_stock <= s.minimum_stock
AND s.is_active = true;

-- =====================================================
-- 6. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplies_updated_at BEFORE UPDATE ON supplies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_availability_updated_at BEFORE UPDATE ON room_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar código de reservación
CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS TRIGGER AS
$$

BEGIN
NEW.reservation_code = 'RES-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
LPAD(nextval('reservation_code_seq')::text, 4, '0');
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Secuencia para códigos de reservación
CREATE SEQUENCE reservation_code_seq START 1;

-- Trigger para generar código de reservación
CREATE TRIGGER generate_reservation_code_trigger
    BEFORE INSERT ON reservations
    FOR EACH ROW
    WHEN (NEW.reservation_code IS NULL)
    EXECUTE FUNCTION generate_reservation_code();

-- Función para actualizar stock de suministros
CREATE OR REPLACE FUNCTION update_supply_stock()
RETURNS TRIGGER AS
$$

BEGIN
IF NEW.movement_type = 'in' THEN
UPDATE supplies
SET current_stock = current_stock + NEW.quantity
WHERE id = NEW.supply_id;
ELSIF NEW.movement_type = 'out' THEN
UPDATE supplies
SET current_stock = current_stock - NEW.quantity
WHERE id = NEW.supply_id;
ELSIF NEW.movement_type = 'adjustment' THEN
UPDATE supplies
SET current_stock = NEW.quantity
WHERE id = NEW.supply_id;
END IF;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

-- Trigger para actualizar stock
CREATE TRIGGER update_supply_stock_trigger
    AFTER INSERT ON supply_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_supply_stock();

-- Función para crear alertas de stock bajo
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS
$$

BEGIN
-- Verificar si el stock está por debajo del mínimo
IF NEW.current_stock <= NEW.minimum_stock THEN
INSERT INTO inventory_alerts (supply_id, alert_type, message)
VALUES (
NEW.id,
CASE
WHEN NEW.current_stock = 0 THEN 'out_of_stock'
ELSE 'low_stock'
END,
CASE
WHEN NEW.current_stock = 0 THEN 'Suministro agotado: ' || NEW.name
ELSE 'Stock bajo: ' || NEW.name || ' (Stock actual: ' || NEW.current_stock || ', Mínimo: ' || NEW.minimum_stock || ')'
END
)
ON CONFLICT DO NOTHING;
END IF;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

-- Trigger para alertas de stock
CREATE TRIGGER check_low_stock_trigger
    AFTER UPDATE ON supplies
    FOR EACH ROW
    WHEN (OLD.current_stock IS DISTINCT FROM NEW.current_stock)
    EXECUTE FUNCTION check_low_stock();

-- Función para log de auditoría
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS
$$

BEGIN
IF TG_OP = 'DELETE' THEN
INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD),
COALESCE(current_setting('app.current_user_id', true)::uuid, NULL));
RETURN OLD;
ELSIF TG_OP = 'UPDATE' THEN
INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW),
COALESCE(current_setting('app.current_user_id', true)::uuid, NULL));
RETURN NEW;
ELSIF TG_OP = 'INSERT' THEN
INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
VALUES (TG_TABLE_NAME, NEW.id, 'CREATE', row_to_json(NEW),
COALESCE(current_setting('app.current_user_id', true)::uuid, NULL));
RETURN NEW;
END IF;
RETURN NULL;
END;

$$
LANGUAGE plpgsql;

-- Triggers de auditoría para tablas importantes
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_reservations AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_guests AFTER INSERT OR UPDATE OR DELETE ON guests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_rooms AFTER INSERT OR UPDATE OR DELETE ON rooms
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Función para calcular balance de reservación
CREATE OR REPLACE FUNCTION calculate_reservation_balance()
RETURNS TRIGGER AS
$$

BEGIN
-- Actualizar el paid_amount en la reservación
UPDATE reservations
SET paid_amount = (
SELECT COALESCE(SUM(amount), 0)
FROM reservation_payments
WHERE reservation_id = COALESCE(NEW.reservation_id, OLD.reservation_id)
)
WHERE id = COALESCE(NEW.reservation_id, OLD.reservation_id);

    RETURN COALESCE(NEW, OLD);

END;

$$
LANGUAGE plpgsql;

-- Trigger para calcular balance automáticamente
CREATE TRIGGER update_reservation_balance
    AFTER INSERT OR UPDATE OR DELETE ON reservation_payments
    FOR EACH ROW EXECUTE FUNCTION calculate_reservation_balance();

-- Función para generar reportes diarios automáticamente
CREATE OR REPLACE FUNCTION generate_daily_report(branch_uuid UUID, report_date_param DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS
$$

DECLARE
total_rooms_count INTEGER;
occupied_count INTEGER;
available_count INTEGER;
maintenance_count INTEGER;
checkins_count INTEGER;
checkouts_count INTEGER;
revenue_amount DECIMAL(10,2);
expenses_amount DECIMAL(10,2);
occupancy_rate_calc DECIMAL(5,2);
BEGIN
-- Obtener estadísticas de habitaciones
SELECT
COUNT(\*),
COUNT(CASE WHEN rs.status = 'ocupada' THEN 1 END),
COUNT(CASE WHEN rs.status = 'disponible' THEN 1 END),
COUNT(CASE WHEN rs.status IN ('mantenimiento', 'fuera_servicio') THEN 1 END)
INTO total_rooms_count, occupied_count, available_count, maintenance_count
FROM rooms r
JOIN room_status rs ON r.status_id = rs.id
WHERE r.branch_id = branch_uuid AND r.is_active = true;

    -- Calcular tasa de ocupación
    occupancy_rate_calc = CASE
        WHEN total_rooms_count > 0 THEN ROUND((occupied_count::DECIMAL / total_rooms_count::DECIMAL) * 100, 2)
        ELSE 0
    END;

    -- Contar check-ins del día
    SELECT COUNT(*)
    INTO checkins_count
    FROM checkin_orders co
    WHERE DATE(co.check_in_time) = report_date_param
    AND EXISTS (
        SELECT 1 FROM rooms r WHERE r.id = co.room_id AND r.branch_id = branch_uuid
    );

    -- Contar check-outs del día
    SELECT COUNT(*)
    INTO checkouts_count
    FROM checkout_orders co
    WHERE DATE(co.checkout_time) = report_date_param
    AND EXISTS (
        SELECT 1 FROM checkin_orders ci
        JOIN rooms r ON ci.room_id = r.id
        WHERE ci.id = co.checkin_order_id AND r.branch_id = branch_uuid
    );

    -- Calcular ingresos del día
    SELECT
        COALESCE(SUM(rp.amount), 0) + COALESCE(SUM(qc.amount), 0)
    INTO revenue_amount
    FROM reservation_payments rp
    FULL OUTER JOIN quick_checkins qc ON false -- Para unir ambas tablas
    WHERE (DATE(rp.payment_date) = report_date_param AND EXISTS (
        SELECT 1 FROM reservations res WHERE res.id = rp.reservation_id AND res.branch_id = branch_uuid
    )) OR (DATE(qc.created_at) = report_date_param AND qc.branch_id = branch_uuid);

    -- Calcular gastos del día
    SELECT COALESCE(SUM(amount), 0)
    INTO expenses_amount
    FROM expenses
    WHERE branch_id = branch_uuid AND expense_date = report_date_param;

    -- Insertar o actualizar el reporte diario
    INSERT INTO daily_reports (
        branch_id, report_date, total_checkins, total_checkouts,
        total_revenue, total_expenses, occupancy_rate,
        available_rooms, occupied_rooms, maintenance_rooms
    ) VALUES (
        branch_uuid, report_date_param, checkins_count, checkouts_count,
        revenue_amount, expenses_amount, occupancy_rate_calc,
        available_count, occupied_count, maintenance_count
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
        maintenance_rooms = EXCLUDED.maintenance_rooms;

END;

$$
LANGUAGE plpgsql;

-- Función para actualizar estado de habitación al hacer check-in
CREATE OR REPLACE FUNCTION update_room_status_checkin()
RETURNS TRIGGER AS
$$

BEGIN
-- Cambiar estado de la habitación a ocupada
UPDATE rooms
SET status_id = (SELECT id FROM room_status WHERE status = 'ocupada')
WHERE id = NEW.room_id;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

-- Trigger para cambiar estado en check-in
CREATE TRIGGER update_room_status_on_checkin
    AFTER INSERT ON checkin_orders
    FOR EACH ROW EXECUTE FUNCTION update_room_status_checkin();

-- Función para actualizar estado de habitación al hacer check-out
CREATE OR REPLACE FUNCTION update_room_status_checkout()
RETURNS TRIGGER AS
$$

BEGIN
-- Cambiar estado de la habitación a limpieza
UPDATE rooms
SET status_id = (SELECT id FROM room_status WHERE status = 'limpieza')
WHERE id = (SELECT room_id FROM checkin_orders WHERE id = NEW.checkin_order_id);

    -- Actualizar el actual_checkout en checkin_orders
    UPDATE checkin_orders
    SET actual_checkout = NEW.checkout_time
    WHERE id = NEW.checkin_order_id;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

-- Trigger para cambiar estado en check-out
CREATE TRIGGER update_room_status_on_checkout
    AFTER INSERT ON checkout_orders
    FOR EACH ROW EXECUTE FUNCTION update_room_status_checkout();

-- =====================================================
-- 7. FUNCIONES ÚTILES PARA LA APLICACIÓN
-- =====================================================

-- Función para obtener habitaciones disponibles en un rango de fechas
CREATE OR REPLACE FUNCTION get_available_rooms(
    branch_uuid UUID,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    room_id UUID,
    room_number VARCHAR(10),
    base_price DECIMAL(10,2),
    max_occupancy INTEGER
) AS
$$

BEGIN
RETURN QUERY
SELECT
r.id,
r.room_number,
r.base_price,
r.max_occupancy
FROM rooms r
JOIN room_status rs ON r.status_id = rs.id
WHERE r.branch_id = branch_uuid
AND r.is_active = true
AND rs.is_available = true
AND NOT EXISTS (
-- No debe tener reservaciones confirmadas en el rango
SELECT 1 FROM reservations res
JOIN reservation_status rst ON res.status_id = rst.id
WHERE res.room_id = r.id
AND rst.status IN ('confirmada', 'en_uso')
AND NOT (res.check_out_date <= start_date OR res.check_in_date >= end_date)
)
AND NOT EXISTS (
-- No debe tener check-ins activos en el rango
SELECT 1 FROM checkin_orders co
WHERE co.room_id = r.id
AND co.actual_checkout IS NULL
AND NOT (co.expected_checkout <= start_date OR DATE(co.check_in_time) >= end_date)
);
END;

$$
LANGUAGE plpgsql;



-- Función para calcular ingresos por período
CREATE OR REPLACE FUNCTION calculate_revenue_by_period(
    branch_uuid UUID,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    room_revenue DECIMAL(10,2),
    service_revenue DECIMAL(10,2),
    total_revenue DECIMAL(10,2),
    total_expenses DECIMAL(10,2),
    net_profit DECIMAL(10,2)
) AS
$$

DECLARE
room_rev DECIMAL(10,2) := 0;
service_rev DECIMAL(10,2) := 0;
total_rev DECIMAL(10,2) := 0;
total_exp DECIMAL(10,2) := 0;
net_prof DECIMAL(10,2) := 0;
BEGIN
-- Ingresos por habitaciones (reservaciones)
SELECT COALESCE(SUM(rp.amount), 0)
INTO room_rev
FROM reservation_payments rp
JOIN reservations res ON rp.reservation_id = res.id
WHERE res.branch_id = branch_uuid
AND DATE(rp.payment_date) BETWEEN start_date AND end_date;

    -- Ingresos por check-ins rápidos
    SELECT COALESCE(SUM(qc.amount), 0)
    INTO service_rev
    FROM quick_checkins qc
    WHERE qc.branch_id = branch_uuid
        AND DATE(qc.created_at) BETWEEN start_date AND end_date;

    -- Total de ingresos
    total_rev := room_rev + service_rev;

    -- Total de gastos
    SELECT COALESCE(SUM(amount), 0)
    INTO total_exp
    FROM expenses
    WHERE branch_id = branch_uuid
        AND expense_date BETWEEN start_date AND end_date;

    -- Ganancia neta
    net_prof := total_rev - total_exp;

    RETURN QUERY SELECT room_rev, service_rev, total_rev, total_exp, net_prof;

END;

$$
LANGUAGE plpgsql;

-- Función para obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(branch_uuid UUID)
RETURNS TABLE (
    total_rooms INTEGER,
    occupied_rooms INTEGER,
    available_rooms INTEGER,
    maintenance_rooms INTEGER,
    occupancy_rate DECIMAL(5,2),
    today_checkins INTEGER,
    today_checkouts INTEGER,
    today_revenue DECIMAL(10,2),
    pending_reservations INTEGER,
    low_stock_items INTEGER
) AS
$$

BEGIN
RETURN QUERY
WITH room_stats AS (
SELECT
COUNT(_) as total,
COUNT(CASE WHEN rs.status = 'ocupada' THEN 1 END) as occupied,
COUNT(CASE WHEN rs.status = 'disponible' THEN 1 END) as available,
COUNT(CASE WHEN rs.status IN ('mantenimiento', 'fuera_servicio') THEN 1 END) as maintenance
FROM rooms r
JOIN room_status rs ON r.status_id = rs.id
WHERE r.branch_id = branch_uuid AND r.is_active = true
),
daily_stats AS (
SELECT
COUNT(CASE WHEN DATE(co.check_in_time) = CURRENT_DATE THEN 1 END) as checkins,
COUNT(CASE WHEN DATE(cho.checkout_time) = CURRENT_DATE THEN 1 END) as checkouts
FROM checkin_orders co
FULL OUTER JOIN checkout_orders cho ON co.id = cho.checkin_order_id
WHERE EXISTS (
SELECT 1 FROM rooms r WHERE r.id = co.room_id AND r.branch_id = branch_uuid
)
),
revenue_today AS (
SELECT
COALESCE(SUM(rp.amount), 0) + COALESCE(SUM(qc.amount), 0) as revenue
FROM reservation_payments rp
FULL OUTER JOIN quick_checkins qc ON false
WHERE (DATE(rp.payment_date) = CURRENT_DATE AND EXISTS (
SELECT 1 FROM reservations res WHERE res.id = rp.reservation_id AND res.branch_id = branch_uuid
)) OR (DATE(qc.created_at) = CURRENT_DATE AND qc.branch_id = branch_uuid)
),
pending_res AS (
SELECT COUNT(_) as pending
FROM reservations res
JOIN reservation_status rs ON res.status_id = rs.id
WHERE res.branch_id = branch_uuid AND rs.status = 'pendiente'
),
low_stock AS (
SELECT COUNT(_) as low_items
FROM supplies s
WHERE s.current_stock <= s.minimum_stock AND s.is_active = true
)
SELECT
rs.total::INTEGER,
rs.occupied::INTEGER,
rs.available::INTEGER,
rs.maintenance::INTEGER,
CASE WHEN rs.total > 0 THEN ROUND((rs.occupied::DECIMAL / rs.total::DECIMAL) _ 100, 2) ELSE 0 END,
ds.checkins::INTEGER,
ds.checkouts::INTEGER,
rt.revenue,
pr.pending::INTEGER,
ls.low_items::INTEGER
FROM room_stats rs, daily_stats ds, revenue_today rt, pending_res pr, low_stock ls;
END;

$$
LANGUAGE plpgsql;

-- =====================================================
-- 8. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para mejorar rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_rooms_branch_id ON rooms(branch_id);
CREATE INDEX idx_rooms_status_id ON rooms(status_id);
CREATE INDEX idx_reservations_branch_id ON reservations(branch_id);
CREATE INDEX idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX idx_reservations_room_id ON reservations(room_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(status_id);
CREATE INDEX idx_checkin_orders_room_id ON checkin_orders(room_id);
CREATE INDEX idx_checkin_orders_date ON checkin_orders(check_in_time);
CREATE INDEX idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX idx_reservation_payments_date ON reservation_payments(payment_date);
CREATE INDEX idx_supply_movements_supply_id ON supply_movements(supply_id);
CREATE INDEX idx_supply_movements_date ON supply_movements(created_at);
CREATE INDEX idx_daily_reports_branch_date ON daily_reports(branch_id, report_date);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_room_availability_room_date ON room_availability(room_id, date);

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_user_branches_user_primary ON user_branches(user_id, is_primary);
CREATE INDEX idx_supplies_category_active ON supplies(category_id, is_active);
CREATE INDEX idx_supplies_stock_check ON supplies(current_stock, minimum_stock) WHERE is_active = true;

-- =====================================================
-- 9. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en tablas principales (opcional, para mayor seguridad)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Ejemplo de política RLS (descomentadas si se quiere usar)
-- CREATE POLICY users_policy ON users
--     USING (auth.uid() = id OR EXISTS (
--         SELECT 1 FROM user_branches ub
--         JOIN users u ON ub.user_id = u.id
--         WHERE u.id = auth.uid() AND ub.branch_id IN (
--             SELECT branch_id FROM user_branches WHERE user_id = users.id
--         )
--     ));

-- =====================================================
-- 10. COMENTARIOS EN TABLAS Y CAMPOS
-- =====================================================

COMMENT ON TABLE users IS 'Usuarios del sistema con roles de administrador o recepción';
COMMENT ON TABLE branches IS 'Sucursales o hoteles del sistema';
COMMENT ON TABLE rooms IS 'Habitaciones disponibles en cada sucursal';
COMMENT ON TABLE guests IS 'Información de huéspedes registrados';
COMMENT ON TABLE reservations IS 'Reservaciones realizadas por huéspedes';
COMMENT ON TABLE checkin_orders IS 'Registro de check-ins realizados';
COMMENT ON TABLE daily_reports IS 'Reportes diarios automáticos de cada sucursal';
COMMENT ON TABLE supplies IS 'Inventario de suministros y productos';
COMMENT ON TABLE audit_logs IS 'Log de auditoría para rastrear cambios importantes';

COMMENT ON COLUMN reservations.reservation_code IS 'Código único generado automáticamente';
COMMENT ON COLUMN rooms.amenities IS 'JSON con amenidades de la habitación'; -- se elimino
COMMENT ON COLUMN guests.emergency_contact IS 'JSON con información de contacto de emergencia'; -- se elimino
COMMENT ON COLUMN hotel_settings.setting_value IS 'Valor de configuración en formato JSON';

-- =====================================================
-- ESTRUCTURA COMPLETADA
-- =====================================================

/*
RESUMEN DE LA ESTRUCTURA:

TABLAS PRINCIPALES:
- users, roles, branches, user_branches
- rooms, room_status, room_availability
- guests, guest_documents
- reservations, reservation_status, reservation_payments
- checkin_orders, checkout_orders, quick_checkins
- payment_methods

SUMINISTROS:
- supplies, supply_categories, supply_movements
- suppliers, inventory_alerts
- snack_categories, snack_items

REPORTES Y CONFIGURACIÓN:
- daily_reports, occupancy_reports, revenue_reports, saved_reports
- expenses, expense_categories
- hotel_settings, audit_logs

VISTAS CREADAS:
- room_details, reservation_details, current_occupancy
- daily_revenue, low_stock_supplies

FUNCIONES PRINCIPALES:
- generate_daily_report()
- get_available_rooms()
- calculate_revenue_by_period()
- get_dashboard_stats()

TRIGGERS AUTOMÁTICOS:
- Actualización de updated_at
- Generación de códigos de reservación
- Control de stock de suministros
- Alertas de inventario bajo
- Auditoría de cambios
- Balance de reservaciones
- Estados de habitaciones en check-in/out

La base de datos está lista para soportar todas las funcionalidades
de tu sistema de hotel con los roles de administrador y recepción.
*/

-----------------------------------------------------------------

-- =====================================================
-- SCRIPT DE DATOS DE PRUEBA PARA HOTEL DEMO
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Verificar si ya hay datos
DO
$$

BEGIN
-- Si no hay sucursales, crear datos de prueba
IF NOT EXISTS (SELECT 1 FROM branches LIMIT 1) THEN

        -- 1. Insertar sucursal de prueba
        INSERT INTO branches (id, name, address, phone, email, manager_name, is_active) VALUES
        ('123e4567-e89b-12d3-a456-426614174000', 'Hotel Demo Lima', 'Av. Ejemplo 123, Lima', '+51 1 234-5678', 'info@hoteldemo.com', 'Gerente Demo', true);

        -- 2. Asignar la sucursal al usuario actual (ajustar el email según tu usuario)
        -- Reemplaza 'tu-email@ejemplo.com' con tu email real de Supabase Auth
        INSERT INTO user_branches (user_id, branch_id, is_primary)
        SELECT u.id, '123e4567-e89b-12d3-a456-426614174000', true
        FROM users u
        WHERE u.email = 'tu-email@ejemplo.com'  -- ⚠️ CAMBIAR POR TU EMAIL REAL
        ON CONFLICT (user_id, branch_id) DO NOTHING;

        -- 3. Insertar habitaciones de prueba
        INSERT INTO rooms (branch_id, room_number, floor, description, base_price, status_id, is_active) VALUES
        ('123e4567-e89b-12d3-a456-426614174000', '101', 1, 'Habitación Estándar Piso 1', 120.00, (SELECT id FROM room_status WHERE status = 'disponible'), true),
        ('123e4567-e89b-12d3-a456-426614174000', '102', 1, 'Habitación Estándar Piso 1', 120.00, (SELECT id FROM room_status WHERE status = 'disponible'), true),
        ('123e4567-e89b-12d3-a456-426614174000', '103', 1, 'Habitación Estándar Piso 1', 120.00, (SELECT id FROM room_status WHERE status = 'limpieza'), true),
        ('123e4567-e89b-12d3-a456-426614174000', '104', 1, 'Habitación Estándar Piso 1', 120.00, (SELECT id FROM room_status WHERE status = 'disponible'), true),
        ('123e4567-e89b-12d3-a456-426614174000', '201', 2, 'Habitación Superior Piso 2', 150.00, (SELECT id FROM room_status WHERE status = 'disponible'), true),
        ('123e4567-e89b-12d3-a456-426614174000', '202', 2, 'Habitación Superior Piso 2', 150.00, (SELECT id FROM room_status WHERE status = 'disponible'), true),
        ('123e4567-e89b-12d3-a456-426614174000', '203', 2, 'Habitación Superior Piso 2', 150.00, (SELECT id FROM room_status WHERE status = 'disponible'), true),
        ('123e4567-e89b-12d3-a456-426614174000', '301', 3, 'Suite Ejecutiva Piso 3', 250.00, (SELECT id FROM room_status WHERE status = 'disponible'), true),
        ('123e4567-e89b-12d3-a456-426614174000', '302', 3, 'Suite Ejecutiva Piso 3', 250.00, (SELECT id FROM room_status WHERE status = 'mantenimiento'), true);

        -- 4. Insertar categorías de snacks si no existen
        INSERT INTO snack_categories (name, is_active) VALUES
        ('Bebidas', true),
        ('Snacks', true),
        ('Servicios Extra', true)
        ON CONFLICT (name) DO NOTHING;

        -- 5. Insertar items de snacks
        INSERT INTO snack_items (name, category_id, price, cost, stock, minimum_stock, is_active) VALUES
        ('Agua Mineral', (SELECT id FROM snack_categories WHERE name = 'Bebidas'), 3.00, 1.50, 50, 10, true),
        ('Coca Cola', (SELECT id FROM snack_categories WHERE name = 'Bebidas'), 5.00, 2.50, 30, 5, true),
        ('Café Americano', (SELECT id FROM snack_categories WHERE name = 'Bebidas'), 8.00, 3.00, 25, 5, true),
        ('Papitas Lays', (SELECT id FROM snack_categories WHERE name = 'Snacks'), 6.00, 3.00, 40, 8, true),
        ('Chocolate Sublime', (SELECT id FROM snack_categories WHERE name = 'Snacks'), 4.50, 2.00, 35, 10, true),
        ('Galletas Oreo', (SELECT id FROM snack_categories WHERE name = 'Snacks'), 7.00, 3.50, 20, 5, true),
        ('Toalla Extra', (SELECT id FROM snack_categories WHERE name = 'Servicios Extra'), 15.00, 5.00, 15, 3, true),
        ('Almohada Extra', (SELECT id FROM snack_categories WHERE name = 'Servicios Extra'), 20.00, 8.00, 10, 2, true)
        ON CONFLICT (name) DO NOTHING;

        RAISE NOTICE 'Datos de prueba insertados exitosamente!';
        RAISE NOTICE 'Sucursal creada: Hotel Demo Lima';
        RAISE NOTICE 'Habitaciones: 9 habitaciones en 3 pisos';
        RAISE NOTICE 'Snacks: 8 items en 3 categorías';
        RAISE NOTICE '⚠️ IMPORTANTE: Actualiza el email en la línea 16 del script con tu email real de Supabase Auth';

    ELSE
        RAISE NOTICE 'Ya existen datos en la base de datos. Script omitido.';
    END IF;

END $$;

-- =====================================================
-- CONSULTAS DE VERIFICACIÓN (opcional)
-- =====================================================

-- Verificar sucursales
SELECT 'SUCURSALES' as tabla, count(\*) as registros FROM branches;

-- Verificar habitaciones por piso
SELECT
'HABITACIONES POR PISO' as info,
floor,
count(\*) as habitaciones,
string_agg(room_number, ', ' ORDER BY room_number) as numeros
FROM rooms
GROUP BY floor
ORDER BY floor;

-- Verificar estados de habitaciones
SELECT
'ESTADOS DE HABITACIONES' as info,
rs.status,
count(\*) as cantidad
FROM rooms r
JOIN room_status rs ON r.status_id = rs.id
GROUP BY rs.status;

-- Verificar snacks por categoría
SELECT
'SNACKS POR CATEGORÍA' as info,
sc.name as categoria,
count(\*) as items,
string_agg(si.name, ', ') as productos
FROM snack_items si
JOIN snack_categories sc ON si.category_id = sc.id
WHERE si.is_active = true
GROUP BY sc.name;

-- Verificar usuarios y sucursales
SELECT
'USUARIOS Y SUCURSALES' as info,
u.email,
u.first_name,
u.last_name,
b.name as sucursal,
ub.is_primary
FROM users u
JOIN user_branches ub ON u.id = ub.user_id
JOIN branches b ON ub.branch_id = b.id;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/\*
INSTRUCCIONES:

1. 📋 ANTES DE EJECUTAR:

   - Ve a la línea 16 del script
   - Cambia 'tu-email@ejemplo.com' por tu email real de Supabase Auth
   - Guarda el script

2. 🚀 EJECUTAR EN SUPABASE:

   - Ve a tu proyecto Supabase
   - Abre el SQL Editor
   - Pega este script completo
   - Haz clic en "Run"

3. ✅ VERIFICAR RESULTADOS:

   - El script mostrará mensajes de confirmación
   - Ejecuta las consultas de verificación al final
   - Deberías ver 9 habitaciones, 8 snacks, y tu usuario asignado

4. 🔄 PROBAR EN LA APP:

   - Refresca tu aplicación
   - Deberías ver las habitaciones reales de la base de datos
   - Puedes hacer check-ins, check-outs y limpiar habitaciones

5. 🐛 SI HAY PROBLEMAS:
   - Verifica que tu usuario esté en la tabla 'users'
   - Verifica que el email coincida exactamente
   - Revisa los logs en la consola del navegador

NOTA: Este script es seguro - solo inserta datos si no existen.
Si ya tienes datos, no los sobreescribirá.
\*/

---

-- =====================================================
-- SCRIPT OFICIAL PARA HOTEL - USUARIOS Y SUCURSALES
-- Solo 2 roles: Administrador y Recepción
-- 4 sucursales en Lima
-- =====================================================

-- 🔧 PASO 1: Crear los 2 roles únicos
INSERT INTO roles (name, description, permissions) VALUES
('administrador', 'Acceso completo al sistema de hotel', '{"all": true, "admin": true, "checkin": true, "checkout": true, "reservations": true, "guests": true, "reports": true, "supplies": true, "settings": true}'),
('recepcion', 'Acceso a operaciones de recepción', '{"checkin": true, "checkout": true, "reservations": true, "guests": true, "reports_view": true, "supplies_view": true}')
ON CONFLICT (name) DO UPDATE SET
description = EXCLUDED.description,
permissions = EXCLUDED.permissions;

-- 🏨 PASO 2: Crear 4 sucursales en Lima
INSERT INTO branches (id, name, address, phone, email, manager_name, is_active) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'Hotel Lima Centro', 'Av. Javier Prado 1234, San Isidro, Lima', '+51 1 234-5678', 'centro@hotellima.com', 'Ana García Mendoza', true),
('234e5678-f90c-23e4-b567-537725285111', 'Hotel Lima Miraflores', 'Av. Larco 567, Miraflores, Lima', '+51 1 345-6789', 'miraflores@hotellima.com', 'Carlos Rodríguez Silva', true),
('345f6789-f01d-34f5-c678-648836396222', 'Hotel Lima Barranco', 'Jr. Unión 890, Barranco, Lima', '+51 1 456-7890', 'barranco@hotellima.com', 'Sofia Martinez Vera', true),
('456f7890-f12e-45f6-d789-759947407333', 'Hotel Lima Aeropuerto', 'Av. Faucett 1200, Callao, Lima', '+51 1 567-8901', 'aeropuerto@hotellima.com', 'Roberto Jiménez Cruz', true)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
address = EXCLUDED.address,
phone = EXCLUDED.phone,
email = EXCLUDED.email,
manager_name = EXCLUDED.manager_name,
is_active = EXCLUDED.is_active;

-- 👥 PASO 3: Crear usuarios oficiales para las 4 sucursales
-- =====================================================
-- SCRIPT CORREGIDO - CREAR USUARIOS CON UUIDs VÁLIDOS
-- =====================================================

DO $$
DECLARE
admin_role_id UUID;
recepcion_role_id UUID;
centro_branch_id UUID := '123e4567-e89b-12d3-a456-426614174000';
miraflores_branch_id UUID := '234e5678-f90c-23e4-b567-537725285111';
barranco_branch_id UUID := '345f6789-f01d-34f5-c678-648836396222';
aeropuerto_branch_id UUID := '456f7890-f12e-45f6-d789-759947407333';
BEGIN
-- Obtener IDs de roles
SELECT id INTO admin_role_id FROM roles WHERE name = 'administrador';
SELECT id INTO recepcion_role_id FROM roles WHERE name = 'recepcion';

    -- Verificar que los roles existen
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Rol administrador no encontrado';
    END IF;

    IF recepcion_role_id IS NULL THEN
        RAISE EXCEPTION 'Rol recepcion no encontrado';
    END IF;

    -- ========================================
    -- 🔑 ADMINISTRADOR PRINCIPAL (acceso a todas las sucursales)
    -- ========================================
    INSERT INTO users (
        email,
        first_name,
        last_name,
        phone,
        role_id,
        is_active
    ) VALUES (
        'admin@hotellima.com',
        'Administrador',
        'Sistema',
        '+51 999 123 456',
        admin_role_id,
        true
    ) ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    -- Asignar administrador a TODAS las sucursales
    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, centro_branch_id, true FROM users u WHERE u.email = 'admin@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, miraflores_branch_id, false FROM users u WHERE u.email = 'admin@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO NOTHING;

    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, barranco_branch_id, false FROM users u WHERE u.email = 'admin@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO NOTHING;

    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, aeropuerto_branch_id, false FROM users u WHERE u.email = 'admin@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO NOTHING;

    -- ========================================
    -- 🏨 RECEPCIONISTA CENTRO
    -- ========================================
    INSERT INTO users (
        email,
        first_name,
        last_name,
        phone,
        role_id,
        is_active
    ) VALUES (
        'recepcion.centro@hotellima.com',
        'María',
        'Fernández López',
        '+51 999 345 678',
        recepcion_role_id,
        true
    ) ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, centro_branch_id, true FROM users u WHERE u.email = 'recepcion.centro@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    -- ========================================
    -- 🏨 RECEPCIONISTA MIRAFLORES
    -- ========================================
    INSERT INTO users (
        email,
        first_name,
        last_name,
        phone,
        role_id,
        is_active
    ) VALUES (
        'recepcion.miraflores@hotellima.com',
        'Carlos',
        'Rodríguez Silva',
        '+51 999 456 789',
        recepcion_role_id,
        true
    ) ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, miraflores_branch_id, true FROM users u WHERE u.email = 'recepcion.miraflores@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    -- ========================================
    -- 🏨 RECEPCIONISTA BARRANCO
    -- ========================================
    INSERT INTO users (
        email,
        first_name,
        last_name,
        phone,
        role_id,
        is_active
    ) VALUES (
        'recepcion.barranco@hotellima.com',
        'Sofia',
        'Martinez Vera',
        '+51 999 567 890',
        recepcion_role_id,
        true
    ) ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, barranco_branch_id, true FROM users u WHERE u.email = 'recepcion.barranco@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    -- ========================================
    -- 🏨 RECEPCIONISTA AEROPUERTO
    -- ========================================
    INSERT INTO users (
        email,
        first_name,
        last_name,
        phone,
        role_id,
        is_active
    ) VALUES (
        'recepcion.aeropuerto@hotellima.com',
        'Roberto',
        'Jiménez Cruz',
        '+51 999 678 901',
        recepcion_role_id,
        true
    ) ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, aeropuerto_branch_id, true FROM users u WHERE u.email = 'recepcion.aeropuerto@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    -- ========================================
    -- 🏨 RECEPCIONISTA MULTITURNO (para probar acceso múltiple)
    -- ========================================
    INSERT INTO users (
        email,
        first_name,
        last_name,
        phone,
        role_id,
        is_active
    ) VALUES (
        'recepcion.multiturno@hotellima.com',
        'Luis',
        'Mendoza Torres',
        '+51 999 789 012',
        recepcion_role_id,
        true
    ) ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    -- Asignar multiturno a Centro y Miraflores
    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, centro_branch_id, true FROM users u WHERE u.email = 'recepcion.multiturno@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    INSERT INTO user_branches (user_id, branch_id, is_primary)
    SELECT u.id, miraflores_branch_id, false FROM users u WHERE u.email = 'recepcion.multiturno@hotellima.com'
    ON CONFLICT (user_id, branch_id) DO NOTHING;

    RAISE NOTICE '✅ 6 usuarios oficiales creados exitosamente!';
    RAISE NOTICE '✅ 4 sucursales configuradas!';

    -- Verificar que se crearon correctamente
    RAISE NOTICE 'Usuarios creados: %', (SELECT COUNT(*) FROM users WHERE email LIKE '%hotellima.com');
    RAISE NOTICE 'Relaciones user_branches: %', (SELECT COUNT(*) FROM user_branches ub JOIN users u ON ub.user_id = u.id WHERE u.email LIKE '%hotellima.com');

END $$;

-- 🏨 PASO 4: Crear habitaciones para todas las sucursales
DO $$
DECLARE
centro_branch_id UUID := '123e4567-e89b-12d3-a456-426614174000';
miraflores_branch_id UUID := '234e5678-f90c-23e4-b567-537725285111';
barranco_branch_id UUID := '345f6789-f01d-34f5-c678-648836396222';
aeropuerto_branch_id UUID := '456f7890-f12e-45f6-d789-759947407333';
disponible_status_id UUID;
limpieza_status_id UUID;
mantenimiento_status_id UUID;
ocupada_status_id UUID;
BEGIN
-- Obtener IDs de estados
SELECT id INTO disponible_status_id FROM room_status WHERE status = 'disponible';
SELECT id INTO limpieza_status_id FROM room_status WHERE status = 'limpieza';
SELECT id INTO mantenimiento_status_id FROM room_status WHERE status = 'mantenimiento';
SELECT id INTO ocupada_status_id FROM room_status WHERE status = 'ocupada';

    -- Verificar que los estados existen
    IF disponible_status_id IS NULL THEN
        RAISE EXCEPTION 'Estado disponible no encontrado';
    END IF;

    -- ===========================================
    -- 🏨 HOTEL LIMA CENTRO (San Isidro)
    -- ===========================================
    INSERT INTO rooms (branch_id, room_number, floor, description, base_price, status_id, is_active) VALUES
    -- Piso 1 - Estándar
    (centro_branch_id, '101', 1, 'Habitación Estándar - 1 cama doble', 120.00, disponible_status_id, true),
    (centro_branch_id, '102', 1, 'Habitación Estándar - 2 camas simples', 120.00, disponible_status_id, true),
    (centro_branch_id, '103', 1, 'Habitación Estándar - 1 cama doble', 120.00, limpieza_status_id, true),
    (centro_branch_id, '104', 1, 'Habitación Estándar - 2 camas simples', 120.00, ocupada_status_id, true),
    -- Piso 2 - Superior
    (centro_branch_id, '201', 2, 'Habitación Superior - 1 cama doble + sofá', 150.00, disponible_status_id, true),
    (centro_branch_id, '202', 2, 'Habitación Superior - 2 camas simples + escritorio', 150.00, disponible_status_id, true),
    (centro_branch_id, '203', 2, 'Habitación Superior - 1 cama doble + balcón', 160.00, disponible_status_id, true),
    -- Piso 3 - Suites
    (centro_branch_id, '301', 3, 'Suite Ejecutiva - Sala + dormitorio', 250.00, disponible_status_id, true),
    (centro_branch_id, '302', 3, 'Suite Premium - 2 dormitorios + terraza', 280.00, mantenimiento_status_id, true),

    -- ===========================================
    -- 🏖️ HOTEL LIMA MIRAFLORES (Vista al mar)
    -- ===========================================
    -- Piso 1 - Estándar
    (miraflores_branch_id, '101', 1, 'Habitación Estándar - 1 cama doble', 140.00, disponible_status_id, true),
    (miraflores_branch_id, '102', 1, 'Habitación Estándar - 2 camas simples', 140.00, disponible_status_id, true),
    (miraflores_branch_id, '103', 1, 'Habitación Estándar - Vista parcial al mar', 160.00, ocupada_status_id, true),
    (miraflores_branch_id, '104', 1, 'Habitación Estándar - 2 camas simples', 140.00, limpieza_status_id, true),
    -- Piso 2 - Superior con vista
    (miraflores_branch_id, '201', 2, 'Habitación Superior - Vista al mar + balcón', 180.00, disponible_status_id, true),
    (miraflores_branch_id, '202', 2, 'Habitación Superior - Vista al mar + jacuzzi', 220.00, disponible_status_id, true),
    (miraflores_branch_id, '203', 2, 'Habitación Superior - 2 camas + terraza', 190.00, disponible_status_id, true),
    -- Piso 3 - Suites con vista panorámica
    (miraflores_branch_id, '301', 3, 'Suite Ocean View - Vista panorámica', 350.00, disponible_status_id, true),
    (miraflores_branch_id, '302', 3, 'Suite Premium - 2 dormitorios + terraza privada', 380.00, disponible_status_id, true),

    -- ===========================================
    -- 🎨 HOTEL LIMA BARRANCO (Bohemio/Cultural)
    -- ===========================================
    -- Piso 1 - Temático
    (barranco_branch_id, '101', 1, 'Habitación Arte - Decoración cultural', 110.00, disponible_status_id, true),
    (barranco_branch_id, '102', 1, 'Habitación Música - Temática musical', 110.00, disponible_status_id, true),
    (barranco_branch_id, '103', 1, 'Habitación Colonial - Estilo clásico', 120.00, disponible_status_id, true),
    (barranco_branch_id, '104', 1, 'Habitación Moderna - Minimalista', 115.00, limpieza_status_id, true),
    -- Piso 2 - Superior temático
    (barranco_branch_id, '201', 2, 'Suite Artista - Con estudio de arte', 180.00, disponible_status_id, true),
    (barranco_branch_id, '202', 2, 'Suite Bohemia - Terraza + vista al mar', 200.00, ocupada_status_id, true),
    (barranco_branch_id, '203', 2, 'Suite Cultural - Biblioteca + balcón', 190.00, disponible_status_id, true),

    -- ===========================================
    -- ✈️ HOTEL LIMA AEROPUERTO (Business/Transit)
    -- ===========================================
    -- Piso 1 - Business
    (aeropuerto_branch_id, '101', 1, 'Habitación Business - Escritorio + WiFi premium', 100.00, disponible_status_id, true),
    (aeropuerto_branch_id, '102', 1, 'Habitación Business - 2 camas + área trabajo', 100.00, disponible_status_id, true),
    (aeropuerto_branch_id, '103', 1, 'Habitación Transit - Estadía corta', 80.00, disponible_status_id, true),
    (aeropuerto_branch_id, '104', 1, 'Habitación Transit - Descanso rápido', 80.00, limpieza_status_id, true),
    (aeropuerto_branch_id, '105', 1, 'Habitación Business - Suite compacta', 120.00, disponible_status_id, true),
    -- Piso 2 - Suites ejecutivas
    (aeropuerto_branch_id, '201', 2, 'Suite Ejecutiva - Sala de reuniones', 180.00, disponible_status_id, true),
    (aeropuerto_branch_id, '202', 2, 'Suite VIP - Acceso fast track', 220.00, disponible_status_id, true),
    (aeropuerto_branch_id, '203', 2, 'Suite Layover - 24h check-out', 150.00, mantenimiento_status_id, true)

    ON CONFLICT (branch_id, room_number) DO UPDATE SET
        description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        updated_at = NOW();

    -- Mostrar estadísticas de creación
    RAISE NOTICE '🏨 Habitaciones creadas para las 4 sucursales!';
    RAISE NOTICE 'Centro: % habitaciones', (SELECT COUNT(*) FROM rooms WHERE branch_id = centro_branch_id);
    RAISE NOTICE 'Miraflores: % habitaciones', (SELECT COUNT(*) FROM rooms WHERE branch_id = miraflores_branch_id);
    RAISE NOTICE 'Barranco: % habitaciones', (SELECT COUNT(*) FROM rooms WHERE branch_id = barranco_branch_id);
    RAISE NOTICE 'Aeropuerto: % habitaciones', (SELECT COUNT(*) FROM rooms WHERE branch_id = aeropuerto_branch_id);
    RAISE NOTICE 'Total habitaciones: %', (SELECT COUNT(*) FROM rooms WHERE branch_id IN (centro_branch_id, miraflores_branch_id, barranco_branch_id, aeropuerto_branch_id));

END $$;

-- 📊 PASO 5: Verificar la creación completa
SELECT
'🎯 USUARIOS CREADOS' as seccion,
u.email,
u.first_name || ' ' || u.last_name as nombre_completo,
r.name as rol,
string_agg(b.name, ' | ' ORDER BY ub.is_primary DESC) as sucursales
FROM users u
JOIN roles r ON u.role_id = r.id
LEFT JOIN user_branches ub ON u.id = ub.user_id
LEFT JOIN branches b ON ub.branch_id = b.id
WHERE u.email LIKE '%hotellima.com'
GROUP BY u.id, u.email, u.first_name, u.last_name, r.name
ORDER BY r.name DESC, u.email;

-- 📊 Resumen por sucursal
SELECT
'🏨 RESUMEN POR SUCURSAL' as seccion,
b.name as sucursal,
COUNT(r.id) as total_habitaciones,
COUNT(CASE WHEN rs.status = 'disponible' THEN 1 END) as disponibles,
COUNT(CASE WHEN rs.status = 'ocupada' THEN 1 END) as ocupadas,
COUNT(CASE WHEN rs.status = 'limpieza' THEN 1 END) as limpieza,
COUNT(CASE WHEN rs.status = 'mantenimiento' THEN 1 END) as mantenimiento,
ROUND(AVG(r.base_price), 2) as precio_promedio
FROM branches b
LEFT JOIN rooms r ON b.id = r.branch_id
LEFT JOIN room_status rs ON r.status_id = rs.id
WHERE b.name LIKE 'Hotel Lima%'
GROUP BY b.id, b.name
ORDER BY b.name;

-- =====================================================
-- 🔐 CREDENCIALES PARA SUPABASE AUTH
-- =====================================================

/\*
🔥 CREAR ESTOS USUARIOS EN SUPABASE AUTH DASHBOARD:

┌─────────────────────────────────────────┬─────────────┬──────────────────┐
│ EMAIL │ CONTRASEÑA │ ROL │
├─────────────────────────────────────────┼─────────────┼──────────────────┤
│ admin@hotellima.com │ Admin123! │ Administrador │
│ recepcion.centro@hotellima.com │ Recep123! │ Recepción │
│ recepcion.miraflores@hotellima.com │ Recep123! │ Recepción │
│ recepcion.barranco@hotellima.com │ Recep123! │ Recepción │
│ recepcion.aeropuerto@hotellima.com │ Recep123! │ Recepción │
│ recepcion.multiturno@hotellima.com │ Recep123! │ Recepción │
└─────────────────────────────────────────┴─────────────┴──────────────────┘

🏨 SUCURSALES CREADAS:
✅ Hotel Lima Centro (San Isidro) - 9 habitaciones
✅ Hotel Lima Miraflores - 9 habitaciones  
✅ Hotel Lima Barranco - 7 habitaciones
✅ Hotel Lima Aeropuerto - 8 habitaciones

TOTAL: 33 habitaciones con estados variados para testing

🎯 CARACTERÍSTICAS:
• Admin tiene acceso a todas las sucursales
• Cada recepcionista está asignado a su sucursal específica
• recepcion.multiturno tiene acceso a Centro y Miraflores
• Precios variados por ubicación y tipo de habitación
• Estados realistas (disponible, ocupada, limpieza, mantenimiento)

📝 PRÓXIMOS PASOS:

1. Ejecutar este script en Supabase SQL Editor
2. Crear usuarios en Authentication > Users
3. Probar login con cualquier usuario
4. Verificar acceso por sucursal
   \*/

---

-- =====================================================
-- SCRIPT PARA CORREGIR SUMINISTROS POR SUCURSAL
-- Agregar branch_id a supplies y reorganizar la estructura
-- =====================================================

-- PASO 1: Agregar columna branch_id a la tabla supplies
ALTER TABLE supplies
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- PASO 2: Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_supplies_branch_id ON supplies(branch_id);

-- PASO 3: Actualizar supplies existentes (si los hay) asignándolos a la primera sucursal
UPDATE supplies
SET branch_id = (SELECT id FROM branches WHERE is_active = true ORDER BY created_at LIMIT 1)
WHERE branch_id IS NULL;

-- PASO 4: Hacer la columna branch_id obligatoria
ALTER TABLE supplies
ALTER COLUMN branch_id SET NOT NULL;

-- PASO 5: Crear constraint único para evitar duplicados de SKU por sucursal
-- (En caso de que uses SKUs únicos por sucursal)
ALTER TABLE supplies
DROP CONSTRAINT IF EXISTS unique_sku_per_branch;

-- Crear constraint sin DEFERRABLE para permitir ON CONFLICT
ALTER TABLE supplies
ADD CONSTRAINT unique_sku_per_branch
UNIQUE (branch_id, sku);

-- PASO 6: Actualizar la vista de stock bajo para incluir sucursal
DROP VIEW IF EXISTS low_stock_supplies;

CREATE VIEW low_stock_supplies AS
SELECT
s.id,
s.name,
s.current_stock,
s.minimum_stock,
sc.name as category_name,
sup.name as supplier_name,
b.name as branch_name,
(s.minimum_stock - s.current_stock) as units_needed
FROM supplies s
JOIN supply_categories sc ON s.category_id = sc.id
JOIN branches b ON s.branch_id = b.id
LEFT JOIN suppliers sup ON s.supplier_id = sup.id
WHERE s.current_stock <= s.minimum_stock
AND s.is_active = true
ORDER BY b.name, s.name;

-- PASO 7: Actualizar la función de alertas de inventario para incluir sucursal
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
-- Verificar si el stock está por debajo del mínimo
IF NEW.current_stock <= NEW.minimum_stock THEN
INSERT INTO inventory_alerts (supply_id, alert_type, message)
VALUES (
NEW.id,
CASE
WHEN NEW.current_stock = 0 THEN 'out_of_stock'
ELSE 'low_stock'
END,
CASE
WHEN NEW.current_stock = 0 THEN
'Suministro agotado en ' || (SELECT name FROM branches WHERE id = NEW.branch_id) || ': ' || NEW.name
ELSE
'Stock bajo en ' || (SELECT name FROM branches WHERE id = NEW.branch_id) || ': ' || NEW.name ||
' (Stock actual: ' || NEW.current_stock || ', Mínimo: ' || NEW.minimum_stock || ')'
END
)
ON CONFLICT DO NOTHING;
END IF;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

-- PASO 8: Crear función para obtener suministros por sucursal
CREATE OR REPLACE FUNCTION get_supplies_by_branch(branch_uuid UUID)
RETURNS TABLE (
    supply_id UUID,
    supply_name VARCHAR(100),
    category_name VARCHAR(100),
    unit_of_measure VARCHAR(20),
    current_stock INTEGER,
    minimum_stock INTEGER,
    unit_cost DECIMAL(10,2),
    supplier_name VARCHAR(100),
    sku VARCHAR(50),
    stock_status VARCHAR(20)
) AS
$$

BEGIN
RETURN QUERY
SELECT
s.id,
s.name,
sc.name,
s.unit_of_measure,
s.current_stock,
s.minimum_stock,
s.unit_cost,
sup.name,
s.sku,
CASE
WHEN s.current_stock = 0 THEN 'agotado'
WHEN s.current_stock <= s.minimum_stock THEN 'bajo'
WHEN s.current_stock > s.minimum_stock \* 2 THEN 'alto'
ELSE 'normal'
END
FROM supplies s
JOIN supply_categories sc ON s.category_id = sc.id
LEFT JOIN suppliers sup ON s.supplier_id = sup.id
WHERE s.branch_id = branch_uuid
AND s.is_active = true
ORDER BY sc.name, s.name;
END;

$$
LANGUAGE plpgsql;

-- PASO 9: Insertar suministros básicos para cada sucursal
DO
$$

DECLARE
centro_branch_id UUID := '123e4567-e89b-12d3-a456-426614174000';
miraflores_branch_id UUID := '234e5678-f90c-23e4-b567-537725285111';
barranco_branch_id UUID := '345f6789-f01d-34f5-c678-648836396222';
aeropuerto_branch_id UUID := '456f7890-f12e-45f6-d789-759947407333';
limpieza_cat_id UUID;
amenidades_cat_id UUID;
mantenimiento_cat_id UUID;
oficina_cat_id UUID;
BEGIN
-- Crear categorías si no existen (sin ON CONFLICT)
INSERT INTO supply_categories (name, is_active)
SELECT 'Limpieza', true WHERE NOT EXISTS (SELECT 1 FROM supply_categories WHERE name = 'Limpieza');

    INSERT INTO supply_categories (name, is_active)
    SELECT 'Amenidades', true WHERE NOT EXISTS (SELECT 1 FROM supply_categories WHERE name = 'Amenidades');

    INSERT INTO supply_categories (name, is_active)
    SELECT 'Mantenimiento', true WHERE NOT EXISTS (SELECT 1 FROM supply_categories WHERE name = 'Mantenimiento');

    INSERT INTO supply_categories (name, is_active)
    SELECT 'Oficina', true WHERE NOT EXISTS (SELECT 1 FROM supply_categories WHERE name = 'Oficina');

    -- Obtener IDs de categorías
    SELECT id INTO limpieza_cat_id FROM supply_categories WHERE name = 'Limpieza';
    SELECT id INTO amenidades_cat_id FROM supply_categories WHERE name = 'Amenidades';
    SELECT id INTO mantenimiento_cat_id FROM supply_categories WHERE name = 'Mantenimiento';
    SELECT id INTO oficina_cat_id FROM supply_categories WHERE name = 'Oficina';

    -- Eliminar suministros existentes para evitar conflictos
    DELETE FROM supplies WHERE branch_id IN (centro_branch_id, miraflores_branch_id, barranco_branch_id, aeropuerto_branch_id);

    -- Insertar suministros para CENTRO
    INSERT INTO supplies (branch_id, name, category_id, unit_of_measure, minimum_stock, current_stock, unit_cost, sku, is_active) VALUES
    -- Limpieza Centro
    (centro_branch_id, 'Detergente Multiuso', limpieza_cat_id, 'Litros', 10, 25, 12.50, 'LIM-001-CTR', true),
    (centro_branch_id, 'Papel Higiénico', limpieza_cat_id, 'Rollos', 50, 120, 2.80, 'LIM-002-CTR', true),
    (centro_branch_id, 'Toallas de Limpieza', limpieza_cat_id, 'Unidades', 20, 45, 8.90, 'LIM-003-CTR', true),
    (centro_branch_id, 'Desinfectante', limpieza_cat_id, 'Litros', 8, 18, 15.20, 'LIM-004-CTR', true),
    -- Amenidades Centro
    (centro_branch_id, 'Shampoo Individual', amenidades_cat_id, 'Unidades', 30, 80, 3.50, 'AME-001-CTR', true),
    (centro_branch_id, 'Jabón Corporal', amenidades_cat_id, 'Unidades', 30, 75, 3.20, 'AME-002-CTR', true),
    (centro_branch_id, 'Toallas Baño', amenidades_cat_id, 'Unidades', 15, 35, 25.00, 'AME-003-CTR', true),
    (centro_branch_id, 'Zapatillas Desechables', amenidades_cat_id, 'Pares', 25, 60, 4.50, 'AME-004-CTR', true),

    -- Insertar suministros para MIRAFLORES
    -- Limpieza Miraflores
    (miraflores_branch_id, 'Detergente Multiuso', limpieza_cat_id, 'Litros', 12, 30, 12.50, 'LIM-001-MIR', true),
    (miraflores_branch_id, 'Papel Higiénico Premium', limpieza_cat_id, 'Rollos', 60, 140, 3.20, 'LIM-002-MIR', true),
    (miraflores_branch_id, 'Toallas de Limpieza', limpieza_cat_id, 'Unidades', 25, 50, 8.90, 'LIM-003-MIR', true),
    (miraflores_branch_id, 'Desinfectante', limpieza_cat_id, 'Litros', 10, 22, 15.20, 'LIM-004-MIR', true),
    -- Amenidades Miraflores (más premium)
    (miraflores_branch_id, 'Shampoo Premium', amenidades_cat_id, 'Unidades', 35, 90, 5.50, 'AME-001-MIR', true),
    (miraflores_branch_id, 'Acondicionador Premium', amenidades_cat_id, 'Unidades', 35, 85, 5.80, 'AME-002-MIR', true),
    (miraflores_branch_id, 'Toallas Baño Premium', amenidades_cat_id, 'Unidades', 18, 40, 35.00, 'AME-003-MIR', true),
    (miraflores_branch_id, 'Bata de Baño', amenidades_cat_id, 'Unidades', 10, 25, 45.00, 'AME-004-MIR', true),

    -- Insertar suministros para BARRANCO
    -- Limpieza Barranco
    (barranco_branch_id, 'Detergente Ecológico', limpieza_cat_id, 'Litros', 8, 20, 14.00, 'LIM-001-BAR', true),
    (barranco_branch_id, 'Papel Higiénico', limpieza_cat_id, 'Rollos', 40, 95, 2.80, 'LIM-002-BAR', true),
    (barranco_branch_id, 'Toallas Microfibra', limpieza_cat_id, 'Unidades', 15, 32, 12.50, 'LIM-003-BAR', true),
    -- Amenidades Barranco (temático/artístico)
    (barranco_branch_id, 'Shampoo Artesanal', amenidades_cat_id, 'Unidades', 25, 65, 6.80, 'AME-001-BAR', true),
    (barranco_branch_id, 'Jabón Artesanal', amenidades_cat_id, 'Unidades', 25, 60, 7.20, 'AME-002-BAR', true),
    (barranco_branch_id, 'Toallas Algodón Orgánico', amenidades_cat_id, 'Unidades', 12, 28, 28.00, 'AME-003-BAR', true),

    -- Insertar suministros para AEROPUERTO
    -- Limpieza Aeropuerto
    (aeropuerto_branch_id, 'Detergente Rápido', limpieza_cat_id, 'Litros', 15, 35, 13.80, 'LIM-001-AER', true),
    (aeropuerto_branch_id, 'Papel Higiénico', limpieza_cat_id, 'Rollos', 70, 160, 2.80, 'LIM-002-AER', true),
    (aeropuerto_branch_id, 'Desinfectante Instantáneo', limpieza_cat_id, 'Litros', 12, 28, 18.50, 'LIM-004-AER', true),
    -- Amenidades Aeropuerto (prácticas/business)
    (aeropuerto_branch_id, 'Kit de Viaje Completo', amenidades_cat_id, 'Unidades', 40, 95, 8.50, 'AME-001-AER', true),
    (aeropuerto_branch_id, 'Toallas Compactas', amenidades_cat_id, 'Unidades', 20, 55, 18.00, 'AME-002-AER', true),
    (aeropuerto_branch_id, 'Zapatillas Premium', amenidades_cat_id, 'Pares', 30, 75, 6.50, 'AME-003-AER', true);

    -- No usar ON CONFLICT ya que eliminamos los datos previamente

    RAISE NOTICE 'Suministros creados para las 4 sucursales!';
    RAISE NOTICE 'Centro: % suministros', (SELECT COUNT(*) FROM supplies WHERE branch_id = centro_branch_id);
    RAISE NOTICE 'Miraflores: % suministros', (SELECT COUNT(*) FROM supplies WHERE branch_id = miraflores_branch_id);
    RAISE NOTICE 'Barranco: % suministros', (SELECT COUNT(*) FROM supplies WHERE branch_id = barranco_branch_id);
    RAISE NOTICE 'Aeropuerto: % suministros', (SELECT COUNT(*) FROM supplies WHERE branch_id = aeropuerto_branch_id);

END $$;

-- PASO 10: Consulta de verificación
SELECT
'VERIFICACIÓN DE SUMINISTROS POR SUCURSAL' as seccion,
b.name as sucursal,
COUNT(s.id) as total_suministros,
COUNT(CASE WHEN s.current_stock <= s.minimum_stock THEN 1 END) as stock_bajo,
ROUND(AVG(s.unit_cost), 2) as costo_promedio
FROM branches b
LEFT JOIN supplies s ON b.id = s.branch_id
WHERE b.name LIKE 'Hotel Lima%'
GROUP BY b.id, b.name
ORDER BY b.name;

-- PASO 11: Ver detalles de suministros por sucursal
SELECT
b.name as sucursal,
sc.name as categoria,
s.name as suministro,
s.current_stock,
s.minimum_stock,
s.unit_cost,
s.sku,
CASE
WHEN s.current_stock = 0 THEN '🔴 AGOTADO'
WHEN s.current_stock <= s.minimum_stock THEN '🟡 BAJO'
ELSE '🟢 OK'
END as estado
FROM supplies s
JOIN branches b ON s.branch_id = b.id
JOIN supply_categories sc ON s.category_id = sc.id
WHERE b.name LIKE 'Hotel Lima%'
ORDER BY b.name, sc.name, s.name;

-- =====================================================
-- FUNCIONES ADICIONALES ÚTILES
-- =====================================================

-- Función para transferir suministros entre sucursales
CREATE OR REPLACE FUNCTION transfer_supply_between_branches(
from_branch_uuid UUID,
to_branch_uuid UUID,
supply_name_param VARCHAR(100),
quantity_param INTEGER,
transfer_by_user UUID
)
RETURNS BOOLEAN AS $$
DECLARE
from_supply_id UUID;
to_supply_id UUID;
current_stock_from INTEGER;
BEGIN
-- Verificar que hay stock suficiente en la sucursal origen
SELECT id, current_stock INTO from_supply_id, current_stock_from
FROM supplies
WHERE branch_id = from_branch_uuid
AND name = supply_name_param
AND is_active = true;

    IF from_supply_id IS NULL OR current_stock_from < quantity_param THEN
        RETURN FALSE;
    END IF;

    -- Buscar el suministro equivalente en la sucursal destino
    SELECT id INTO to_supply_id
    FROM supplies
    WHERE branch_id = to_branch_uuid
        AND name = supply_name_param
        AND is_active = true;

    IF to_supply_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Realizar la transferencia
    -- Salida de la sucursal origen
    INSERT INTO supply_movements (supply_id, branch_id, movement_type, quantity, reference_document, processed_by)
    VALUES (from_supply_id, from_branch_uuid, 'out', quantity_param, 'Transferencia a otra sucursal', transfer_by_user);

    -- Entrada a la sucursal destino
    INSERT INTO supply_movements (supply_id, branch_id, movement_type, quantity, reference_document, processed_by)
    VALUES (to_supply_id, to_branch_uuid, 'in', quantity_param, 'Transferencia desde otra sucursal', transfer_by_user);

    RETURN TRUE;

END;

$$
LANGUAGE plpgsql;

-- =====================================================
-- CORRECCIÓN ADICIONAL: SNACKS POR SUCURSAL
-- =====================================================

-- PASO 12: Agregar columna branch_id a la tabla snack_items
ALTER TABLE snack_items
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- PASO 13: Crear índice para snack_items
CREATE INDEX IF NOT EXISTS idx_snack_items_branch_id ON snack_items(branch_id);

-- PASO 14: Actualizar snack_items existentes asignándolos a la primera sucursal
UPDATE snack_items
SET branch_id = (SELECT id FROM branches WHERE is_active = true ORDER BY created_at LIMIT 1)
WHERE branch_id IS NULL;

-- PASO 15: Hacer la columna branch_id obligatoria en snack_items
ALTER TABLE snack_items
ALTER COLUMN branch_id SET NOT NULL;

-- PASO 16: Crear constraint único para evitar duplicados de snacks por sucursal
ALTER TABLE snack_items
DROP CONSTRAINT IF EXISTS unique_snack_name_per_branch;

-- Crear constraint sin DEFERRABLE para permitir ON CONFLICT
ALTER TABLE snack_items
ADD CONSTRAINT unique_snack_name_per_branch
UNIQUE (branch_id, name);

-- PASO 17: Insertar snacks específicos para cada sucursal
DO
$$

DECLARE
centro_branch_id UUID := '123e4567-e89b-12d3-a456-426614174000';
miraflores_branch_id UUID := '234e5678-f90c-23e4-b567-537725285111';
barranco_branch_id UUID := '345f6789-f01d-34f5-c678-648836396222';
aeropuerto_branch_id UUID := '456f7890-f12e-45f6-d789-759947407333';
bebidas_cat_id UUID;
snacks_cat_id UUID;
servicios_cat_id UUID;
BEGIN
-- Obtener IDs de categorías
SELECT id INTO bebidas_cat_id FROM snack_categories WHERE name = 'Bebidas';
SELECT id INTO snacks_cat_id FROM snack_categories WHERE name = 'Snacks';
SELECT id INTO servicios_cat_id FROM snack_categories WHERE name = 'Servicios Extra';

    -- Eliminar snacks existentes para evitar conflictos
    DELETE FROM snack_items WHERE branch_id IS NOT NULL;

    -- SNACKS PARA CENTRO (Hotel Lima Centro)
    INSERT INTO snack_items (branch_id, name, category_id, price, cost, stock, minimum_stock, is_active) VALUES
    -- Bebidas Centro
    (centro_branch_id, 'Agua Mineral San Luis', bebidas_cat_id, 3.50, 1.80, 50, 10, true),
    (centro_branch_id, 'Coca Cola Lata', bebidas_cat_id, 5.50, 2.75, 30, 8, true),
    (centro_branch_id, 'Inca Kola Lata', bebidas_cat_id, 5.50, 2.75, 25, 8, true),
    (centro_branch_id, 'Café Americano', bebidas_cat_id, 8.00, 3.50, 20, 5, true),
    -- Snacks Centro
    (centro_branch_id, 'Papitas Lays Clásicas', snacks_cat_id, 6.50, 3.25, 40, 10, true),
    (centro_branch_id, 'Chocolate Sublime', snacks_cat_id, 4.80, 2.40, 35, 8, true),
    (centro_branch_id, 'Galletas Oreo', snacks_cat_id, 7.50, 3.75, 20, 5, true),
    (centro_branch_id, 'Maní Salado', snacks_cat_id, 5.00, 2.50, 25, 6, true),
    -- Servicios Centro
    (centro_branch_id, 'Toalla Extra', servicios_cat_id, 15.00, 6.00, 15, 3, true),
    (centro_branch_id, 'Almohada Extra', servicios_cat_id, 20.00, 8.00, 10, 2, true),

    -- SNACKS PARA MIRAFLORES (Más premium)
    -- Bebidas Miraflores
    (miraflores_branch_id, 'Agua Evian Importada', bebidas_cat_id, 8.00, 4.00, 30, 8, true),
    (miraflores_branch_id, 'Coca Cola Zero', bebidas_cat_id, 6.00, 3.00, 25, 6, true),
    (miraflores_branch_id, 'Cappuccino Premium', bebidas_cat_id, 12.00, 5.50, 15, 4, true),
    (miraflores_branch_id, 'Jugo de Naranja Natural', bebidas_cat_id, 9.50, 4.75, 20, 5, true),
    (miraflores_branch_id, 'Vino Tinto Copa', bebidas_cat_id, 25.00, 12.50, 12, 3, true),
    -- Snacks Miraflores
    (miraflores_branch_id, 'Chocolates Lindt', snacks_cat_id, 15.00, 7.50, 20, 4, true),
    (miraflores_branch_id, 'Nueces Premium Mix', snacks_cat_id, 12.00, 6.00, 18, 4, true),
    (miraflores_branch_id, 'Galletas Artesanales', snacks_cat_id, 10.50, 5.25, 15, 3, true),
    -- Servicios Miraflores
    (miraflores_branch_id, 'Servicio de Planchado', servicios_cat_id, 35.00, 15.00, 10, 2, true),
    (miraflores_branch_id, 'Bata de Lujo', servicios_cat_id, 45.00, 20.00, 8, 2, true),

    -- SNACKS PARA BARRANCO (Temático/Cultural)
    -- Bebidas Barranco
    (barranco_branch_id, 'Chicha Morada Artesanal', bebidas_cat_id, 7.00, 3.50, 20, 5, true),
    (barranco_branch_id, 'Café Peruano Orgánico', bebidas_cat_id, 10.00, 4.50, 18, 4, true),
    (barranco_branch_id, 'Agua de Coco Natural', bebidas_cat_id, 6.50, 3.25, 15, 4, true),
    (barranco_branch_id, 'Pisco Sour Mini', bebidas_cat_id, 18.00, 9.00, 10, 2, true),
    -- Snacks Barranco
    (barranco_branch_id, 'Chifles Artesanales', snacks_cat_id, 5.50, 2.75, 25, 6, true),
    (barranco_branch_id, 'Chocolate Amazónico', snacks_cat_id, 12.00, 6.00, 20, 4, true),
    (barranco_branch_id, 'Cancha Serrana', snacks_cat_id, 4.50, 2.25, 30, 7, true),
    -- Servicios Barranco
    (barranco_branch_id, 'Tour Cultural Info', servicios_cat_id, 25.00, 10.00, 5, 1, true),
    (barranco_branch_id, 'Mapa Artístico', servicios_cat_id, 8.00, 3.00, 12, 3, true),

    -- SNACKS PARA AEROPUERTO (Business/Práctico)
    -- Bebidas Aeropuerto
    (aeropuerto_branch_id, 'Agua Mineral Grande', bebidas_cat_id, 4.00, 2.00, 60, 15, true),
    (aeropuerto_branch_id, 'Red Bull Energy', bebidas_cat_id, 8.50, 4.25, 30, 8, true),
    (aeropuerto_branch_id, 'Café Express To-Go', bebidas_cat_id, 6.50, 3.00, 25, 6, true),
    (aeropuerto_branch_id, 'Gatorade', bebidas_cat_id, 5.50, 2.75, 20, 5, true),
    -- Snacks Aeropuerto
    (aeropuerto_branch_id, 'Barras Energéticas', snacks_cat_id, 7.00, 3.50, 35, 8, true),
    (aeropuerto_branch_id, 'Sandwich Express', snacks_cat_id, 12.00, 6.00, 15, 4, true),
    (aeropuerto_branch_id, 'Mix de Frutos Secos', snacks_cat_id, 8.50, 4.25, 25, 6, true),
    -- Servicios Aeropuerto
    (aeropuerto_branch_id, 'WiFi Premium 24h', servicios_cat_id, 15.00, 5.00, 100, 20, true),
    (aeropuerto_branch_id, 'Late Check-out', servicios_cat_id, 30.00, 10.00, 50, 10, true),
    (aeropuerto_branch_id, 'Transfer Aeropuerto', servicios_cat_id, 25.00, 12.00, 20, 5, true);

    -- No usar ON CONFLICT ya que eliminamos los datos previamente

    RAISE NOTICE 'Snacks creados para las 4 sucursales!';
    RAISE NOTICE 'Centro: % snacks', (SELECT COUNT(*) FROM snack_items WHERE branch_id = centro_branch_id);
    RAISE NOTICE 'Miraflores: % snacks', (SELECT COUNT(*) FROM snack_items WHERE branch_id = miraflores_branch_id);
    RAISE NOTICE 'Barranco: % snacks', (SELECT COUNT(*) FROM snack_items WHERE branch_id = barranco_branch_id);
    RAISE NOTICE 'Aeropuerto: % snacks', (SELECT COUNT(*) FROM snack_items WHERE branch_id = aeropuerto_branch_id);

END $$;

-- PASO 18: Crear función para obtener snacks por sucursal
CREATE OR REPLACE FUNCTION get_snacks_by_branch(branch_uuid UUID)
RETURNS TABLE (
snack_id UUID,
snack_name VARCHAR(100),
category_name VARCHAR(100),
price DECIMAL(10,2),
cost DECIMAL(10,2),
stock INTEGER,
minimum_stock INTEGER,
profit_margin DECIMAL(5,2),
stock_status VARCHAR(20)
) AS $$
BEGIN
RETURN QUERY
SELECT
si.id,
si.name,
sc.name,
si.price,
si.cost,
si.stock,
si.minimum_stock,
CASE WHEN si.cost > 0 THEN ROUND(((si.price - si.cost) / si.cost _ 100), 2) ELSE 0 END,
CASE
WHEN si.stock = 0 THEN 'agotado'
WHEN si.stock <= si.minimum_stock THEN 'bajo'
WHEN si.stock > si.minimum_stock _ 3 THEN 'alto'
ELSE 'normal'
END
FROM snack_items si
JOIN snack_categories sc ON si.category_id = sc.id
WHERE si.branch_id = branch_uuid
AND si.is_active = true
ORDER BY sc.name, si.name;
END;

$$
LANGUAGE plpgsql;

-- PASO 19: Ver resumen de snacks por sucursal
SELECT
    'SNACKS POR SUCURSAL' as seccion,
    b.name as sucursal,
    COUNT(si.id) as total_snacks,
    COUNT(CASE WHEN si.stock <= si.minimum_stock THEN 1 END) as stock_bajo,
    ROUND(AVG(si.price), 2) as precio_promedio,
    ROUND(AVG(si.price - si.cost), 2) as ganancia_promedio
FROM branches b
LEFT JOIN snack_items si ON b.id = si.branch_id
WHERE b.name LIKE 'Hotel Lima%'
GROUP BY b.id, b.name
ORDER BY b.name;

-- PASO 20: Ver detalles de snacks por sucursal y categoría
SELECT
    b.name as sucursal,
    sc.name as categoria,
    si.name as snack,
    si.price as precio,
    si.stock,
    si.minimum_stock,
    CASE
        WHEN si.stock = 0 THEN 'AGOTADO'
        WHEN si.stock <= si.minimum_stock THEN 'BAJO'
        ELSE 'OK'
    END as estado
FROM snack_items si
JOIN branches b ON si.branch_id = b.id
JOIN snack_categories sc ON si.category_id = sc.id
WHERE b.name LIKE 'Hotel Lima%'
ORDER BY b.name, sc.name, si.name;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
🎯 CAMBIOS REALIZADOS:

1. ✅ Agregada columna branch_id a tabla supplies
2. ✅ Creado índice para mejor performance
3. ✅ Actualizada vista low_stock_supplies
4. ✅ Actualizada función check_low_stock()
5. ✅ Creada función get_supplies_by_branch()
6. ✅ Insertados suministros específicos por sucursal
7. ✅ Creada función transfer_supply_between_branches()

🏨 SUMINISTROS POR SUCURSAL:
• Centro: 8 suministros básicos
• Miraflores: 8 suministros premium
• Barranco: 6 suministros artesanales/ecológicos
• Aeropuerto: 6 suministros business/prácticos

📊 EN TU APLICACIÓN REACT:
Ahora puedes filtrar suministros por sucursal usando:
- SELECT * FROM supplies WHERE branch_id = 'uuid_sucursal'
- O usar la función: SELECT * FROM get_supplies_by_branch('uuid_sucursal')

🔄 PRÓXIMOS PASOS:
1. Ejecutar este script en Supabase
2. Verificar con las consultas de validación
3. Actualizar tu código React para filtrar por branch_id
4. Probar funcionalidad de transferencias entre sucursales
*/
$$
