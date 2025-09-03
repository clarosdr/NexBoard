-- =====================================================
-- MODULE: LICENSES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Campos principales (alineados con LicenseForm.jsx)
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
    condition VARCHAR(10) CHECK (condition IN ('NUEVA', 'USADA', 'Nueva', 'Usada')),
    notes TEXT,
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

CREATE TRIGGER trg_licenses_updated_at
BEFORE UPDATE ON licenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own licenses" ON licenses;
CREATE POLICY "Users manage own licenses"
ON licenses FOR ALL
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_licenses_client ON licenses(client_name);

-- View: Licencias por vencer (30 días)
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