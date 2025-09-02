-- =====================================================
-- NEXBOARD DATABASE SCHEMA - COMPLETE SPECIFICATION
-- Timezone: GMT-5 (Colombia)
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SERVICE ORDERS MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campos Principales
    client_name VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    service_description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Proceso', 'Finalizado', 'Entregado')),
    
    -- Items de Venta (JSON array para múltiples items)
    sale_items JSONB DEFAULT '[]'::jsonb, -- [{"quantity": 1, "description": "Item", "unit_price": 100, "subtotal": 100}]
    
    -- Pagos (JSON array para múltiples métodos)
    payments JSONB DEFAULT '[]'::jsonb, -- [{"method": "Efectivo", "amount": 100, "date": "2025-01-01"}]
    
    -- Resumen Financiero
    total_amount DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    profit DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - total_cost) STORED,
    pending_balance DECIMAL(12,2) DEFAULT 0,
    
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota')
);

-- =====================================================
-- 2. LICENSES MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campos principales
    client_name VARCHAR(255) NOT NULL,
    license_name VARCHAR(255) NOT NULL,
    serial VARCHAR(255),
    installation_date DATE,
    expiration_date DATE,
    max_installations INTEGER DEFAULT 1,
    current_installations INTEGER DEFAULT 0,
    sale_price DECIMAL(12,2),
    cost_price DECIMAL(12,2),
    profit DECIMAL(12,2) GENERATED ALWAYS AS (sale_price - cost_price) STORED,
    provider VARCHAR(255),
    condition VARCHAR(10) CHECK (condition IN ('Nueva', 'Usada')),
    
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota')
);

-- =====================================================
-- 3. PASSWORDS/CREDENTIALS MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campos principales
    website_application VARCHAR(255) NOT NULL,
    username_email VARCHAR(255) NOT NULL,
    password_value TEXT NOT NULL,
    category VARCHAR(20) DEFAULT 'Otros' CHECK (category IN ('Personal', 'Bancos', 'Principal', 'Entretenimiento', 'Otros')),
    notes TEXT,
    
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota')
);

-- =====================================================
-- 4. SERVER CREDENTIALS MODULE (Sin cambios)
-- =====================================================
CREATE TABLE IF NOT EXISTS server_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campos existentes (mantener sin cambios)
    company VARCHAR(255),
    server_name VARCHAR(255) NOT NULL,
    vpn_password VARCHAR(255),
    vpn_ip VARCHAR(45),
    local_name VARCHAR(255),
    users TEXT,
    password VARCHAR(255),
    notes TEXT,
    
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota')
);

-- =====================================================
-- 5. BUDGET EXPENSES MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campos principales
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(20) DEFAULT 'Vivienda' CHECK (category IN ('Vivienda', 'Mi hija', 'Mamá', 'Deudas', 'Sueldo 1', 'Sueldo 2')),
    monthly_due_date INTEGER CHECK (monthly_due_date BETWEEN 1 AND 31),
    notes TEXT,
    
    -- Sistema de pagos y vencimientos
    payment_status VARCHAR(10) DEFAULT 'Próximo' CHECK (payment_status IN ('Vencido', 'Próximo', 'Pagado')),
    last_payment_date DATE,
    next_due_date DATE,
    
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota')
);

-- =====================================================
-- 6. CASUAL EXPENSES MODULE (Sin cambios)
-- =====================================================
CREATE TABLE IF NOT EXISTS casual_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campos existentes (mantener sin cambios)
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota')
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'America/Bogota';
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_passwords_updated_at BEFORE UPDATE ON passwords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_server_credentials_updated_at BEFORE UPDATE ON server_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_expenses_updated_at BEFORE UPDATE ON budget_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_casual_expenses_updated_at BEFORE UPDATE ON casual_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Users can manage their own service orders" ON service_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own licenses" ON licenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own passwords" ON passwords FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own server credentials" ON server_credentials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budget expenses" ON budget_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own casual expenses" ON casual_expenses FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR OPTIMIZATION
-- =====================================================
-- Service Orders
CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_date ON service_orders(date);

-- Licenses
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_licenses_client ON licenses(client_name);

-- Passwords
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_category ON passwords(category);

-- Server Credentials
CREATE INDEX IF NOT EXISTS idx_server_credentials_user_id ON server_credentials(user_id);

-- Budget Expenses
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_status ON budget_expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_due_date ON budget_expenses(next_due_date);

-- Casual Expenses
CREATE INDEX IF NOT EXISTS idx_casual_expenses_user_id ON casual_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_date ON casual_expenses(date);

-- =====================================================
-- VIEWS FOR SPECIAL REQUIREMENTS
-- =====================================================

-- Vista para licencias próximas a vencer (próximos 30 días)
CREATE OR REPLACE VIEW licenses_expiring_soon AS
SELECT 
    id,
    client_name,
    license_name,
    expiration_date,
    (expiration_date - CURRENT_DATE) as days_until_expiration,
    user_id
FROM licenses 
WHERE expiration_date IS NOT NULL 
    AND expiration_date <= CURRENT_DATE + INTERVAL '30 days'
    AND expiration_date >= CURRENT_DATE
ORDER BY expiration_date ASC;

-- Vista para gastos presupuestados con estado de vencimiento
CREATE OR REPLACE VIEW budget_expenses_with_status AS
SELECT 
    *,
    CASE 
        WHEN next_due_date < CURRENT_DATE THEN 'Vencido'
        WHEN next_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Próximo'
        ELSE 'Futuro'
    END as calculated_status
FROM budget_expenses
ORDER BY next_due_date ASC;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE service_orders IS 'Órdenes de servicio con items de venta, pagos y resumen financiero';
COMMENT ON TABLE licenses IS 'Gestión de licencias con seguimiento de vencimientos e instalaciones';
COMMENT ON TABLE passwords IS 'Gestión de credenciales organizadas por categorías';
COMMENT ON TABLE server_credentials IS 'Credenciales de servidores y VPN';
COMMENT ON TABLE budget_expenses IS 'Gastos presupuestados con sistema de vencimientos mensuales';
COMMENT ON TABLE casual_expenses IS 'Gastos casuales no presupuestados';

COMMENT ON VIEW licenses_expiring_soon IS 'Vista de licencias que vencen en los próximos 30 días';
COMMENT ON VIEW budget_expenses_with_status IS 'Vista de gastos presupuestados con estado calculado de vencimiento';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Schema actualizado exitosamente con todas las especificaciones de módulos
-- Timezone configurado para GMT-5 (Colombia)
-- Todos los módulos configurados para funcionar de manera independiente