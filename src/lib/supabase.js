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
    cache.set(cacheKey, data)
    return data
  },

  async createServiceOrder(orderData, userId) {
    const { data, error } = await supabase
      .from('service_orders')
      .insert({ ...orderData, user_id: userId })
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
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
    return data
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
    // Sanitizar datos de entrada
    const sanitizedData = {
      ...passwordData,
      user_id: userId,
      service_name: sanitizeInput(passwordData.service_name, 200),
      username: passwordData.username ? sanitizeInput(passwordData.username, 200) : null,
      email: passwordData.email ? sanitizeInput(passwordData.email, 200) : null,
      url: passwordData.url ? sanitizeInput(passwordData.url, 500) : null,
      category: passwordData.category ? sanitizeInput(passwordData.category, 100) : null,
      notes: passwordData.notes ? sanitizeInput(passwordData.notes, 1000) : null
    }
    
    // Encriptar contraseña usando las funciones de la base de datos
    if (passwordData.password) {
      const { data: encryptedData, error: encryptError } = await supabase
        .rpc('encrypt_password', { password_text: passwordData.password })
      
      if (encryptError) throw encryptError
      sanitizedData.password_encrypted = encryptedData
      delete sanitizedData.password // Remover contraseña en texto plano
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
    // Sanitizar datos de entrada
    const sanitizedData = {
      ...passwordData,
      service_name: passwordData.service_name ? sanitizeInput(passwordData.service_name, 200) : undefined,
      username: passwordData.username ? sanitizeInput(passwordData.username, 200) : undefined,
      email: passwordData.email ? sanitizeInput(passwordData.email, 200) : undefined,
      url: passwordData.url ? sanitizeInput(passwordData.url, 500) : undefined,
      category: passwordData.category ? sanitizeInput(passwordData.category, 100) : undefined,
      notes: passwordData.notes ? sanitizeInput(passwordData.notes, 1000) : undefined
    }
    
    // Encriptar contraseña si se proporciona una nueva
    if (passwordData.password) {
      const { data: encryptedData, error: encryptError } = await supabase
        .rpc('encrypt_password', { password_text: passwordData.password })
      
      if (encryptError) throw encryptError
      sanitizedData.password_encrypted = encryptedData
      delete sanitizedData.password // Remover contraseña en texto plano
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

  async createBudgetExpense(expenseData) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .insert(expenseData)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(expenseData.user_id)
    return data
  },

  async updateBudgetExpense(expenseId, expenseData) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .select()
      .single()

    if (error) throw error
    if (expenseData.user_id) {
      this.clearUserCache(expenseData.user_id)
    }
    return data
  },

  async deleteBudgetExpense(expenseId) {
    const { error } = await supabase
      .from('budget_expenses')
      .delete()
      .eq('id', expenseId)

    if (error) throw error
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
      vpnIp: row.ip_address || '',
      localName: row.local_name || '',
      // Asegurar estructura de usuarios como array
      users: Array.isArray(row.users) ? row.users : [],
    }))

    cache.set(cacheKey, mapped)
    return mapped
  },

  async createServerCredential(credentialData, userId) {
    // Sanitizar datos de entrada y mapear a columnas de BD (snake_case)
    const sanitizedData = {
      user_id: userId,
      client: credentialData.client ? sanitizeInput(credentialData.client, 200) : null,
      server_name: sanitizeInput(credentialData.server_name, 200),
      ip_address: credentialData.vpnIp ? sanitizeInput(credentialData.vpnIp, 100) : null,
      local_name: credentialData.localName ? sanitizeInput(credentialData.localName, 200) : null,
      notes: credentialData.notes ? sanitizeInput(credentialData.notes, 1000) : null,
    }

    // Encriptar contraseña de VPN si se proporciona (se guarda en password_encrypted)
    if (credentialData.password) {
      const { data: encryptedData, error: encryptError } = await supabase
        .rpc('encrypt_password', { password_text: credentialData.password })
      if (encryptError) throw encryptError
      sanitizedData.password_encrypted = encryptedData
    }

    // Encriptar contraseñas de usuarios si vienen en el payload
    if (Array.isArray(credentialData.users)) {
      const encryptedUsers = []
      for (const u of credentialData.users) {
        const username = sanitizeInput(u.username || '', 200)
        let userObj = { username }
        if (u.password && u.password.trim()) {
          const { data: encUserPwd, error: encUserErr } = await supabase
            .rpc('encrypt_password', { password_text: u.password.trim() })
          if (encUserErr) throw encUserErr
          userObj.password_encrypted = encUserPwd
        }
        encryptedUsers.push(userObj)
      }
      sanitizedData.users = encryptedUsers
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
      vpnIp: data.ip_address || '',
      localName: data.local_name || '',
      users: Array.isArray(data.users) ? data.users : [],
    }
  },

  async updateServerCredential(credentialId, credentialData, userId) {
    // Sanitizar datos de entrada y mapear a columnas de BD (snake_case)
    const sanitizedData = {
      client: credentialData.client ? sanitizeInput(credentialData.client, 200) : undefined,
      server_name: credentialData.server_name ? sanitizeInput(credentialData.server_name, 200) : undefined,
      ip_address: credentialData.vpnIp ? sanitizeInput(credentialData.vpnIp, 100) : undefined,
      local_name: credentialData.localName ? sanitizeInput(credentialData.localName, 200) : undefined,
      notes: credentialData.notes ? sanitizeInput(credentialData.notes, 1000) : undefined,
    }

    // Encriptar contraseña de VPN si se proporciona una nueva
    if (credentialData.password) {
      const { data: encryptedData, error: encryptError } = await supabase
        .rpc('encrypt_password', { password_text: credentialData.password })
      if (encryptError) throw encryptError
      sanitizedData.password_encrypted = encryptedData
    }

    // Actualizar usuarios: si se envían, re-encriptar contraseñas provistas
    if (Array.isArray(credentialData.users)) {
      const encryptedUsers = []
      for (const u of credentialData.users) {
        const username = sanitizeInput(u.username || '', 200)
        let userObj = { username }
        if (u.password && u.password.trim()) {
          const { data: encUserPwd, error: encUserErr } = await supabase
            .rpc('encrypt_password', { password_text: u.password.trim() })
          if (encUserErr) throw encUserErr
          userObj.password_encrypted = encUserPwd
        } else if (u.password_encrypted) {
          // Permitir conservar encriptado existente si viene del cliente
          userObj.password_encrypted = u.password_encrypted
        }
        encryptedUsers.push(userObj)
      }
      sanitizedData.users = encryptedUsers
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
      vpnIp: data.ip_address || '',
      localName: data.local_name || '',
      users: Array.isArray(data.users) ? data.users : [],
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
