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
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_payments(*)
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Mapear campos de BD a nombres del frontend
    const mapped = (data || []).map((row) => ({
      ...row,
      items: row.order_items || [],
      payments: row.order_payments || []
    }))
    
    cache.set(cacheKey, mapped)
    return mapped
  },

  async createServiceOrder(orderData, userId) {
    // Preparar datos de la orden principal
    const orderPayload = {
      customer_name: orderData.customer_name,
      service_date: orderData.service_date,
      description: orderData.description,
      status: orderData.status || 'pending',
      owner_id: userId
    }

    // Crear la orden principal
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single()

    if (orderError) throw orderError

    // Crear items si existen
    let orderItems = []
    if (orderData.items && orderData.items.length > 0) {
      const itemsPayload = orderData.items.map(item => ({
        order_id: order.id,
        quantity: item.quantity || 1,
        item_desc: item.description || item.item_desc,
        unit_price: item.unitPrice || item.unit_price || 0,
        part_cost: item.partCost || item.part_cost || 0
      }))

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsPayload)
        .select()

      if (itemsError) throw itemsError
      orderItems = items
    }

    // Crear pagos si existen
    let orderPayments = []
    if (orderData.payments && orderData.payments.length > 0) {
      const paymentsPayload = orderData.payments.map(payment => ({
        order_id: order.id,
        amount: payment.amount || 0,
        payment_date: payment.date || payment.payment_date,
        payment_method: payment.method || payment.payment_method || 'efectivo'
      }))

      const { data: payments, error: paymentsError } = await supabase
        .from('order_payments')
        .insert(paymentsPayload)
        .select()

      if (paymentsError) throw paymentsError
      orderPayments = payments
    }

    this.clearUserCache(userId)
    
    // Devolver orden completa con items y pagos
    return {
      ...order,
      items: orderItems,
      payments: orderPayments
    }
  },

  async updateServiceOrder(orderId, orderData, userId) {
    // Preparar datos de la orden principal
    const orderPayload = {
      customer_name: orderData.customer_name,
      service_date: orderData.service_date,
      description: orderData.description,
      status: orderData.status
    }

    // Actualizar la orden principal
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update(orderPayload)
      .eq('id', orderId)
      .eq('owner_id', userId)
      .select()
      .single()

    if (orderError) throw orderError

    // Actualizar items si se proporcionan
    let orderItems = []
    if (Array.isArray(orderData.items)) {
      // Eliminar items existentes
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)

      // Crear nuevos items si existen
      if (orderData.items.length > 0) {
        const itemsPayload = orderData.items.map(item => ({
          order_id: orderId,
          quantity: item.quantity || 1,
          item_desc: item.description || item.item_desc,
          unit_price: item.unitPrice || item.unit_price || 0,
          part_cost: item.partCost || item.part_cost || 0
        }))

        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsPayload)
          .select()

        if (itemsError) throw itemsError
        orderItems = items
      }
    } else {
      // Si no se proporcionan items, obtener los existentes
      const { data: existingItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
      
      orderItems = existingItems || []
    }

    // Actualizar pagos si se proporcionan
    let orderPayments = []
    if (Array.isArray(orderData.payments)) {
      // Eliminar pagos existentes
      await supabase
        .from('order_payments')
        .delete()
        .eq('order_id', orderId)

      // Crear nuevos pagos si existen
      if (orderData.payments.length > 0) {
        const paymentsPayload = orderData.payments.map(payment => ({
          order_id: orderId,
          amount: payment.amount || 0,
          payment_date: payment.date || payment.payment_date,
          payment_method: payment.method || payment.payment_method || 'efectivo'
        }))

        const { data: payments, error: paymentsError } = await supabase
          .from('order_payments')
          .insert(paymentsPayload)
          .select()

        if (paymentsError) throw paymentsError
        orderPayments = payments
      }
    } else {
      // Si no se proporcionan pagos, obtener los existentes
      const { data: existingPayments } = await supabase
        .from('order_payments')
        .select('*')
        .eq('order_id', orderId)
      
      orderPayments = existingPayments || []
    }

    this.clearUserCache(userId)
    
    // Devolver orden completa con items y pagos
    return {
      ...order,
      items: orderItems,
      payments: orderPayments
    }
  },

  async deleteServiceOrder(orderId, userId) {
    // Eliminar items relacionados
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    // Eliminar pagos relacionados
    await supabase
      .from('order_payments')
      .delete()
      .eq('order_id', orderId)

    // Eliminar la orden principal
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('owner_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Passwords (with encryption)
  async getPasswords(userId) {
    const cacheKey = `passwords_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createPassword(passwordData, userId) {
    // Sanitizar datos de entrada usando los campos correctos del esquema
    const sanitizedData = {
      owner_id: userId,
      site_app: sanitizeInput(passwordData.site_app || '', 200),
      username: sanitizeInput(passwordData.username || '', 200),
      password: passwordData.password || '',
      category: passwordData.category ? sanitizeInput(passwordData.category, 100) : 'otros',
      notes: passwordData.notes ? sanitizeInput(passwordData.notes, 1000) : null
    }

    const { data, error } = await supabase
      .from('credentials')
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
    
    if (passwordData.site_app) {
      sanitizedData.site_app = sanitizeInput(passwordData.site_app, 200)
    }
    if (passwordData.username) {
      sanitizedData.username = sanitizeInput(passwordData.username, 200)
    }
    if (passwordData.password) {
      sanitizedData.password = passwordData.password
    }
    if (passwordData.category) {
      sanitizedData.category = sanitizeInput(passwordData.category, 100)
    }
    if (passwordData.notes !== undefined) {
      sanitizedData.notes = passwordData.notes ? sanitizeInput(passwordData.notes, 1000) : null
    }

    const { data, error } = await supabase
      .from('credentials')
      .update(sanitizedData)
      .eq('id', passwordId)
      .eq('owner_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data
  },

  async deletePassword(passwordId, userId) {
    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('id', passwordId)
      .eq('owner_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Verificar contraseña
  async verifyPassword(passwordId, passwordText, userId) {
    const { data: password, error: fetchError } = await supabase
      .from('credentials')
      .select('password_encrypted')
      .eq('id', passwordId)
      .eq('owner_id', userId)
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
      .from('budget_lines')
      .select(`
        *,
        budget_payments(*)
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Mapear datos para compatibilidad con el frontend
    const mapped = (data || []).map(line => ({
      ...line,
      date: line.due_day ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(line.due_day).padStart(2, '0')}` : line.date,
      payments: line.budget_payments || []
    }))
    
    cache.set(cacheKey, mapped)
    return mapped
  },

  async createBudgetExpense(expenseData, userId) {
    // Extraer día de vencimiento de la fecha
    const dueDay = expenseData.date ? new Date(expenseData.date).getDate() : expenseData.due_day
    
    const payload = {
      description: expenseData.description,
      amount: expenseData.amount,
      category: expenseData.category,
      due_day: dueDay,
      owner_id: userId
    }

    const { data, error } = await supabase
      .from('budget_lines')
      .insert(payload)
      .select(`
        *,
        budget_payments(*)
      `)
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    
    // Mapear para compatibilidad con el frontend
    return {
      ...data,
      date: data.due_day ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(data.due_day).padStart(2, '0')}` : data.date,
      payments: data.budget_payments || []
    }
  },

  async updateBudgetExpense(expenseId, expenseData, userId) {
    // Extraer día de vencimiento de la fecha
    const dueDay = expenseData.date ? new Date(expenseData.date).getDate() : expenseData.due_day
    
    const payload = {
      description: expenseData.description,
      amount: expenseData.amount,
      category: expenseData.category,
      due_day: dueDay
    }

    const { data, error } = await supabase
      .from('budget_lines')
      .update(payload)
      .eq('id', expenseId)
      .eq('owner_id', userId)
      .select(`
        *,
        budget_payments(*)
      `)
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    
    // Mapear para compatibilidad con el frontend
    return {
      ...data,
      date: data.due_day ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(data.due_day).padStart(2, '0')}` : data.date,
      payments: data.budget_payments || []
    }
  },

  async deleteBudgetExpense(expenseId, userId) {
    // Eliminar pagos asociados primero
    await supabase
      .from('budget_payments')
      .delete()
      .eq('budget_line_id', expenseId)
    
    // Eliminar la línea de presupuesto
    const { error } = await supabase
      .from('budget_lines')
      .delete()
      .eq('id', expenseId)
      .eq('owner_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Casual Expenses
  async getCasualExpenses(userId) {
    const cacheKey = `casual_expenses_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Mapear expense_date a date para compatibilidad con el frontend
    const mapped = (data || []).map(expense => ({
      ...expense,
      date: expense.expense_date || expense.date
    }))
    
    cache.set(cacheKey, mapped)
    return mapped
  },

  async createCasualExpense(expenseData, userId) {
    // Mapear date a expense_date para la base de datos
    const payload = {
      ...expenseData,
      expense_date: expenseData.date || expenseData.expense_date,
      owner_id: userId
    }
    
    // Remover el campo date si existe para evitar conflictos
    if (payload.date && payload.expense_date) {
      delete payload.date
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    
    // Mapear expense_date a date para el frontend
    return {
      ...data,
      date: data.expense_date || data.date
    }
  },

  async updateCasualExpense(expenseId, expenseData, userId) {
    // Mapear date a expense_date para la base de datos
    const payload = {
      ...expenseData,
      expense_date: expenseData.date || expenseData.expense_date
    }
    
    // Remover el campo date si existe para evitar conflictos
    if (payload.date && payload.expense_date) {
      delete payload.date
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', expenseId)
      .eq('owner_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    
    // Mapear expense_date a date para el frontend
    return {
      ...data,
      date: data.expense_date || data.date
    }
  },

  async deleteCasualExpense(expenseId, userId) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('owner_id', userId)

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
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Mapear filas a la forma usada por el frontend (camelCase)
    const mapped = (data || []).map((row) => ({
      id: row.id,
      clientName: row.client_name ?? row.clientName ?? '',
      licenseName: row.license_name ?? row.licenseName ?? '',
      serial: row.serial ?? '',
      provider: row.provider ?? row.vendor ?? '',
      installationDate: row.installation_date ?? row.installationDate ?? null,
      expirationDate: row.expiration_date ?? row.expirationDate ?? null,
      maxInstallations: row.max_installations ?? row.maxInstallations ?? null,
      currentInstallations: row.current_installations ?? row.currentInstallations ?? 0,
      salePrice: row.sale_price ?? row.salePrice ?? 0,
      costPrice: row.cost_price ?? row.costPrice ?? 0,
      profit: row.profit ?? ((row.sale_price || 0) - (row.cost_price || 0)),
      condition: row.condition ?? '',
      notes: row.notes ?? '',
      created_at: row.created_at,
      updated_at: row.updated_at
    }))

    cache.set(cacheKey, mapped)
    return mapped
  },

  async createLicense(licenseData, userId) {
    // Aceptar payload con camelCase o snake_case y convertir a columnas de BD
    const dbData = {
      owner_id: userId,
      client_name: (licenseData.clientName ?? licenseData.client_name) || null,
      license_name: (licenseData.licenseName ?? licenseData.license_name) || null,
      serial: (licenseData.serial ?? licenseData.licenseKey) || null,
      installation_date: (licenseData.installationDate ?? licenseData.installation_date ?? licenseData.purchaseDate) || null,
      expiration_date: (licenseData.expirationDate ?? licenseData.expiration_date ?? licenseData.expiryDate) || null,
      max_installations: (licenseData.maxInstallations ?? licenseData.max_installations) ?? null,
      current_installations: (licenseData.currentInstallations ?? licenseData.current_installations) ?? 0,
      sale_price: (licenseData.salePrice ?? licenseData.sale_price) ?? 0,
      cost_price: (licenseData.costPrice ?? licenseData.cost_price ?? licenseData.cost) ?? 0,
      // profit es una columna generada en BD; no se debe enviar en INSERT/UPDATE
      provider: (licenseData.provider ?? licenseData.vendor) || null,
      condition: (licenseData.condition) || null,
      notes: (licenseData.notes) || null
    }

    const { data, error } = await supabase
      .from('licenses')
      .insert(dbData)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)

    // Mapear respuesta a camelCase
    const mapped = {
      id: data.id,
      clientName: data.client_name ?? '',
      licenseName: data.license_name ?? '',
      serial: data.serial ?? '',
      provider: data.provider ?? '',
      installationDate: data.installation_date ?? null,
      expirationDate: data.expiration_date ?? null,
      maxInstallations: data.max_installations ?? null,
      currentInstallations: data.current_installations ?? 0,
      salePrice: data.sale_price ?? 0,
      costPrice: data.cost_price ?? 0,
      profit: data.profit ?? ((data.sale_price || 0) - (data.cost_price || 0)),
      condition: data.condition ?? '',
      notes: data.notes ?? '',
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return mapped
  },

  async updateLicense(licenseId, licenseData, userId) {
    // Aceptar payload con camelCase o snake_case y convertir a columnas de BD
    const dbData = {
      client_name: (licenseData.clientName ?? licenseData.client_name) || null,
      license_name: (licenseData.licenseName ?? licenseData.license_name) || null,
      serial: (licenseData.serial ?? licenseData.licenseKey) || null,
      installation_date: (licenseData.installationDate ?? licenseData.installation_date ?? licenseData.purchaseDate) || null,
      expiration_date: (licenseData.expirationDate ?? licenseData.expiration_date ?? licenseData.expiryDate) || null,
      max_installations: (licenseData.maxInstallations ?? licenseData.max_installations) ?? null,
      current_installations: (licenseData.currentInstallations ?? licenseData.current_installations) ?? 0,
      sale_price: (licenseData.salePrice ?? licenseData.sale_price) ?? 0,
      cost_price: (licenseData.costPrice ?? licenseData.cost_price ?? licenseData.cost) ?? 0,
      // profit es una columna generada en BD; no se debe enviar en INSERT/UPDATE
      provider: (licenseData.provider ?? licenseData.vendor) || null,
      condition: (licenseData.condition) || null,
      notes: (licenseData.notes) || null
    }

    const { data, error } = await supabase
      .from('licenses')
      .update(dbData)
      .eq('id', licenseId)
      .eq('owner_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)

    // Mapear respuesta a camelCase
    const mapped = {
      id: data.id,
      clientName: data.client_name ?? '',
      licenseName: data.license_name ?? '',
      serial: data.serial ?? '',
      provider: data.provider ?? '',
      installationDate: data.installation_date ?? null,
      expirationDate: data.expiration_date ?? null,
      maxInstallations: data.max_installations ?? null,
      currentInstallations: data.current_installations ?? 0,
      salePrice: data.sale_price ?? 0,
      costPrice: data.cost_price ?? 0,
      profit: data.profit ?? ((data.sale_price || 0) - (data.cost_price || 0)),
      condition: data.condition ?? '',
      notes: data.notes ?? '',
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return mapped
  },

  async deleteLicense(licenseId, userId) {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId)
      .eq('owner_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Server Credentials (with encryption)
  async getServerCredentials(userId) {
    const cacheKey = `server_credentials_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data: servers, error } = await supabase
      .from('servers')
      .select(`
        *,
        server_users(*)
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Mapear a la forma usada por el frontend
    const mapped = (servers || []).map((server) => ({
      ...server,
      client: server.company_name || '',
      vpnIp: server.vpn_ip || '',
      localName: server.local_name || '',
      password: server.vpn_password || '',
      users: server.server_users || [],
    }))

    cache.set(cacheKey, mapped)
    return mapped
  },

  async createServerCredential(credentialData, userId) {
    // Sanitizar datos de entrada usando los campos correctos del esquema
    const serverData = {
      owner_id: userId,
      company_name: sanitizeInput(credentialData.client || credentialData.company_name, 200),
      server_name: sanitizeInput(credentialData.server_name, 200),
      // Aceptar múltiples alias y priorizar el nombre de campo del formulario (vpn_password)
      vpn_password: credentialData.vpn_password || credentialData.vpnPassword || credentialData.password || credentialData.passVpn || '',
      vpn_ip: sanitizeInput(credentialData.vpnIp || credentialData.vpn_ip, 100),
      local_name: credentialData.localName ? sanitizeInput(credentialData.localName, 200) : (credentialData.local_name ? sanitizeInput(credentialData.local_name, 200) : null),
    }

    // Crear el servidor primero
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .insert(serverData)
      .select()
      .single()

    if (serverError) throw serverError

    // Crear los usuarios del servidor si existen
    let serverUsers = []
    if (Array.isArray(credentialData.users) && credentialData.users.length > 0) {
      const usersData = credentialData.users.map(u => ({
        server_id: server.id,
        username: sanitizeInput(u.username || '', 200),
        password: u.password || '',
        notes: u.notes ? sanitizeInput(u.notes, 1000) : null,
      }))

      const { data: users, error: usersError } = await supabase
        .from('server_users')
        .insert(usersData)
        .select()

      if (usersError) throw usersError
      serverUsers = users
    }

    this.clearUserCache(userId)

    // Devolver en formato frontend
    return {
      ...server,
      client: server.company_name || '',
      vpnIp: server.vpn_ip || '',
      localName: server.local_name || '',
      password: server.vpn_password || '',
      users: serverUsers || [],
    }
  },

  async updateServerCredential(credentialId, credentialData, userId) {
    // Sanitizar datos de entrada usando los campos correctos del esquema
    const serverData = {}
    
    if (credentialData.client || credentialData.company_name) {
      serverData.company_name = sanitizeInput(credentialData.client || credentialData.company_name, 200)
    }
    if (credentialData.server_name) {
      serverData.server_name = sanitizeInput(credentialData.server_name, 200)
    }
    if (credentialData.vpnIp || credentialData.vpn_ip) {
      serverData.vpn_ip = sanitizeInput(credentialData.vpnIp || credentialData.vpn_ip, 100)
    }
    if (credentialData.localName || credentialData.local_name) {
      serverData.local_name = credentialData.localName ? sanitizeInput(credentialData.localName, 200) : (credentialData.local_name ? sanitizeInput(credentialData.local_name, 200) : null)
    }
    // Aceptar múltiples alias para el pass VPN (incluye vpn_password del formulario)
    if (credentialData.vpn_password || credentialData.vpnPassword || credentialData.password || credentialData.passVpn) {
      serverData.vpn_password = credentialData.vpn_password || credentialData.vpnPassword || credentialData.password || credentialData.passVpn
    }

    // Actualizar el servidor
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .update(serverData)
      .eq('id', credentialId)
      .eq('owner_id', userId)
      .select()
      .single()

    if (serverError) throw serverError

    // Actualizar usuarios del servidor si se proporcionan
    let serverUsers = []
    if (Array.isArray(credentialData.users)) {
      // Eliminar usuarios existentes
      await supabase
        .from('server_users')
        .delete()
        .eq('server_id', credentialId)

      // Crear nuevos usuarios si existen
      if (credentialData.users.length > 0) {
        const usersData = credentialData.users.map(u => ({
          server_id: credentialId,
          username: sanitizeInput(u.username || '', 200),
          password: u.password || '',
          notes: u.notes ? sanitizeInput(u.notes, 1000) : null,
        }))

        const { data: users, error: usersError } = await supabase
          .from('server_users')
          .insert(usersData)
          .select()

        if (usersError) throw usersError
        serverUsers = users
      }
    } else {
      // Si no se proporcionan usuarios, obtener los existentes
      const { data: existingUsers } = await supabase
        .from('server_users')
        .select('*')
        .eq('server_id', credentialId)
      
      serverUsers = existingUsers || []
    }

    this.clearUserCache(userId)

    // Devolver en formato frontend
    return {
      ...server,
      client: server.company_name || '',
      vpnIp: server.vpn_ip || '',
      localName: server.local_name || '',
      password: server.vpn_password || '',
      users: serverUsers || [],
    }
  },

  async deleteServerCredential(credentialId, userId) {
    const { error } = await supabase
      .from('servers')
      .delete()
      .eq('id', credentialId)
      .eq('owner_id', userId)

    if (error) throw error
    this.clearUserCache(userId)
  },

  // Verificar contraseña de servidor
  async verifyServerPassword(credentialId, passwordText, userId) {
    const { data: server, error: fetchError } = await supabase
      .from('servers')
      .select('vpn_password')
      .eq('id', credentialId)
      .eq('owner_id', userId)
      .single()

    if (fetchError) throw fetchError

    if (!server.vpn_password) {
      return false // No hay contraseña configurada
    }

    // Comparación directa ya que las contraseñas no están encriptadas en el esquema actual
    return server.vpn_password === passwordText
  }
}
// Remove top-level await console log which caused runtime/ESLint error
// console.log(await supabase.auth.getSession());
