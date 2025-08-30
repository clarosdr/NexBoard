# Guía de Despliegue en Netlify

## Preparación del Repositorio

### 1. Inicializar Git (si no está inicializado)
```bash
git init
git add .
git commit -m "Initial commit: NexBoard application with Supabase integration"
```

### 2. Conectar con GitHub/GitLab
```bash
# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/nexboard.git
git branch -M main
git push -u origin main
```

## Configuración en Netlify

### Opción 1: Despliegue desde Git (Recomendado)

1. **Conectar Repositorio**
   - Ve a [Netlify](https://netlify.com)
   - Click en "New site from Git"
   - Conecta tu cuenta de GitHub/GitLab
   - Selecciona el repositorio `nexboard`

2. **Configuración de Build**
   - **Base directory**: (dejar vacío)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions` (opcional)

3. **Variables de Entorno**
   En Site settings > Environment variables, agregar:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

### Opción 2: Despliegue Manual

1. **Build Local**
   ```bash
   npm run build
   ```

2. **Subir a Netlify**
   - Ve a [Netlify](https://netlify.com)
   - Arrastra la carpeta `dist` al área de despliegue

## Configuración Post-Despliegue

### 1. Configurar Dominio en Supabase
- Ve a tu proyecto en Supabase
- Authentication > URL Configuration
- Agregar tu dominio de Netlify: `https://tu-app.netlify.app`

### 2. Configurar Redirects (ya incluido en netlify.toml)
El archivo `netlify.toml` ya incluye la configuración necesaria para SPA.

### 3. Configurar Headers de Seguridad
Ya configurados en `netlify.toml`:
- X-Frame-Options
- X-XSS-Protection
- Content Security Policy
- Cache headers optimizados

## Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

## Optimizaciones Incluidas

### Build Optimizado
- ✅ Minificación con esbuild
- ✅ Code splitting (vendor, supabase chunks)
- ✅ Tree shaking automático
- ✅ Asset optimization
- ✅ Gzip compression

### Performance
- ✅ Lazy loading de componentes
- ✅ Cache headers optimizados
- ✅ Service Worker para PWA
- ✅ Preload de recursos críticos

### Seguridad
- ✅ Headers de seguridad
- ✅ CSP (Content Security Policy)
- ✅ HTTPS forzado
- ✅ Variables de entorno seguras

## Monitoreo y Mantenimiento

### Analytics
- Netlify Analytics (opcional, de pago)
- Google Analytics (configurar en el código)

### Logs
- Ver logs de build en Netlify Dashboard
- Logs de funciones (si se usan)

### Actualizaciones
```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit
npm audit fix
```

## Troubleshooting

### Build Fails
1. Verificar variables de entorno
2. Revisar logs de build en Netlify
3. Probar build local: `npm run build`

### 404 en Rutas
- Verificar que `_redirects` esté en `public/`
- Confirmar configuración en `netlify.toml`

### Errores de Supabase
1. Verificar URL y clave en variables de entorno
2. Confirmar dominio en Supabase Auth settings
3. Revisar políticas RLS en Supabase

## Costos Estimados

### Netlify (Tier Gratuito)
- ✅ 100GB bandwidth/mes
- ✅ 300 build minutes/mes
- ✅ Deploy automático desde Git
- ✅ HTTPS gratuito
- ✅ Formularios (100 submissions/mes)

### Supabase (Tier Gratuito)
- ✅ 500MB database
- ✅ 50,000 monthly active users
- ✅ 2GB bandwidth
- ✅ 50MB file storage

**Total: $0/mes** para uso básico/desarrollo