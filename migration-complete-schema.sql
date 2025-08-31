-- MIGRACIÓN COMPLETA PARA TODOS LOS MÓDULOS DE NEXBOARD
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- IMPORTANTE: Esto eliminará los datos existentes y recreará todas las tablas

-- ========================================
-- 1. ELIMINAR TABLAS EXISTENTES
-- ========================================
DROP TABLE IF EXISTS service_orders CASCADE;
DROP TABLE IF EXISTS casual_expenses CASCADE;
DROP TABLE IF EXISTS budget_expenses CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS passwords CASCADE;
DROP TABLE IF EXISTS server_credentials CASCADE;

-- ========================================
-- 2. CREAR FUNCIÓN PARA UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 3. TABLA: SERVICE_ORDERS (Órdenes de Servicio)
-- ========================================
CREATE TABLE service_orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'finalizado', 'entregado')),
  items JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  total_paid DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  total_part_cost DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para service_orders
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own service orders" ON service_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own service orders" ON service_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own service orders" ON service_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own service orders" ON service_orders FOR DELETE USING (auth.uid() = user_id);

-- Índices para service_orders
CREATE INDEX idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX idx_service_orders_date ON service_orders(date);
CREATE INDEX idx_service_orders_status ON service_orders(status);

-- Trigger para service_orders
CREATE TRIGGER update_service_orders_updated_at 
    BEFORE UPDATE ON service_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. TABLA: CASUAL_EXPENSES (Gastos Casuales)
-- ========================================
CREATE TABLE casual_expenses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT DEFAULT 'general',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para casual_expenses
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own casual expenses" ON casual_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own casual expenses" ON casual_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own casual expenses" ON casual_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own casual expenses" ON casual_expenses FOR DELETE USING (auth.uid() = user_id);

-- Índices para casual_expenses
CREATE INDEX idx_casual_expenses_user_id ON casual_expenses(user_id);
CREATE INDEX idx_casual_expenses_date ON casual_expenses(date);
CREATE INDEX idx_casual_expenses_category ON casual_expenses(category);

-- Trigger para casual_expenses
CREATE TRIGGER update_casual_expenses_updated_at 
    BEFORE UPDATE ON casual_expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. TABLA: BUDGET_EXPENSES (Gastos Presupuestarios)
-- ========================================
CREATE TABLE budget_expenses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  due_date DATE,
  is_paid BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para budget_expenses
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own budget expenses" ON budget_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budget expenses" ON budget_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budget expenses" ON budget_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budget expenses" ON budget_expenses FOR DELETE USING (auth.uid() = user_id);

-- Índices para budget_expenses
CREATE INDEX idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX idx_budget_expenses_due_date ON budget_expenses(due_date);
CREATE INDEX idx_budget_expenses_is_paid ON budget_expenses(is_paid);
CREATE INDEX idx_budget_expenses_category ON budget_expenses(category);

-- Trigger para budget_expenses
CREATE TRIGGER update_budget_expenses_updated_at 
    BEFORE UPDATE ON budget_expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. TABLA: LICENSES (Licencias)
-- ========================================
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  software_name TEXT NOT NULL,
  license_key TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  expiration_date DATE,
  max_installations INTEGER DEFAULT 1,
  purchase_price DECIMAL(10,2) DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  provider TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para licenses
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own licenses" ON licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own licenses" ON licenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own licenses" ON licenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own licenses" ON licenses FOR DELETE USING (auth.uid() = user_id);

-- Índices para licenses
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_software_name ON licenses(software_name);
CREATE INDEX idx_licenses_expiration_date ON licenses(expiration_date);

-- Trigger para licenses
CREATE TRIGGER update_licenses_updated_at 
    BEFORE UPDATE ON licenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. TABLA: PASSWORDS (Contraseñas)
-- ========================================
CREATE TABLE passwords (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT DEFAULT '',
  password_encrypted TEXT NOT NULL,
  url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para passwords
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own passwords" ON passwords FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own passwords" ON passwords FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own passwords" ON passwords FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own passwords" ON passwords FOR DELETE USING (auth.uid() = user_id);

-- Índices para passwords
CREATE INDEX idx_passwords_user_id ON passwords(user_id);
CREATE INDEX idx_passwords_service_name ON passwords(service_name);
CREATE INDEX idx_passwords_category ON passwords(category);

-- Trigger para passwords
CREATE TRIGGER update_passwords_updated_at 
    BEFORE UPDATE ON passwords 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. TABLA: SERVER_CREDENTIALS (Credenciales de Servidor)
-- ========================================
CREATE TABLE server_credentials (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  server_name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  hostname TEXT DEFAULT '',
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  ssh_key TEXT DEFAULT '',
  port INTEGER DEFAULT 22,
  protocol TEXT DEFAULT 'SSH',
  description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para server_credentials
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own server credentials" ON server_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own server credentials" ON server_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own server credentials" ON server_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own server credentials" ON server_credentials FOR DELETE USING (auth.uid() = user_id);

-- Índices para server_credentials
CREATE INDEX idx_server_credentials_user_id ON server_credentials(user_id);
CREATE INDEX idx_server_credentials_server_name ON server_credentials(server_name);
CREATE INDEX idx_server_credentials_ip_address ON server_credentials(ip_address);

-- Trigger para server_credentials
CREATE TRIGGER update_server_credentials_updated_at 
    BEFORE UPDATE ON server_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. VERIFICACIÓN FINAL
-- ========================================
-- Verificar que todas las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'service_orders', 
        'casual_expenses', 
        'budget_expenses', 
        'licenses', 
        'passwords', 
        'server_credentials'
    )
ORDER BY tablename;

-- ========================================
-- INSTRUCCIONES DE USO:
-- ========================================
-- 1. Ve a tu proyecto Supabase
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- 5. Verifica que todas las tablas se hayan creado correctamente
-- 6. Prueba crear registros desde la aplicación
--
-- NOTA: Este script eliminará TODOS los datos existentes
-- Haz un backup si tienes información importante