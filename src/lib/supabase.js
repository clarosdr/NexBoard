import { createClient } from '@supabase/supabase-js'
import { sanitizeInput } from '../utils/security.js'

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

// Hacer supabase disponible globalmente para debugging en consola
if (typeof window !== 'undefined') {
  window.supabase = supabase
  console.log('🔧 Supabase client disponible en window.supabase para debugging')
}

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

// Servicio de Supabase con métodos CRUD
export const supabaseService = {
  // Cache methods
  clearCache() {
    cache.cache.clear()
  },
  
  clearUserCache(userId) {
    const keysToDelete = []
    for (const [key] of cache.cache) {
      if (key.includes(userId)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => cache.cache.delete(key))
  },

  // Service Orders
  async getServiceOrders(userId) {
    const cacheKey = `service_orders_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Mapear campos de BD a nombres del frontend
    const mapped = (data || []).map((row) => ({
      ...row,
      websiteApp: row.website_application || '',
      userOrEmail: row.username_email || '',
      password: row.password_value || '',
    }))
    
    cache.set(cacheKey, mapped)
    return mapped
  },

  async createServiceOrder(orderData, userId) {
    const { data, error } = await supabase
      .from('service_orders')
      .insert({ ...orderData, user_id: userId })
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    
    // Mapear respuesta al formato del frontend
    return {
      ...data,
      websiteApp: data.website_application || '',
      userOrEmail: data.username_email || '',
      password: data.password_value || '',
    }
  },

  async updateServiceOrder(orderId, orderData, userId) {
    const { data, error } = await supabase
      .from('service_orders')
      .update(orderData)
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    
    // Mapear respuesta al formato del frontend
    return {
      ...data,
      websiteApp: data.website_application || '',
      userOrEmail: data.username_email || '',
      password: data.password_value || '',
    }
  },

  async deleteServiceOrder(orderId, userId) {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', orderId)
      .eq('user_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Passwords (with encryption)
  async getPasswords(userId) {
    const cacheKey = `passwords_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createPassword(passwordData, userId) {
    // Sanitizar datos de entrada usando los campos correctos del esquema
    const sanitizedData = {
      user_id: userId,
      website_application: sanitizeInput(passwordData.websiteApp || passwordData.service_name || '', 200),
      username_email: sanitizeInput(passwordData.userOrEmail || passwordData.username || passwordData.email || '', 200),
      password_value: passwordData.password || '',
      category: passwordData.category ? sanitizeInput(passwordData.category, 100) : 'Otros',
      notes: passwordData.notes ? sanitizeInput(passwordData.notes, 1000) : null
    }

    const { data, error } = await supabase
      .from('passwords')
      .insert(sanitizedData)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async updatePassword(passwordId, passwordData, userId) {
    // Sanitizar datos de entrada usando los campos correctos del esquema
    const sanitizedData = {}
    
    if (passwordData.websiteApp || passwordData.service_name) {
      sanitizedData.website_application = sanitizeInput(passwordData.websiteApp || passwordData.service_name, 200)
    }
    if (passwordData.userOrEmail || passwordData.username || passwordData.email) {
      sanitizedData.username_email = sanitizeInput(passwordData.userOrEmail || passwordData.username || passwordData.email, 200)
    }
    if (passwordData.password) {
      sanitizedData.password_value = passwordData.password
    }
    if (passwordData.category) {
      sanitizedData.category = sanitizeInput(passwordData.category, 100)
    }
    if (passwordData.notes !== undefined) {
      sanitizedData.notes = passwordData.notes ? sanitizeInput(passwordData.notes, 1000) : null
    }

    const { data, error } = await supabase
      .from('passwords')
      .update(sanitizedData)
      .eq('id', passwordId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async deletePassword(passwordId, userId) {
    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', passwordId)
      .eq('user_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Verificar contraseña
  async verifyPassword(passwordId, passwordText, userId) {
    const { data: password, error: fetchError } = await supabase
      .from('passwords')
      .select('password_encrypted')
      .eq('id', passwordId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError) throw fetchError
    
    const { data: isValid, error: verifyError } = await supabase
      .rpc('verify_password', { 
        password_text: passwordText, 
        encrypted_password: password.password_encrypted 
      })
    
    if (verifyError) throw verifyError
    return isValid
  },

  // Budget Expenses
  async getBudgetExpenses(userId) {
    const cacheKey = `budget_expenses_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('budget_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createBudgetExpense(expenseData, userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .insert({ ...expenseData, user_id: userId })
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async updateBudgetExpense(expenseId, expenseData, userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async deleteBudgetExpense(expenseId, userId) {
    const { error } = await supabase
      .from('budget_expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Casual Expenses
  async getCasualExpenses(userId) {
    const cacheKey = `casual_expenses_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('casual_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createCasualExpense(expenseData, userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .insert({ ...expenseData, user_id: userId })
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async updateCasualExpense(expenseId, expenseData, userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async deleteCasualExpense(expenseId, userId) {
    const { error } = await supabase
      .from('casual_expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Licenses
  async getLicenses(userId) {
    const cacheKey = `licenses_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createLicense(licenseData, userId) {
    const { data, error } = await supabase
      .from('licenses')
      .insert({ ...licenseData, user_id: userId })
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async updateLicense(licenseId, licenseData, userId) {
    const { data, error } = await supabase
      .from('licenses')
      .update(licenseData)
      .eq('id', licenseId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async deleteLicense(licenseId, userId) {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId)
      .eq('user_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Server Credentials (with encryption)
  async getServerCredentials(userId) {
    const cacheKey = `server_credentials_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('server_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Mapear a la forma usada por el frontend (camelCase)
    const mapped = (data || []).map((row) => ({
      ...row,
      client: row.company || '',
      vpnIp: row.vpn_ip || '',
      localName: row.local_name || '',
      password: row.vpn_password || '',
      // Convertir usuarios de texto a array
      users: row.users ? row.users.split(';').map(u => {
        const [username, password] = u.split(':')
        return { username: username || '', password: password || '' }
      }).filter(u => u.username) : [],
    }))

    cache.set(cacheKey, mapped)
    return mapped
  },

  async createServerCredential(credentialData, userId) {
    // Sanitizar datos de entrada usando los campos correctos del esquema
    const sanitizedData = {
      user_id: userId,
      company: credentialData.client || credentialData.company ? sanitizeInput(credentialData.client || credentialData.company, 200) : null,
      server_name: sanitizeInput(credentialData.server_name, 200),
      vpn_ip: credentialData.vpnIp ? sanitizeInput(credentialData.vpnIp, 100) : null,
      local_name: credentialData.localName ? sanitizeInput(credentialData.localName, 200) : null,
      notes: credentialData.notes ? sanitizeInput(credentialData.notes, 1000) : null,
    }

    // Guardar contraseña VPN directamente (sin encriptar según el esquema actual)
    if (credentialData.password) {
      sanitizedData.vpn_password = credentialData.password
    }

    // Guardar usuarios como texto simple (según esquema actual)
    if (Array.isArray(credentialData.users)) {
      const usersText = credentialData.users.map(u => {
        const username = sanitizeInput(u.username || '', 200)
        const password = u.password ? u.password.trim() : ''
        return `${username}:${password}`
      }).join(';')
      sanitizedData.users = usersText
    }

    const { data, error } = await supabase
      .from('server_credentials')
      .insert(sanitizedData)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)

    // Devolver en formato frontend
    return {
      ...data,
      client: data.company || '',
      vpnIp: data.vpn_ip || '',
      localName: data.local_name || '',
      password: data.vpn_password || '',
      users: data.users ? data.users.split(';').map(u => {
        const [username, password] = u.split(':')
        return { username: username || '', password: password || '' }
      }).filter(u => u.username) : [],
    }
  },

  async updateServerCredential(credentialId, credentialData, userId) {
    // Sanitizar datos de entrada usando los campos correctos del esquema
    const sanitizedData = {}
    
    if (credentialData.client || credentialData.company) {
      sanitizedData.company = sanitizeInput(credentialData.client || credentialData.company, 200)
    }
    if (credentialData.server_name) {
      sanitizedData.server_name = sanitizeInput(credentialData.server_name, 200)
    }
    if (credentialData.vpnIp) {
      sanitizedData.vpn_ip = sanitizeInput(credentialData.vpnIp, 100)
    }
    if (credentialData.localName) {
      sanitizedData.local_name = sanitizeInput(credentialData.localName, 200)
    }
    if (credentialData.notes !== undefined) {
      sanitizedData.notes = credentialData.notes ? sanitizeInput(credentialData.notes, 1000) : null
    }

    // Guardar contraseña VPN directamente (sin encriptar según el esquema actual)
    if (credentialData.password) {
      sanitizedData.vpn_password = credentialData.password
    }

    // Guardar usuarios como texto simple (según esquema actual)
    if (Array.isArray(credentialData.users)) {
      const usersText = credentialData.users.map(u => {
        const username = sanitizeInput(u.username || '', 200)
        const password = u.password ? u.password.trim() : ''
        return `${username}:${password}`
      }).join(';')
      sanitizedData.users = usersText
    }

    const { data, error } = await supabase
      .from('server_credentials')
      .update(sanitizedData)
      .eq('id', credentialId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)

    // Devolver en formato frontend
    return {
      ...data,
      client: data.company || '',
      vpnIp: data.vpn_ip || '',
      localName: data.local_name || '',
      password: data.vpn_password || '',
      users: data.users ? data.users.split(';').map(u => {
        const [username, password] = u.split(':')
        return { username: username || '', password: password || '' }
      }).filter(u => u.username) : [],
    }
  },

  async deleteServerCredential(credentialId, userId) {
    const { error } = await supabase
      .from('server_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Verificar contraseña de servidor
  async verifyServerPassword(credentialId, passwordText, userId) {
    const { data: credential, error: fetchError } = await supabase
      .from('server_credentials')
      .select('password_encrypted')
      .eq('id', credentialId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    if (!credential.password_encrypted) {
      return false // No hay contraseña configurada
    }

    const { data: isValid, error: verifyError } = await supabase
      .rpc('verify_password', {
        password_text: passwordText,
        encrypted_password: credential.password_encrypted
      })

    if (verifyError) throw verifyError
    return isValid
  }
}
