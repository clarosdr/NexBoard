-- =====================================================
-- MODULE: SERVICE ORDERS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Campos principales
    client_name VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    service_description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Proceso', 'Finalizado', 'Entregado')),
    -- Items de venta y pagos
    sale_items JSONB DEFAULT '[]'::jsonb,
    payments JSONB DEFAULT '[]'::jsonb,
    -- Resumen financiero
    total_amount DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    profit DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - total_cost) STORED,
    pending_balance DECIMAL(12,2) DEFAULT 0,
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota')
);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'America/Bogota';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_service_orders_updated_at
BEFORE UPDATE ON service_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own service orders" ON service_orders;
CREATE POLICY "Users manage own service orders"
ON service_orders FOR ALL
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON service_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_date ON service_orders(date);