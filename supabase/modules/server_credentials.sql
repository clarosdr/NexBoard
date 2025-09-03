-- =====================================================
-- MODULE: SERVER CREDENTIALS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS server_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Campos existentes (mantener sin cambios, alineados con ServerCredentialsForm.jsx y supabase.js)
    company VARCHAR(255),
    server_name VARCHAR(255) NOT NULL,
    vpn_password VARCHAR(255),
    vpn_ip VARCHAR(45),
    local_name VARCHAR(255),
    users TEXT,
    password_encrypted TEXT,
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

CREATE TRIGGER trg_server_credentials_updated_at
BEFORE UPDATE ON server_credentials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own server credentials" ON server_credentials;
CREATE POLICY "Users manage own server credentials"
ON server_credentials FOR ALL
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
CREATE INDEX IF NOT EXISTS idx_server_credentials_user_id ON server_credentials(user_id);