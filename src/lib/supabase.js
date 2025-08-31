import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase desde variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar si Supabase está configurado correctamente
export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    typeof supabaseAnonKey === 'string' &&
    supabaseUrl.includes('supabase.co') &&
    supabaseAnonKey.length > 20
  )
}

// Crear cliente con persistencia de sesión y refresco automático
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Mantener sesión activa
    autoRefreshToken: true     // Renovar token automáticamente
  }
})

// Cache simple para optimizar consultas (opcional)
class SimpleCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutos por defecto
    this.cache = new Map()
    this.ttl = ttl
  }
  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() })
  }
  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }
}

export const cache = new SimpleCache()
