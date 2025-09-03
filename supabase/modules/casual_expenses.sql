-- =====================================================
-- MODULE: CASUAL EXPENSES (Gastos casuales)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS casual_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Campos propios del módulo
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
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

CREATE TRIGGER trg_casual_expenses_updated_at
BEFORE UPDATE ON casual_expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own casual expenses" ON casual_expenses;
CREATE POLICY "Users manage own casual expenses"
ON casual_expenses FOR ALL
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_casual_expenses_user_id ON casual_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_casual_expenses_date ON casual_expenses(date);