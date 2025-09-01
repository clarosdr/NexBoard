-- =====================================================
-- NEXBOARD - ESQUEMA UNIFICADO DE BASE DE DATOS
-- =====================================================
-- Versión unificada que resuelve inconsistencias y mejora seguridad
-- Ejecuta este script en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para encriptar contraseñas usando bcrypt
CREATE OR REPLACE FUNCTION encrypt_password(password_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password_text, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar contraseñas
CREATE OR REPLACE FUNCTION verify_password(password_text TEXT, encrypted_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN encrypted_password = crypt(password_text, encrypted_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLA DE ÓRDENES DE SERVICIO
-- =====================================================
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL CHECK (length(customer_name) >= 2 AND length(customer_name) <= 200),
  description TEXT NOT NULL CHECK (length(description) >= 5 AND length(description) <= 2000),
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'finalizado', 'entregado')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  payments JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_paid DECIMAL(12,2) DEFAULT 0 CHECK (total_paid >= 0),
  total DECIMAL(12,2) DEFAULT 0 CHECK (total >= 0),
  total_part_cost DECIMAL(12,2) DEFAULT 0 CHECK (total_part_cost >= 0),
  profit DECIMAL(12,2) DEFAULT 0,
  pending_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA DE GASTOS CASUALES
-- =====================================================
CREATE TABLE IF NOT EXISTS casual_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL CHECK (length(description) >= 3 AND length(description) <= 500),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'otros' CHECK (category IN (
    'alimentacion', 'transporte', 'entretenimiento', 'salud', 
    'compras', 'servicios', 'educacion', 'otros'
  )),
  date DATE NOT NULL,
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA DE GASTOS PRESUPUESTARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL CHECK (length(description) >= 3 AND length(description) <= 500),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'operacional' CHECK (category IN (
    'operacional', 'marketing', 'tecnologia', 'personal', 
    'infraestructura', 'legal', 'otros'
  )),
  date DATE NOT NULL,
  budget_month TEXT NOT NULL CHECK (budget_month ~ '^\d{4}-\d{2}$'),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA DE LICENCIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  software_name TEXT NOT NULL CHECK (length(software_name) >= 2 AND length(software_name) <= 200),
  license_key TEXT NOT NULL CHECK (length(license_key) >= 5 AND length(license_key) <= 500),
  purchase_date DATE,
  expiry_date DATE,
  vendor TEXT CHECK (vendor IS NULL OR length(vendor) <= 200),
  cost DECIMAL(12,2) CHECK (cost IS NULL OR cost >= 0),
  max_installations INTEGER CHECK (max_installations IS NULL OR max_installations > 0),
  current_installations INTEGER DEFAULT 0 CHECK (current_installations >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT check_installations CHECK (
    max_installations IS NULL OR current_installations <= max_installations
  ),
  CONSTRAINT check_dates CHECK (
    purchase_date IS NULL OR expiry_date IS NULL OR purchase_date <= expiry_date
  )
);

-- =====================================================
-- TABLA DE CONTRASEÑAS (CON ENCRIPTACIÓN)
-- =====================================================
CREATE TABLE IF NOT EXISTS passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL CHECK (length(service_name) >= 2 AND length(service_name) <= 200),
  username TEXT CHECK (username IS NULL OR length(username) <= 200),
  email TEXT CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password_encrypted TEXT NOT NULL,
  url TEXT CHECK (url IS NULL OR url ~ '^https?://'),
  category TEXT CHECK (category IS NULL OR length(category) <= 100),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA DE CREDENCIALES DE SERVIDORES (CON ENCRIPTACIÓN)
-- =====================================================
CREATE TABLE IF NOT EXISTS server_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  server_name TEXT NOT NULL CHECK (length(server_name) >= 2 AND length(server_name) <= 200),
  ip_address INET,
  hostname TEXT CHECK (hostname IS NULL OR length(hostname) <= 253),
  username TEXT NOT NULL CHECK (length(username) >= 1 AND length(username) <= 200),
  password_encrypted TEXT,
  ssh_key TEXT,
  port INTEGER DEFAULT 22 CHECK (port > 0 AND port <= 65535),
  protocol TEXT DEFAULT 'SSH' CHECK (protocol IN ('SSH', 'RDP', 'TELNET', 'FTP', 'SFTP')),
  description TEXT CHECK (description IS NULL OR length(description) <= 500),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT check_auth_method CHECK (
    password_encrypted IS NOT NULL OR ssh_key IS NOT NULL
  )
);

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD RLS
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can manage their own service orders" ON service_orders;
DROP POLICY IF EXISTS "Users can manage their own casual expenses" ON casual_expenses;
DROP POLICY IF EXISTS "Users can manage their own budget expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can manage their own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can manage their own passwords" ON passwords;
DROP POLICY IF EXISTS "Users can manage their own server credentials" ON server_credentials;

-- Crear políticas unificadas
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
-- ÍNDICES PARA OPTIMIZACIÓN DE RENDIMIENTO
-- =====================================================

-- Índices para service_orders
CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_date ON service_orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer ON service_orders(customer_name);

-- Índices para casual_expenses
CREATE INDEX IF NOT EXISTS idx_casual_expenses_user_id ON casual_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_date ON casual_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_category ON casual_expenses(category);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_amount ON casual_expenses(amount DESC);

-- Índices para budget_expenses
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_budget_month ON budget_expenses(budget_month);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_category ON budget_expenses(category);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_amount ON budget_expenses(amount DESC);

-- Índices para licenses
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry_date ON licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_licenses_software_name ON licenses(software_name);

-- Índices para passwords
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_service_name ON passwords(service_name);
CREATE INDEX IF NOT EXISTS idx_passwords_category ON passwords(category);

-- Índices para server_credentials
CREATE INDEX IF NOT EXISTS idx_server_credentials_user_id ON server_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_server_credentials_server_name ON server_credentials(server_name);
CREATE INDEX IF NOT EXISTS idx_server_credentials_protocol ON server_credentials(protocol);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS update_service_orders_updated_at ON service_orders;
DROP TRIGGER IF EXISTS update_casual_expenses_updated_at ON casual_expenses;
DROP TRIGGER IF EXISTS update_budget_expenses_updated_at ON budget_expenses;
DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses;
DROP TRIGGER IF EXISTS update_passwords_updated_at ON passwords;
DROP TRIGGER IF EXISTS update_server_credentials_updated_at ON server_credentials;

-- Crear triggers
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
-- VISTAS PARA CONSULTAS COMUNES
-- =====================================================

-- Vista para estadísticas de órdenes de servicio
CREATE OR REPLACE VIEW service_orders_stats AS
SELECT 
    user_id,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'pendiente') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'finalizado') as completed_orders,
    SUM(total) as total_revenue,
    SUM(profit) as total_profit,
    AVG(profit) as avg_profit
FROM service_orders
GROUP BY user_id;

-- Vista para gastos mensuales
CREATE OR REPLACE VIEW monthly_expenses AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    'casual' as expense_type,
    category,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM casual_expenses
GROUP BY user_id, DATE_TRUNC('month', date), category
UNION ALL
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    'budget' as expense_type,
    category,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM budget_expenses
GROUP BY user_id, DATE_TRUNC('month', date), category;

-- =====================================================
-- CONFIGURACIÓN COMPLETADA
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN (
    'service_orders', 
    'casual_expenses', 
    'budget_expenses', 
    'licenses', 
    'passwords', 
    'server_credentials'
)
ORDER BY tablename;

-- Mensaje de confirmación
SELECT 'NexBoard unified database schema created successfully!' as status;

-- =====================================================
-- NOTAS DE MIGRACIÓN
-- =====================================================
/*
IMPORTANTE: Este esquema unificado incluye las siguientes mejoras:

1. CLAVES PRIMARIAS UNIFICADAS:
   - Todas las tablas usan UUID como clave primaria
   - Generación automática con gen_random_uuid()

2. SEGURIDAD MEJORADA:
   - Encriptación bcrypt para contraseñas
   - Funciones de utilidad para encriptar/verificar
   - Validaciones de formato para emails y URLs

3. VALIDACIONES ROBUSTAS:
   - Restricciones de longitud para todos los campos TEXT
   - Validaciones de formato (emails, URLs, fechas)
   - Constraints de integridad referencial

4. OPTIMIZACIÓN:
   - Índices estratégicos para consultas frecuentes
   - Vistas para estadísticas comunes
   - Triggers automáticos para updated_at

5. CONSISTENCIA:
   - Nomenclatura unificada
   - Tipos de datos consistentes
   - Estructura homogénea entre tablas
*/