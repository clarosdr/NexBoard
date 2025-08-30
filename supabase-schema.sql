-- Esquema de base de datos para NexBoard en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Habilitar Row Level Security (RLS) por defecto
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Tabla de órdenes de servicio
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  device_type TEXT NOT NULL,
  device_brand TEXT,
  device_model TEXT,
  device_serial TEXT,
  problem_description TEXT NOT NULL,
  diagnosis TEXT,
  solution TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  total_cost DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'finalizado', 'entregado')),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  estimated_delivery DATE,
  actual_delivery DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de gastos casuales
CREATE TABLE IF NOT EXISTS casual_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de gastos presupuestarios
CREATE TABLE IF NOT EXISTS budget_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de licencias
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  software_name TEXT NOT NULL,
  license_key TEXT NOT NULL,
  purchase_date DATE,
  expiry_date DATE,
  vendor TEXT,
  cost DECIMAL(10,2),
  max_installations INTEGER,
  current_installations INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de contraseñas
CREATE TABLE IF NOT EXISTS passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  username TEXT,
  email TEXT,
  password_encrypted TEXT NOT NULL, -- Almacenar encriptado
  url TEXT,
  notes TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de credenciales de servidores
CREATE TABLE IF NOT EXISTS server_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  server_name TEXT NOT NULL,
  ip_address TEXT,
  hostname TEXT,
  username TEXT NOT NULL,
  password_encrypted TEXT, -- Almacenar encriptado
  ssh_key TEXT,
  port INTEGER DEFAULT 22,
  protocol TEXT DEFAULT 'SSH',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (RLS Policies)
-- Los usuarios solo pueden ver y modificar sus propios datos

-- Service Orders
CREATE POLICY "Users can view own service orders" ON service_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service orders" ON service_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service orders" ON service_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own service orders" ON service_orders
  FOR DELETE USING (auth.uid() = user_id);

-- Casual Expenses
CREATE POLICY "Users can view own casual expenses" ON casual_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own casual expenses" ON casual_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own casual expenses" ON casual_expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own casual expenses" ON casual_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Budget Expenses
CREATE POLICY "Users can view own budget expenses" ON budget_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget expenses" ON budget_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget expenses" ON budget_expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget expenses" ON budget_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Licenses
CREATE POLICY "Users can view own licenses" ON licenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own licenses" ON licenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own licenses" ON licenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own licenses" ON licenses
  FOR DELETE USING (auth.uid() = user_id);

-- Passwords
CREATE POLICY "Users can view own passwords" ON passwords
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passwords" ON passwords
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passwords" ON passwords
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own passwords" ON passwords
  FOR DELETE USING (auth.uid() = user_id);

-- Server Credentials
CREATE POLICY "Users can view own server credentials" ON server_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own server credentials" ON server_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own server credentials" ON server_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own server credentials" ON server_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_casual_expenses_user_id ON casual_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_date ON casual_expenses(date);

CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(date);

CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry_date ON licenses(expiry_date);

CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_server_credentials_user_id ON server_credentials(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_casual_expenses_updated_at BEFORE UPDATE ON casual_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_expenses_updated_at BEFORE UPDATE ON budget_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passwords_updated_at BEFORE UPDATE ON passwords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_credentials_updated_at BEFORE UPDATE ON server_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();