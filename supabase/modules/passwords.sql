-- =====================================================
-- MODULE: PASSWORDS / CREDENTIAL MANAGEMENT
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Campos principales (alineados con PasswordForm.jsx)
    website_application VARCHAR(255) NOT NULL,
    username_email VARCHAR(255) NOT NULL,
    password_value TEXT NOT NULL,
    category VARCHAR(20) DEFAULT 'Otros' CHECK (category IN ('Personal', 'Bancos', 'Principal', 'Entretenimiento', 'Otros')),
    notes TEXT,
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Bogota')
);

-- Campos/migraciones adicionales para cifrado
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS password_encrypted TEXT;

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'America/Bogota';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_passwords_updated_at
BEFORE UPDATE ON passwords
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own passwords" ON passwords;
CREATE POLICY "Users manage own passwords"
ON passwords FOR ALL
USING (auth.uid() = user_id);

-- Crypto helpers
CREATE OR REPLACE FUNCTION verify_password(password_text text, encrypted_password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  IF encrypted_password IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN crypt(password_text, encrypted_password) = encrypted_password;
END;
$$;

CREATE OR REPLACE FUNCTION encrypt_password(password_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT crypt(password_text, gen_salt('bf'));
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_category ON passwords(category);