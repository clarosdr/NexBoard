-- MIGRACIÓN PARA CORREGIR EL ESQUEMA DE SUPABASE
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- IMPORTANTE: Esto eliminará los datos existentes y recreará la tabla

-- 1. Eliminar la tabla existente (CUIDADO: esto borra todos los datos)
DROP TABLE IF EXISTS service_orders CASCADE;

-- 2. Crear la nueva tabla con el esquema correcto
CREATE TABLE service_orders (
  id BIGINT PRIMARY KEY,
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

-- 3. Habilitar RLS
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
CREATE POLICY "Users can view their own service orders" ON service_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own service orders" ON service_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own service orders" ON service_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own service orders" ON service_orders FOR DELETE USING (auth.uid() = user_id);

-- 5. Crear índices
CREATE INDEX idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX idx_service_orders_date ON service_orders(date);
CREATE INDEX idx_service_orders_status ON service_orders(status);

-- 6. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_orders_updated_at 
    BEFORE UPDATE ON service_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- INSTRUCCIONES:
-- 1. Ve a tu proyecto Supabase
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- 5. Verifica que la tabla se haya creado correctamente
-- 6. Prueba crear una orden desde la aplicación