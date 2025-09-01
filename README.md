# NexBoard - Sistema de Gestión Empresarial

NexBoard incluye manejo de órdenes de servicio, control financiero, gestión de gastos, y más.

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
- **Modo Demo**: Funciona sin configuración usando localStorage

## 🛠️ Tecnologías

- **Frontend**: React 19.1.1 + Vite 7.1.2
- **Estilos**: Tailwind CSS 4.1.12
- **Backend**: Supabase (PostgreSQL + Auth) o localStorage (modo demo)
- **Autenticación**: Supabase Auth o demo local
- **PWA**: Service Worker integrado

## 📋 Problemas Solucionados

### ✅ **Correcciones Implementadas:**

1. **Tema no se aplicaba correctamente**
   - ✅ Corregido el ThemeContext para aplicar tema inmediatamente
   - ✅ Mejorada la sincronización con localStorage
   - ✅ Agregada preferencia explícita del usuario

2. **Errores en gastos casuales**
   - ✅ Reemplazado `Date.now()` por UUID para IDs únicos
   - ✅ Mejorado manejo de errores y validaciones
   - ✅ Agregado estado de carga para prevenir doble envío

3. **Problemas de cache**
   - ✅ Implementado sistema de cache inteligente (5 min TTL)
   - ✅ Agregado componente CacheManager para limpieza manual
   - ✅ Invalidación automática de cache en operaciones CRUD

4. **Pérdida de nombre del cliente**
   - ✅ Corregido ServiceOrderForm para preservar datos
   - ✅ Mejoradas validaciones de formulario
   - ✅ Agregado UUID para IDs consistentes

5. **Sistema híbrido localStorage/Supabase**
   - ✅ Funciona sin configuración (modo demo)
   - ✅ Migración automática a Supabase cuando se configure
   - ✅ Fallback inteligente a localStorage

## 🚀 Instalación y Configuración

### Opción 1: Modo Demo (Sin configuración)

```bash
# Clonar el repositorio
git clone <repository-url>
cd nexboard

# Instalar dependencias
npm install

# Ejecutar en modo demo
npm run dev
```

**¡Listo!** La aplicación funcionará inmediatamente en modo demo usando localStorage.

### Opción 2: Configuración con Supabase (Producción)

#### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

#### Pasos:

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Crear proyecto en Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Crea un nuevo proyecto
   - Anota la URL y la clave anónima

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

4. **Configurar base de datos**
   - Ve al SQL Editor en tu proyecto de Supabase
   - Copia y ejecuta el contenido de `supabase-setup.sql`
   - Esto creará todas las tablas, índices y políticas de seguridad

5. **Ejecutar la aplicación**
   ```bash
   npm run dev
   ```

## 🔧 Características del Sistema

### Modo Demo vs Producción

| Característica | Modo Demo | Modo Producción |
|---|---|---|
| **Almacenamiento** | localStorage | Supabase PostgreSQL |
| **Autenticación** | Simulada | Supabase Auth real |
| **Datos** | Locales al navegador | Sincronizados en la nube |
| **Usuarios múltiples** | No | Sí |
| **Backup automático** | No | Sí |
| **Configuración** | Ninguna | Variables de entorno |

### Gestión de Cache

La aplicación incluye un sistema de cache inteligente:

- **Cache automático**: 5 minutos TTL por defecto
- **Invalidación inteligente**: Se limpia automáticamente en operaciones CRUD
- **Gestión manual**: Botones en el header para limpiar cache

#### Botones de Cache:
- **🔄 Cache**: Limpiar cache del usuario actual
- **🗑️ Datos**: Eliminar todos los datos locales (solo modo demo)
- **🔄 Todo**: Limpiar todo el cache y recargar

### Migración de Datos

Si tienes datos en localStorage y configuras Supabase:
1. La aplicación detectará automáticamente los datos locales
2. Mostrará un modal de migración
3. Podrás migrar todos los datos a Supabase con un clic

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
- Detección de preferencia del sistema

### Responsive Design
- Optimizado para móviles
- Pull-to-refresh en tablas
- Gestos táctiles (swipe)
- Menú hamburguesa en móviles

## 🚀 Despliegue

### Netlify (Recomendado)
```bash
npm run build
# Subir carpeta dist/ a Netlify
```

### Vercel
```bash
npm run build
# Conectar repositorio con Vercel
```

### Manual
```bash
npm run build
# Subir carpeta dist/ a tu hosting
```

## 🐛 Solución de Problemas

### La aplicación no carga
- Verificar que Node.js esté instalado
- Ejecutar `npm install` para instalar dependencias
- Verificar que el puerto 5173 esté disponible

### Errores de Supabase
- Verificar que las variables de entorno estén configuradas correctamente
- Ejecutar el script `supabase-setup.sql` en Supabase
- Verificar que RLS esté habilitado en las tablas

### Tema no cambia
- Limpiar localStorage: `localStorage.clear()`
- Verificar que no haya errores en consola
- Usar el botón "🔄 Todo" para limpiar cache

### Datos no se guardan
**Modo Demo:**
- Los datos se guardan en localStorage del navegador
- Limpiar el navegador eliminará los datos

**Modo Producción:**
- Verificar conexión a Supabase
- Revisar configuración de RLS en Supabase
- Verificar que el usuario esté autenticado

### Cache no se actualiza
- Usar el botón "🔄 Cache" en el header
- Si persiste, usar "🔄 Todo" para recargar completamente

## 📊 Estructura de Datos

### Órdenes de Servicio
```json
{
  "id": "uuid",
  "customerName": "string",
  "description": "string",
  "date": "YYYY-MM-DD",
  "status": "pendiente|en_proceso|finalizado|entregado",
  "items": [
    {
      "id": "number",
      "description": "string",
      "quantity": "number",
      "unitPrice": "number",
      "partCost": "number"
    }
  ],
  "payments": [
    {
      "id": "number",
      "date": "YYYY-MM-DD",
      "amount": "number",
      "method": "efectivo|transferencia|tarjeta|cheque",
      "description": "string"
    }
  ]
}
```

### Gastos Casuales
```json
{
  "id": "uuid",
  "description": "string",
  "amount": "number",
  "date": "YYYY-MM-DD",
  "category": "alimentacion|transporte|entretenimiento|salud|compras|servicios|educacion|otros",
  "notes": "string"
}
```

## 🔒 Seguridad

- **RLS (Row Level Security)**: Cada usuario solo ve sus datos
- **Autenticación**: Supabase Auth con JWT
- **Validación**: Validación en frontend y backend
- **HTTPS**: Comunicación encriptada con Supabase

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico:
1. Revisa la sección de solución de problemas
2. Verifica que tengas la última versión
3. Abre un issue en el repositorio con detalles del problema

## 🎯 Roadmap

- [ ] Exportación de datos a Excel/PDF
- [ ] Notificaciones push
- [ ] API REST para integraciones
- [ ] Dashboard de analytics avanzado
- [ ] Modo offline completo
- [ ] Integración con sistemas de facturación