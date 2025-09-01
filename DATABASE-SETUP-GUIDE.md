# 🗄️ Guía de Configuración de Base de Datos - NexBoard

## 📋 Resumen

Esta guía te ayudará a configurar la base de datos de NexBoard desde cero con un esquema limpio y bien estructurado.

## 🚀 Pasos de Instalación

### Paso 1: Resetear Supabase
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings** → **General** → **Danger Zone**
3. Haz clic en **Reset Database** (esto eliminará todos los datos)
4. Confirma la acción

### Paso 2: Ejecutar el Esquema Principal
1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Copia y pega el contenido completo de `supabase-schema-clean.sql`
3. Haz clic en **Run** para ejecutar el script
4. Verifica que no hay errores en la consola

### Paso 3: Deshabilitar RLS para Desarrollo
1. En el mismo **SQL Editor**
2. Copia y pega el contenido de `disable-rls-for-development.sql`
3. Ejecuta el script
4. Esto permitirá que la aplicación funcione sin problemas de autenticación durante el desarrollo

### Paso 4: Verificar la Instalación
1. Ve a **Table Editor** en Supabase
2. Deberías ver estas 6 tablas:
   - `service_orders`
   - `casual_expenses`
   - `budget_expenses`
   - `licenses`
   - `passwords`
   - `server_credentials`

### Paso 5: Probar la Aplicación
1. Inicia tu aplicación: `npm run dev`
2. Ve a http://localhost:5173
3. Intenta crear registros en cada sección
4. Todo debería funcionar sin errores

## 📊 Estructura de las Tablas

### 🛠️ service_orders
- **Propósito**: Órdenes de servicio con items y pagos
- **Campos clave**: `customer_name`, `description`, `items`, `payments`, `total`, `profit`
- **Cálculos automáticos**: `total`, `total_part_cost`, `profit`, `pending_balance`

### 💰 casual_expenses
- **Propósito**: Gastos casuales categorizados
- **Campos clave**: `description`, `amount`, `date`, `category`
- **Categorías**: alimentacion, transporte, entretenimiento, salud, etc.

### 📋 budget_expenses
- **Propósito**: Gastos presupuestados
- **Campos clave**: `description`, `amount`, `date`, `category`

### 🔑 licenses
- **Propósito**: Licencias de software
- **Campos clave**: `software_name`, `license_key`, `expiry_date`, `status`

### 🔒 passwords
- **Propósito**: Contraseñas encriptadas
- **Campos clave**: `service_name`, `username`, `password_encrypted`
- **Seguridad**: Contraseñas encriptadas con bcrypt

### 🖥️ server_credentials
- **Propósito**: Credenciales de servidores
- **Campos clave**: `server_name`, `ip_address`, `username`, `password_encrypted`

## 🔧 Características del Esquema

### ✅ Funcionalidades Incluidas
- **UUIDs**: Todas las tablas usan UUID como clave primaria
- **Timestamps automáticos**: `created_at` y `updated_at` se manejan automáticamente
- **Encriptación**: Contraseñas encriptadas con funciones seguras
- **Índices**: Optimización de consultas por `user_id`, `date`, `status`
- **Validaciones**: Constraints para estados y categorías
- **Documentación**: Comentarios en todas las tablas

### 🛡️ Seguridad
- **RLS (Row Level Security)**: Usuarios solo ven sus propios datos
- **Encriptación**: Contraseñas encriptadas con bcrypt
- **Políticas simples**: Una política por tabla, fácil de entender

## 🔄 Para Producción

Cuando estés listo para producción:

1. Configura la autenticación correctamente
2. Ejecuta `enable-rls-for-production.sql`
3. Verifica que los usuarios solo ven sus propios datos

## 🆘 Solución de Problemas

### Error: "relation does not exist"
- Verifica que ejecutaste `supabase-schema-clean.sql` completamente
- Revisa la consola de Supabase por errores SQL

### Error: "RLS policy violation"
- Asegúrate de haber ejecutado `disable-rls-for-development.sql`
- Para producción, verifica que `auth.uid()` funciona correctamente

### Error: "column does not exist"
- El esquema está sincronizado con el código frontend
- Si modificaste el código, actualiza el esquema correspondientemente

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Supabase
2. Verifica que todas las tablas se crearon correctamente
3. Asegúrate de que RLS está deshabilitado para desarrollo

---

**¡Listo!** Tu base de datos debería estar funcionando perfectamente con este esquema limpio y bien estructurado. 🚀