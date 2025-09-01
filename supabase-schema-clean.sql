-- =====================================================
-- NEXBOARD - ESQUEMA DE BASE DE DATOS LIMPIO
-- Creado desde cero basado en análisis de formularios
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLA: service_orders (Órdenes de Servicio)
-- =====================================================
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'finalizado', 'entregado', 'cancelado')),
    items JSONB NOT NULL DEFAULT '[]',
    payments JSONB NOT NULL DEFAULT '[]',
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_part_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    profit DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: casual_expenses (Gastos Casuales)
-- =====================================================
CREATE TABLE IF NOT EXISTS casual_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'otros' CHECK (category IN ('alimentacion', 'transporte', 'entretenimiento', 'salud', 'compras', 'servicios', 'educacion', 'otros')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: budget_expenses (Gastos Presupuestados)
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'otros',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: licenses (Licencias de Software)
-- =====================================================
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    software_name TEXT NOT NULL,
    license_key TEXT NOT NULL,
    expiry_date DATE,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: passwords (Contraseñas)
-- =====================================================
CREATE TABLE IF NOT EXISTS passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: server_credentials (Credenciales de Servidores)
-- =====================================================
CREATE TABLE IF NOT EXISTS server_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    server_name TEXT NOT NULL,
    ip_address TEXT,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabla
CREATE TRIGGER update_service_orders_updated_at
    BEFORE UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_casual_expenses_updated_at
    BEFORE UPDATE ON casual_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_expenses_updated_at
    BEFORE UPDATE ON budget_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
    BEFORE UPDATE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passwords_updated_at
    BEFORE UPDATE ON passwords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_credentials_updated_at
    BEFORE UPDATE ON server_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES DE ENCRIPTACIÓN PARA CONTRASEÑAS
-- =====================================================

-- Función para encriptar contraseñas
CREATE OR REPLACE FUNCTION encrypt_password(password_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password_text, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar contraseñas
CREATE OR REPLACE FUNCTION verify_password(password_text TEXT, encrypted_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN encrypted_password = crypt(password_text, encrypted_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices por user_id para todas las tablas
CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_user_id ON casual_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_server_credentials_user_id ON server_credentials(user_id);

-- Índices por fecha
CREATE INDEX IF NOT EXISTS idx_service_orders_date ON service_orders(date);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_date ON casual_expenses(date);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(date);

-- Índices por estado
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) - SIMPLES
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas simples: usuarios solo pueden ver/editar sus propios datos
CREATE POLICY "Users can manage their own service orders" ON service_orders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own casual expenses" ON casual_expenses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budget expenses" ON budget_expenses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own licenses" ON licenses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own passwords" ON passwords
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own server credentials" ON server_credentials
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE service_orders IS 'Órdenes de servicio con items, pagos y cálculos automáticos';
COMMENT ON TABLE casual_expenses IS 'Gastos casuales categorizados por tipo';
COMMENT ON TABLE budget_expenses IS 'Gastos presupuestados para control financiero';
COMMENT ON TABLE licenses IS 'Licencias de software con fechas de expiración';
COMMENT ON TABLE passwords IS 'Contraseñas encriptadas para servicios';
COMMENT ON TABLE server_credentials IS 'Credenciales de servidores con encriptación';

-- =====================================================
-- ESQUEMA COMPLETADO
-- =====================================================
-- Este esquema incluye:
-- ✅ Todas las tablas necesarias basadas en los formularios
-- ✅ Campos consistentes con el código frontend
-- ✅ Triggers automáticos para updated_at
-- ✅ Funciones de encriptación para contraseñas
-- ✅ Índices para optimización
-- ✅ Políticas RLS simples y efectivas
-- ✅ Documentación completa
-- =====================================================