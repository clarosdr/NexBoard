-- =====================================================
-- HABILITAR RLS PARA PRODUCCIÓN
-- 🔒 USAR CUANDO ESTÉ LISTO PARA PRODUCCIÓN
-- =====================================================

-- Este script rehabilita las políticas RLS para producción
-- con autenticación adecuada

-- PASO 1: Habilitar RLS en todas las tablas
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;

-- PASO 2: Crear políticas de seguridad (por operación)
-- Usuarios solo pueden ver/editar sus propios datos

-- Eliminar políticas genéricas previas si existen
DROP POLICY IF EXISTS "Users can manage their own service orders" ON service_orders;
DROP POLICY IF EXISTS "Users can manage their own casual expenses" ON casual_expenses;
DROP POLICY IF EXISTS "Users can manage their own budget expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can manage their own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can manage their own passwords" ON passwords;
DROP POLICY IF EXISTS "Users can manage their own server credentials" ON server_credentials;

-- service_orders
CREATE POLICY IF NOT EXISTS "Select own service_orders" ON service_orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Insert own service_orders" ON service_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own service_orders" ON service_orders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Delete own service_orders" ON service_orders
  FOR DELETE USING (auth.uid() = user_id);

-- casual_expenses
CREATE POLICY IF NOT EXISTS "Select own casual_expenses" ON casual_expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Insert own casual_expenses" ON casual_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own casual_expenses" ON casual_expenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Delete own casual_expenses" ON casual_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- budget_expenses
CREATE POLICY IF NOT EXISTS "Select own budget_expenses" ON budget_expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Insert own budget_expenses" ON budget_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own budget_expenses" ON budget_expenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Delete own budget_expenses" ON budget_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- licenses
CREATE POLICY IF NOT EXISTS "Select own licenses" ON licenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Insert own licenses" ON licenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own licenses" ON licenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Delete own licenses" ON licenses
  FOR DELETE USING (auth.uid() = user_id);

-- passwords
CREATE POLICY IF NOT EXISTS "Select own passwords" ON passwords
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Insert own passwords" ON passwords
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own passwords" ON passwords
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Delete own passwords" ON passwords
  FOR DELETE USING (auth.uid() = user_id);

-- server_credentials
CREATE POLICY IF NOT EXISTS "Select own server_credentials" ON server_credentials
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Insert own server_credentials" ON server_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own server_credentials" ON server_credentials
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Delete own server_credentials" ON server_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que RLS está habilitado
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

-- Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN (
    'service_orders', 
    'casual_expenses', 
    'budget_expenses', 
    'licenses', 
    'passwords', 
    'server_credentials'
);

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
🔒 CÓMO USAR ESTE SCRIPT:

1. Asegúrate de que la autenticación funciona correctamente
2. Verifica que auth.uid() retorna el ID del usuario autenticado
3. Ejecuta este script para habilitar RLS
4. Prueba que los usuarios solo ven sus propios datos

⚠️ REQUISITOS PREVIOS:
- Sistema de autenticación configurado
- Usuarios registrados con auth.users
- Campo user_id poblado en todas las tablas

✅ DESPUÉS DE EJECUTAR:
- RLS estará habilitado
- Cada usuario solo verá sus propios datos
- Seguridad completa en producción
*/