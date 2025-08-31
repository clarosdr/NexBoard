-- =====================================================
-- NEXBOARD - CONFIGURACIÓN DE BASE DE DATOS SUPABASE
-- =====================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para crear todas las tablas necesarias

-- 1. TABLA DE ÓRDENES DE SERVICIO
-- =====================================================
CREATE TABLE IF NOT EXISTS service_orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'finalizado', 'entregado')),
  items JSONB NOT NULL DEFAULT '[]',
  payments JSONB NOT NULL DEFAULT '[]',
  total_paid DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  total_part_cost DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE GASTOS CASUALES
-- =====================================================
CREATE TABLE IF NOT EXISTS casual_expenses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'otros' CHECK (category IN ('alimentacion', 'transporte', 'entretenimiento', 'salud', 'compras', 'servicios', 'educacion', 'otros')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE GASTOS PRESUPUESTARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_expenses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'operacional' CHECK (category IN ('operacional', 'marketing', 'tecnologia', 'personal', 'infraestructura', 'legal', 'otros')),
  budget_month TEXT NOT NULL, -- Formato: YYYY-MM
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE LICENCIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  license_key TEXT NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE CONTRASEÑAS
-- =====================================================
CREATE TABLE IF NOT EXISTS passwords (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE CREDENCIALES DE SERVIDOR
-- =====================================================
CREATE TABLE IF NOT EXISTS server_credentials (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  server_name TEXT NOT NULL,
  ip_address TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  port INTEGER DEFAULT 22 CHECK (port > 0 AND port <= 65535),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Políticas para service_orders
DROP POLICY IF EXISTS "Users can manage their own service orders" ON service_orders;
CREATE POLICY "Users can manage their own service orders" ON service_orders
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para casual_expenses
DROP POLICY IF EXISTS "Users can manage their own casual expenses" ON casual_expenses;
CREATE POLICY "Users can manage their own casual expenses" ON casual_expenses
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para budget_expenses
DROP POLICY IF EXISTS "Users can manage their own budget expenses" ON budget_expenses;
CREATE POLICY "Users can manage their own budget expenses" ON budget_expenses
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para licenses
DROP POLICY IF EXISTS "Users can manage their own licenses" ON licenses;
CREATE POLICY "Users can manage their own licenses" ON licenses
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para passwords
DROP POLICY IF EXISTS "Users can manage their own passwords" ON passwords;
CREATE POLICY "Users can manage their own passwords" ON passwords
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para server_credentials
DROP POLICY IF EXISTS "Users can manage their own server credentials" ON server_credentials;
CREATE POLICY "Users can manage their own server credentials" ON server_credentials
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índices para service_orders
CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_date ON service_orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at DESC);

-- Índices para casual_expenses
CREATE INDEX IF NOT EXISTS idx_casual_expenses_user_id ON casual_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_date ON casual_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_category ON casual_expenses(category);

-- Índices para budget_expenses
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_budget_month ON budget_expenses(budget_month);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_category ON budget_expenses(category);

-- Índices para licenses
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry_date ON licenses(expiry_date);

-- Índices para passwords
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_service_name ON passwords(service_name);

-- Índices para server_credentials
CREATE INDEX IF NOT EXISTS idx_server_credentials_user_id ON server_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_server_credentials_server_name ON server_credentials(server_name);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
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
DROP TRIGGER IF EXISTS update_service_orders_updated_at ON service_orders;
CREATE TRIGGER update_service_orders_updated_at
    BEFORE UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_casual_expenses_updated_at ON casual_expenses;
CREATE TRIGGER update_casual_expenses_updated_at
    BEFORE UPDATE ON casual_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_expenses_updated_at ON budget_expenses;
CREATE TRIGGER update_budget_expenses_updated_at
    BEFORE UPDATE ON budget_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses;
CREATE TRIGGER update_licenses_updated_at
    BEFORE UPDATE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_passwords_updated_at ON passwords;
CREATE TRIGGER update_passwords_updated_at
    BEFORE UPDATE ON passwords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_server_credentials_updated_at ON server_credentials;
CREATE TRIGGER update_server_credentials_updated_at
    BEFORE UPDATE ON server_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
SELECT 'NexBoard database setup completed successfully!' as status;