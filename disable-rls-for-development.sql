-- =====================================================
-- DESHABILITAR RLS TEMPORALMENTE PARA DESARROLLO
-- ⚠️ SOLO USAR EN DESARROLLO - NO EN PRODUCCIÓN
-- =====================================================

-- Este script deshabilita temporalmente las políticas RLS
-- para permitir pruebas durante el desarrollo

-- PASO 1: Deshabilitar RLS en todas las tablas
ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE licenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Users can manage their own service orders" ON service_orders;
DROP POLICY IF EXISTS "Users can manage their own casual expenses" ON casual_expenses;
DROP POLICY IF EXISTS "Users can manage their own budget expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can manage their own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can manage their own passwords" ON passwords;
DROP POLICY IF EXISTS "Users can manage their own server credentials" ON server_credentials;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN (
    'service_orders', 
    'casual_expenses', 
    'budget_expenses', 
    'licenses', 
    'passwords', 
    'server_credentials'
)
AND schemaname = 'public';

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
🔧 CÓMO USAR ESTE SCRIPT:

1. Ejecuta primero: supabase-schema-clean.sql
2. Luego ejecuta este script: disable-rls-for-development.sql
3. Tu aplicación debería funcionar sin errores de RLS

⚠️ IMPORTANTE:
- Este script es SOLO para desarrollo
- En producción, mantén RLS habilitado
- Cuando termines las pruebas, ejecuta enable-rls-for-production.sql

✅ DESPUÉS DE EJECUTAR:
- La aplicación funcionará completamente
- Podrás crear, editar y eliminar registros
- No más errores de "row-level security policy"
*/