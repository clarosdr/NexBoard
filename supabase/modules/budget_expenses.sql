-- =====================================================
-- MODULE: BUDGET EXPENSES (Gastos de presupuesto)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS budget_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Campos del módulo de presupuesto
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Próximo' CHECK (status IN ('Vencido', 'Próximo', 'Pagado')),
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

CREATE TRIGGER trg_budget_expenses_updated_at
BEFORE UPDATE ON budget_expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own budget expenses" ON budget_expenses;
CREATE POLICY "Users manage own budget expenses"
ON budget_expenses FOR ALL
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_due_date ON budget_expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_status ON budget_expenses(status);