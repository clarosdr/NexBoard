# NexBoard - Sistema de Gestión Empresarial

NexBoard es una aplicación web completa para la gestión empresarial que incluye manejo de órdenes de servicio, control financiero, gestión de gastos, y más.

## 🚀 Características Principales

- **Gestión de Órdenes de Servicio**: CRUD completo con cálculos automáticos
- **Dashboard Financiero**: Métricas en tiempo real y reportes
- **Gestión de Gastos**: Presupuestarios y casuales
- **Gestión de Licencias**: Control de licencias de software
- **Gestor de Contraseñas**: Almacenamiento seguro de credenciales
- **Credenciales de Servidores**: Gestión de accesos a servidores
- **Modo Oscuro**: Interfaz adaptable con tema claro/oscuro
- **PWA**: Funciona como aplicación nativa
- **Responsive**: Optimizado para móviles y desktop

## 🛠️ Tecnologías

- **Frontend**: React 19.1.1 + Vite 7.1.2
- **Estilos**: Tailwind CSS 4.1.12
- **Backend**: Supabase (PostgreSQL + Auth)
- **Autenticación**: Supabase Auth
- **PWA**: Service Worker integrado
- **TypeScript**: Para type checking

## 📋 Correcciones Implementadas

### ✅ Problemas Solucionados

1. **Tema no se aplicaba correctamente**
   - Corregido el ThemeContext para aplicar tema inmediatamente
   - Mejorada la sincronización con localStorage
   - Agregada preferencia explícita del usuario

2. **Errores en gastos casuales**
   - Reemplazado `Date.now()` por UUID para IDs únicos
   - Mejorado manejo de errores y validaciones
   - Agregado estado de carga para prevenir doble envío

3. **Problemas de cache**
   - Implementado sistema de cache inteligente (5 min TTL)
   - Agregado componente CacheManager para limpieza manual
   - Invalidación automática de cache en operaciones CRUD

4. **Pérdida de nombre del cliente**
   - Corregido ServiceOrderForm para preservar datos
   - Mejoradas validaciones de formulario
   - Agregado UUID para IDs consistentes

5. **Optimizaciones generales**
   - Limpieza automática de localStorage obsoleto
   - Mejor manejo de estados de carga
   - Validaciones mejoradas en formularios

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd nexboard
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

4. **Configurar base de datos en Supabase**
   
   Crear las siguientes tablas en tu proyecto de Supabase:

   ```sql
   -- Tabla de órdenes de servicio
   CREATE TABLE service_orders (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     customer_name TEXT NOT NULL,
     description TEXT NOT NULL,
     date DATE NOT NULL,
     status TEXT NOT NULL DEFAULT 'pendiente',
     items JSONB NOT NULL DEFAULT '[]',
     payments JSONB NOT NULL DEFAULT '[]',
     total_paid DECIMAL DEFAULT 0,
     total DECIMAL DEFAULT 0,
     total_part_cost DECIMAL DEFAULT 0,
     profit DECIMAL DEFAULT 0,
     pending_balance DECIMAL DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabla de gastos casuales
   CREATE TABLE casual_expenses (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     description TEXT NOT NULL,
     amount DECIMAL NOT NULL,
     date DATE NOT NULL,
     category TEXT NOT NULL,
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabla de gastos presupuestarios
   CREATE TABLE budget_expenses (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     description TEXT NOT NULL,
     amount DECIMAL NOT NULL,
     date DATE NOT NULL,
     category TEXT NOT NULL,
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabla de licencias
   CREATE TABLE licenses (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     name TEXT NOT NULL,
     license_key TEXT NOT NULL,
     expiry_date DATE,
     status TEXT NOT NULL DEFAULT 'active',
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabla de contraseñas
   CREATE TABLE passwords (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     service_name TEXT NOT NULL,
     username TEXT NOT NULL,
     password TEXT NOT NULL,
     url TEXT,
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabla de credenciales de servidor
   CREATE TABLE server_credentials (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     server_name TEXT NOT NULL,
     ip_address TEXT,
     username TEXT NOT NULL,
     password TEXT NOT NULL,
     port INTEGER DEFAULT 22,
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Habilitar RLS (Row Level Security)
   ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE casual_expenses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
   ALTER TABLE server_credentials ENABLE ROW LEVEL SECURITY;

   -- Políticas de seguridad
   CREATE POLICY "Users can only access their own data" ON service_orders
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can only access their own data" ON casual_expenses
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can only access their own data" ON budget_expenses
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can only access their own data" ON licenses
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can only access their own data" ON passwords
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can only access their own data" ON server_credentials
     FOR ALL USING (auth.uid() = user_id);
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

6. **Construir para producción**
   ```bash
   npm run build
   ```

## 🔧 Gestión de Cache

La aplicación incluye un sistema de cache inteligente para optimizar el rendimiento:

- **Cache automático**: 5 minutos TTL por defecto
- **Invalidación inteligente**: Se limpia automáticamente en operaciones CRUD
- **Gestión manual**: Botones para limpiar cache cuando sea necesario

### Limpiar Cache

1. **Cache del usuario actual**: Botón "🔄 Cache Usuario"
2. **Cache completo**: Botón "🗑️ Limpiar Todo" (recarga la página)

## 📱 PWA (Progressive Web App)

La aplicación funciona como PWA con:
- Service Worker para cache offline
- Manifest para instalación nativa
- Actualizaciones automáticas

## 🎨 Personalización

### Temas
- Modo claro/oscuro automático
- Persistencia de preferencias
- Transiciones suaves

### Responsive Design
- Optimizado para móviles
- Pull-to-refresh en tablas
- Gestos táctiles (swipe)

## 🚀 Despliegue

### Netlify (Recomendado)
```bash
npm run deploy:netlify
```

### Manual
```bash
npm run build
# Subir carpeta dist/ a tu hosting
```

## 🐛 Solución de Problemas

### Cache no se actualiza
- Usar el botón "🗑️ Limpiar Todo" en el header
- Verificar que las variables de entorno estén configuradas

### Tema no cambia
- Limpiar localStorage: `localStorage.clear()`
- Verificar que no haya errores en consola

### Datos no se guardan
- Verificar conexión a Supabase
- Revisar configuración de RLS en Supabase
- Verificar que el usuario esté autenticado

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas, por favor abre un issue en el repositorio.