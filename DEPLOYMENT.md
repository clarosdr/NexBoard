# Guía de Despliegue - NexBoard

Esta guía te ayudará a desplegar NexBoard usando Supabase como backend y Netlify para el frontend.

## 📋 Prerrequisitos

- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Netlify](https://netlify.com)
- Node.js instalado localmente
- Git configurado

## 🗄️ Paso 1: Configurar Supabase

### 1.1 Crear Proyecto
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Haz clic en "New Project"
3. Selecciona tu organización
4. Completa los datos:
   - **Name**: `nexboard-app`
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Selecciona la más cercana a tus usuarios
5. Haz clic en "Create new project"

### 1.2 Configurar Base de Datos
1. Una vez creado el proyecto, ve a la sección **SQL Editor**
2. Copia todo el contenido del archivo `supabase-schema.sql`
3. Pégalo en el editor SQL y ejecuta el script
4. Verifica que todas las tablas se hayan creado correctamente en la sección **Table Editor**

### 1.3 Obtener Credenciales
1. Ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 1.4 Configurar Autenticación
1. Ve a **Authentication** → **Settings**
2. En **Site URL**, agrega tu dominio de Netlify (lo obtendrás en el paso 2)
3. En **Redirect URLs**, agrega:
   - `http://localhost:5173` (para desarrollo)
   - Tu URL de Netlify (para producción)

## 🌐 Paso 2: Configurar Variables de Entorno

### 2.1 Archivo Local (.env)
1. Crea un archivo `.env` en la raíz del proyecto:
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

2. Reemplaza los valores con los obtenidos de Supabase

### 2.2 Probar Localmente
```bash
npm run dev
```

Verifica que:
- La aplicación carga correctamente
- Puedes registrarte/iniciar sesión
- Los datos se guardan en Supabase (verifica en Table Editor)

## 🚀 Paso 3: Desplegar en Netlify

### 3.1 Preparar Repositorio
1. Sube tu código a GitHub (si no lo has hecho):
```bash
git add .
git commit -m "Preparar para despliegue con Supabase"
git push origin main
```

### 3.2 Conectar con Netlify
1. Ve a [Netlify Dashboard](https://app.netlify.com)
2. Haz clic en "New site from Git"
3. Conecta con GitHub y selecciona tu repositorio
4. Configura el build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (en Environment variables)

### 3.3 Configurar Variables de Entorno en Netlify
1. En tu sitio de Netlify, ve a **Site settings** → **Environment variables**
2. Agrega las siguientes variables:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase

### 3.4 Configurar Redirects
1. Crea el archivo `public/_redirects` con el siguiente contenido:
```
/*    /index.html   200
```

Esto asegura que las rutas de React funcionen correctamente.

### 3.5 Desplegar
1. Haz commit de los cambios:
```bash
git add .
git commit -m "Configurar redirects para Netlify"
git push origin main
```

2. Netlify desplegará automáticamente tu sitio

## 🔧 Paso 4: Configuración Final

### 4.1 Actualizar URLs en Supabase
1. Copia la URL de tu sitio de Netlify (ejemplo: `https://amazing-app-123456.netlify.app`)
2. Ve a Supabase → **Authentication** → **Settings**
3. Actualiza:
   - **Site URL**: Tu URL de Netlify
   - **Redirect URLs**: Agrega tu URL de Netlify

### 4.2 Configurar Dominio Personalizado (Opcional)
1. En Netlify, ve a **Domain settings**
2. Haz clic en "Add custom domain"
3. Sigue las instrucciones para configurar tu dominio
4. Netlify proporcionará SSL automáticamente

## 🔄 Migración de Datos

Si tienes datos existentes en localStorage:

1. Exporta tus datos actuales desde la aplicación local
2. Regístrate en la aplicación desplegada
3. Importa los datos manualmente o usa las funciones de migración

## 📊 Monitoreo y Mantenimiento

### Supabase
- Monitorea el uso en el Dashboard de Supabase
- Configura backups automáticos
- Revisa los logs de autenticación

### Netlify
- Revisa los logs de build en caso de errores
- Configura notificaciones de despliegue
- Monitorea el rendimiento del sitio

## 🆘 Solución de Problemas

### Error de CORS
- Verifica que las URLs estén correctamente configuradas en Supabase
- Asegúrate de que las variables de entorno estén bien configuradas

### Error de Build
- Verifica que todas las dependencias estén instaladas
- Revisa los logs de build en Netlify
- Asegúrate de que la versión de Node.js sea compatible

### Problemas de Autenticación
- Verifica las URLs de redirect en Supabase
- Confirma que las variables de entorno estén correctas
- Revisa los logs de autenticación en Supabase

## 💰 Costos Estimados

- **Supabase**: Gratis hasta 50,000 usuarios activos mensuales
- **Netlify**: Gratis para sitios personales (100GB ancho de banda)
- **Dominio personalizado**: $10-15/año (opcional)

## 🔐 Seguridad

- Las contraseñas se almacenan encriptadas
- Row Level Security (RLS) está habilitado
- Todas las comunicaciones usan HTTPS
- Los datos están aislados por usuario

---

¡Tu aplicación NexBoard estará disponible 24/7 desde cualquier lugar del mundo! 🌍