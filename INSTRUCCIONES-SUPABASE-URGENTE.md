# 🚨 INSTRUCCIONES URGENTES - Sincronización Supabase

## ⚠️ PROBLEMA IDENTIFICADO

La aplicación tiene **errores críticos** porque la base de datos en Supabase no está sincronizada con el código:

- ❌ `Could not find the 'pendingBalance' column`
- ❌ `Could not find the 'totalPaid' column` 
- ❌ `net::ERR_ABORTED` en logout

## 🎯 SOLUCIÓN INMEDIATA

### Paso 1: Acceder a Supabase
1. Ve a: https://dzztwymgrunzzuactlvp.supabase.co
2. Inicia sesión en tu proyecto
3. Ve a **SQL Editor** en el menú lateral izquierdo

### Paso 2: Ejecutar Script de Sincronización
1. Crea una **Nueva consulta** en SQL Editor
2. Copia y pega **TODO** el contenido del archivo `sync-supabase-schema.sql`
3. Haz clic en **RUN** para ejecutar el script
4. Verifica que aparezca el mensaje: `"Schema synchronization completed! RLS disabled for testing."`

### Paso 3: Probar la Aplicación
1. Regresa a tu aplicación local: http://localhost:5173
2. Intenta crear una nueva orden de servicio
3. Verifica que NO aparezcan errores de columnas faltantes

## ✅ CAMBIOS REALIZADOS EN EL CÓDIGO

### AuthContext.jsx
- ✅ **Logout mejorado**: Ahora limpia el estado local primero
- ✅ **Manejo de errores**: Los errores de Supabase no bloquean el logout
- ✅ **Fallback robusto**: Funciona incluso si Supabase falla

### ServiceOrderForm.jsx
- ✅ **Campos corregidos**: `totalPaid` → `total_paid`
- ✅ **Columnas agregadas**: `pending_balance` calculado dinámicamente
- ✅ **Mapeo correcto**: Todos los campos coinciden con el esquema

## 🔧 QUÉ HACE EL SCRIPT DE SINCRONIZACIÓN

```sql
-- 1. Verifica estructura actual de tablas
-- 2. Agrega columnas faltantes:
--    - pending_balance
--    - total_paid  
--    - total_part_cost
--    - profit
-- 3. Deshabilita RLS temporalmente para pruebas
-- 4. Confirma que todo está sincronizado
```

## 🚀 DESPUÉS DE LA SINCRONIZACIÓN

### Si Todo Funciona Correctamente:
1. La aplicación debería funcionar sin errores
2. Podrás crear/editar órdenes de servicio
3. El logout funcionará correctamente

### Si Quieres Volver a Habilitar RLS:
```sql
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;
```

## 🆘 SI SIGUEN LOS ERRORES

### Error: "Column still not found"
- Verifica que el script se ejecutó completamente
- Revisa la consola de Supabase por errores SQL
- Ejecuta manualmente cada comando ALTER TABLE

### Error: "RLS Policy violation"
- Las políticas RLS están bloqueando las operaciones
- Mantén RLS deshabilitado hasta resolver las políticas
- Revisa que `user_id` esté correctamente configurado

### Error: "Auth error persists"
- Limpia el cache del navegador
- Verifica las variables de entorno VITE_SUPABASE_*
- Reinicia el servidor de desarrollo

## 📞 ESTADO ACTUAL

- ✅ **Código sincronizado**: Todos los campos corregidos
- ✅ **Script creado**: `sync-supabase-schema.sql` listo
- ✅ **Logout mejorado**: Manejo robusto de errores
- ⏳ **Pendiente**: Ejecutar script en Supabase

---

**⚡ ACCIÓN REQUERIDA**: Ejecutar `sync-supabase-schema.sql` en SQL Editor de Supabase **AHORA**