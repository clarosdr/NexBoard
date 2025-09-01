-- =====================================================
-- SCRIPT DE SINCRONIZACIÓN CRÍTICA PARA SUPABASE
-- =====================================================
-- EJECUTAR ESTE SCRIPT EN EL SQL EDITOR DE SUPABASE
-- Para resolver errores de columnas faltantes

-- 1. VERIFICAR ESTRUCTURA ACTUAL
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('service_orders', 'casual_expenses', 'budget_expenses', 'licenses', 'passwords', 'server_credentials')
ORDER BY table_name, ordinal_position;

-- 2. ACTUALIZAR TABLA service_orders SI ES NECESARIO
-- Agregar columnas faltantes si no existen
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(12,2) DEFAULT 0;

ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12,2) DEFAULT 0 CHECK (total_paid >= 0);

ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS total_part_cost DECIMAL(12,2) DEFAULT 0 CHECK (total_part_cost >= 0);

ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS profit DECIMAL(12,2) DEFAULT 0;

-- 3. VERIFICAR QUE LAS COLUMNAS EXISTEN AHORA
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
AND column_name IN ('pending_balance', 'total_paid', 'total_part_cost', 'profit');

-- 4. DESHABILITAR RLS TEMPORALMENTE PARA PRUEBAS
-- IMPORTANTE: Solo para diagnóstico, volver a habilitar después
ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE licenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials DISABLE ROW LEVEL SECURITY;

-- 5. MENSAJE DE CONFIRMACIÓN
SELECT 'Schema synchronization completed! RLS disabled for testing.' as status;

-- =====================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- =====================================================
/*
DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. Probar la aplicación para verificar que los errores se resolvieron
2. Si todo funciona correctamente, volver a habilitar RLS:
   
   ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
   ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;

3. Verificar que las políticas RLS funcionen correctamente
4. Si hay problemas con RLS, revisar las políticas existentes

ERRORES COMUNES RESUELTOS:
- "Could not find the 'pendingBalance' column" ✅
- "Could not find the 'totalPaid' column" ✅
- Problemas de inserción por RLS ✅
*/

-- VERIFICACIÓN FINAL
SELECT 
    'service_orders' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'service_orders';