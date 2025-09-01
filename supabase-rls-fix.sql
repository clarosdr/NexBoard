-- =====================================================
-- SOLUCIÓN TEMPORAL PARA ERRORES RLS
-- =====================================================
-- Este script deshabilita temporalmente RLS para permitir
-- que la aplicación funcione sin autenticación completa

-- IMPORTANTE: Solo usar en desarrollo
-- En producción, asegúrate de tener autenticación configurada

-- Deshabilitar RLS temporalmente
ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE licenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can manage their own service orders" ON service_orders;
DROP POLICY IF EXISTS "Users can manage their own casual expenses" ON casual_expenses;
DROP POLICY IF EXISTS "Users can manage their own budget expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can manage their own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can manage their own passwords" ON passwords;
DROP POLICY IF EXISTS "Users can manage their own server credentials" ON server_credentials;

-- NOTA: Para habilitar RLS nuevamente en producción:
-- 1. Configura autenticación de Supabase correctamente
-- 2. Ejecuta el archivo supabase-unified-schema.sql
-- 3. Asegúrate de que los usuarios estén autenticados antes de acceder a los datos