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

  // Passwords
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
    const { data, error } = await supabase
      .from('passwords')
      .insert({ ...passwordData, user_id: userId })
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async updatePassword(passwordId, passwordData, userId) {
    const { data, error } = await supabase
      .from('passwords')
      .update(passwordData)
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

  // Server Credentials
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
    cache.set(cacheKey, data)
    return data
  },

  async createServerCredential(credentialData, userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .insert({ ...credentialData, user_id: userId })
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async updateServerCredential(credentialId, credentialData, userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .update(credentialData)
      .eq('id', credentialId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async deleteServerCredential(credentialId, userId) {
    const { error } = await supabase
      .from('server_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  }
}
