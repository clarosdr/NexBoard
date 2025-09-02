-- =====================================================
-- NEXBOARD - ESQUEMA DE BASE DE DATOS ORIGINAL
-- Restaurando campos originales como estaban antes de la migración
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLA: service_orders (Órdenes de Servicio) - YA ESTÁ BIEN
-- =====================================================
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    orderNumber TEXT,            -- Campo original
    clientName TEXT NOT NULL,    -- Campo original
    clientPhone TEXT,            -- Campo original
    clientEmail TEXT,            -- Campo original
    deviceType TEXT,             -- Campo original
    deviceBrand TEXT,            -- Campo original
    deviceModel TEXT,            -- Campo original
    deviceSerial TEXT,           -- Campo original
    problemDescription TEXT,     -- Campo original
    diagnosis TEXT,              -- Campo original
    solution TEXT,               -- Campo original
    items JSONB NOT NULL DEFAULT '[]',
    payments JSONB NOT NULL DEFAULT '[]',
    totalCost DECIMAL(12,2) NOT NULL DEFAULT 0,      -- Campo original
    totalPaid DECIMAL(12,2) NOT NULL DEFAULT 0,      -- Campo original
    pendingBalance DECIMAL(12,2) NOT NULL DEFAULT 0, -- Campo original
    profit DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'finalizado', 'entregado', 'cancelado')),
    priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta')), -- Campo original
    estimatedDelivery DATE,      -- Campo original
    actualDelivery DATE,         -- Campo original
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: casual_expenses (Gastos Casuales) - ESTÁ BIEN
-- =====================================================
CREATE TABLE IF NOT EXISTS casual_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'otros' CHECK (category IN ('vivienda', 'mi_hija', 'mama', 'deudas', 'sueldo', 'sueldo_2', 'otros')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: budget_expenses (Gastos Presupuestados) - NUEVA
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'vivienda' CHECK (category IN ('vivienda', 'mi_hija', 'mama', 'deudas', 'sueldo', 'sueldo_2')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: licenses (Licencias de Software) - CAMPOS ORIGINALES
-- =====================================================
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    softwareName TEXT NOT NULL,     -- Campo original
    licenseKey TEXT NOT NULL,       -- Campo original
    purchaseDate DATE,              -- Campo original
    expiryDate DATE,               -- Campo original
    vendor TEXT,                   -- Campo original
    cost DECIMAL(12,2) DEFAULT 0,  -- Campo original
    maxInstallations INTEGER DEFAULT 1,     -- Campo original
    currentInstallations INTEGER DEFAULT 0, -- Campo original
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: passwords (Contraseñas) - CAMPOS ORIGINALES
-- =====================================================
CREATE TABLE IF NOT EXISTS passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    serviceName TEXT NOT NULL,   -- Campo original
    username TEXT NOT NULL,
    email TEXT,                  -- Campo original
    password TEXT NOT NULL,      -- Campo original (sin encriptar por ahora)
    url TEXT,                    -- Campo original
    notes TEXT,                  -- Campo original
    category TEXT,               -- Campo original
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: server_credentials (Credenciales de Servidores) - YA ESTÁ BIEN
-- =====================================================
CREATE TABLE IF NOT EXISTS server_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    server_name TEXT NOT NULL,
    ipAddress TEXT,              -- Campo original
    hostname TEXT,               -- Campo original
    username TEXT,               -- Campo original
    password TEXT,               -- Campo original (sin encriptar por ahora)
    sshKey TEXT,                 -- Campo original
    port INTEGER DEFAULT 22,     -- Campo original
    protocol TEXT DEFAULT 'SSH', -- Campo original
    description TEXT,            -- Campo original
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
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_date ON casual_expenses(date);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(date);

-- Índices por estado
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) - FUNCIONALES
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS "Users can manage their own service orders" ON service_orders;
DROP POLICY IF EXISTS "Users can manage their own casual expenses" ON casual_expenses;
DROP POLICY IF EXISTS "Users can manage their own budget expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can manage their own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can manage their own passwords" ON passwords;
DROP POLICY IF EXISTS "Users can manage their own server credentials" ON server_credentials;

-- Políticas simplificadas que funcionan
CREATE POLICY "Users can manage their own service orders" ON service_orders
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own casual expenses" ON casual_expenses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budget expenses" ON budget_expenses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own licenses" ON licenses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own passwords" ON passwords
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own server credentials" ON server_credentials
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE service_orders IS 'Órdenes de servicio técnico con campos originales';
COMMENT ON TABLE casual_expenses IS 'Gastos casuales categorizados por tipo';
COMMENT ON TABLE budget_expenses IS 'Gastos presupuestados para control financiero';
COMMENT ON TABLE licenses IS 'Licencias de software con campos originales (softwareName, licenseKey, etc.)';
COMMENT ON TABLE passwords IS 'Contraseñas con campos originales (serviceName, email, url, category)';
COMMENT ON TABLE server_credentials IS 'Credenciales de servidores con campos originales (ipAddress, hostname, sshKey, etc.)';

-- =====================================================
-- ESQUEMA COMPLETADO CON CAMPOS ORIGINALES
-- =====================================================
-- Este esquema restaura los campos originales como estaban antes de la migración:
-- ✅ service_orders: orderNumber, clientName, deviceType, etc. (ya estaba bien)
-- ✅ casual_expenses: description, amount, category (ya estaba bien)
-- ✅ licenses: softwareName, licenseKey, purchaseDate, expiryDate, vendor, cost, maxInstallations
-- ✅ passwords: serviceName, username, email, password, url, notes, category
-- ✅ server_credentials: server_name, ipAddress, hostname, username, password, sshKey, port, protocol
-- ✅ Políticas RLS funcionales
-- ✅ Triggers automáticos para updated_at
-- ✅ Índices para optimización