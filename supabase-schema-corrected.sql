-- Esquema SQL corregido para Supabase - Coincide exactamente con los campos de la aplicación
-- Este esquema elimina campos innecesarios y usa los nombres exactos de la aplicación

-- Tabla de órdenes de servicio
CREATE TABLE service_orders (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  items JSONB NOT NULL DEFAULT '[]',
  payments JSONB NOT NULL DEFAULT '[]',
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_part_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de gastos casuales
CREATE TABLE casual_expenses (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de gastos de presupuesto
CREATE TABLE budget_expenses (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  budgeted_amount DECIMAL(10,2) NOT NULL,
  actual_amount DECIMAL(10,2) DEFAULT 0,
  date DATE NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de licencias
CREATE TABLE licenses (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  license_key TEXT NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de contraseñas
CREATE TABLE passwords (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de credenciales de servidor
CREATE TABLE server_credentials (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  server_name TEXT NOT NULL,
  ip_address TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  port INTEGER DEFAULT 22,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX idx_service_orders_date ON service_orders(date);
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_casual_expenses_user_id ON casual_expenses(user_id);
CREATE INDEX idx_casual_expenses_date ON casual_expenses(date);
CREATE INDEX idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_passwords_user_id ON passwords(user_id);
CREATE INDEX idx_server_credentials_user_id ON server_credentials(user_id);

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_casual_expenses_updated_at BEFORE UPDATE ON casual_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_expenses_updated_at BEFORE UPDATE ON budget_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_passwords_updated_at BEFORE UPDATE ON passwords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_server_credentials_updated_at BEFORE UPDATE ON server_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas para service_orders
CREATE POLICY "Users can view their own service orders" ON service_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own service orders" ON service_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own service orders" ON service_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own service orders" ON service_orders FOR DELETE USING (auth.uid() = user_id);

-- Políticas para casual_expenses
CREATE POLICY "Users can view their own casual expenses" ON casual_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own casual expenses" ON casual_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own casual expenses" ON casual_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own casual expenses" ON casual_expenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas para budget_expenses
CREATE POLICY "Users can view their own budget expenses" ON budget_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budget expenses" ON budget_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budget expenses" ON budget_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budget expenses" ON budget_expenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas para licenses
CREATE POLICY "Users can view their own licenses" ON licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own licenses" ON licenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own licenses" ON licenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own licenses" ON licenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas para passwords
CREATE POLICY "Users can view their own passwords" ON passwords FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own passwords" ON passwords FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own passwords" ON passwords FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own passwords" ON passwords FOR DELETE USING (auth.uid() = user_id);

-- Políticas para server_credentials
CREATE POLICY "Users can view their own server credentials" ON server_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own server credentials" ON server_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own server credentials" ON server_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own server credentials" ON server_credentials FOR DELETE USING (auth.uid() = user_id);}}}