# 🔧 SOLUCIÓN AL ERROR DE SUPABASE

## ❌ Problema Actual
La aplicación muestra el error: **"Could not find the 'customer_name' column of 'service_orders' in the schema cache"**

Esto ocurre porque el esquema actual en Supabase no coincide con los campos que usa la aplicación.

## ✅ Solución

### Paso 1: Acceder a Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto NexBoard
4. Ve a la sección **SQL Editor** en el menú lateral

### Paso 2: Ejecutar la Migración
1. Abre el archivo `migration-fix-schema.sql` de este proyecto
2. Copia TODO el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** para ejecutar el script

### Paso 3: Verificar
1. Ve a **Table Editor** en Supabase
2. Busca la tabla `service_orders`
3. Verifica que tenga estas columnas:
   - `id` (bigint)
   - `user_id` (uuid)
   - `customer_name` (text) ← **Esta es la clave**
   - `description` (text)
   - `date` (date)
   - `status` (text)
   - `items` (jsonb)
   - `payments` (jsonb)
   - `total_paid` (numeric)
   - `total` (numeric)
   - `total_part_cost` (numeric)
   - `profit` (numeric)
   - `pending_balance` (numeric)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

### Paso 4: Probar la Aplicación
1. Regresa a tu aplicación web
2. Intenta crear una nueva orden de servicio
3. El error debería desaparecer

## ⚠️ IMPORTANTE
- **Este script eliminará todos los datos existentes** en la tabla `service_orders`
- Si tienes datos importantes, haz un backup antes de ejecutar
- Solo necesitas ejecutar esto UNA vez

## 🔍 ¿Por qué pasó esto?
El esquema original tenía campos como `client_name`, `problem_description`, etc., pero la aplicación espera `customer_name`, `description`, etc. El nuevo esquema elimina campos innecesarios y usa exactamente los mismos nombres que la aplicación.

## 📞 Si necesitas ayuda
Si tienes problemas ejecutando la migración, comparte una captura de pantalla del error en Supabase.