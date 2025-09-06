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
      items: (row.order_items || []).map(item => ({
        id: item.id,
        description: item.item_desc,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        partCost: item.part_cost
      })),
      payments: (row.order_payments || []).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        date: payment.pay_date,
        method: payment.method,
        notes: payment.notes
      }))
    }))
    
    cache.set(cacheKey, mapped)
    return mapped
  },

  async createServiceOrder(orderData, userId) {
    console.log('🗄️ Supabase - createServiceOrder iniciado');
    console.log('📋 Datos recibidos:', orderData);
    console.log('👤 Usuario ID:', userId);
    
    // Preparar datos de la orden principal
    const orderPayload = {
      customer_name: orderData.customer_name,
      service_date: orderData.service_date,
      description: orderData.description,
      status: orderData.status || 'PENDIENTE',
      owner_id: userId
    }
    
    console.log('📤 Payload de orden principal:', orderPayload);

    // Crear la orden principal
    console.log('📞 Insertando orden principal en Supabase...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single()

    if (orderError) {
      console.error('❌ Error al insertar orden principal:', orderError);
      throw orderError;
    }
    
    console.log('✅ Orden principal creada:', order);

    // Crear items si existen
    let orderItems = []
    if (orderData.items && orderData.items.length > 0) {
      console.log('🔧 Procesando items de la orden...');
      const itemsPayload = orderData.items.map(item => ({
        order_id: order.id,
        quantity: item.quantity || 1,
        item_desc: item.description,
        unit_price: item.unitPrice || 0,
        part_cost: item.partCost || 0
      }))
      
      console.log('📤 Payload de items:', itemsPayload);
      console.log('📞 Insertando items en Supabase...');

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsPayload)
        .select()

      if (itemsError) {
        console.error('❌ Error al insertar items:', itemsError);
        throw itemsError;
      }
      
      console.log('✅ Items creados:', items);
      orderItems = items
    } else {
      console.log('ℹ️ No hay items para procesar');
    }

    // Crear pagos si existen
    let orderPayments = []
    if (orderData.payments && orderData.payments.length > 0) {
      console.log('💰 Procesando pagos de la orden...');
      const validPayments = orderData.payments.filter(p => Number(p.amount) > 0)
      console.log('💰 Pagos válidos encontrados:', validPayments.length);
      
      if (validPayments.length > 0) {
        const paymentsPayload = validPayments.map(payment => ({
          order_id: order.id,
          amount: payment.amount,
          pay_date: payment.date || new Date().toISOString(),
          method: payment.method || 'efectivo',
          notes: payment.notes ?? null
        }))
        
        console.log('📤 Payload de pagos:', paymentsPayload);
        console.log('📞 Insertando pagos en Supabase...');

        const { data: payments, error: paymentsError } = await supabase
          .from('order_payments')
          .insert(paymentsPayload)
          .select()

        if (paymentsError) {
          console.error('❌ Error al insertar pagos:', paymentsError);
          throw paymentsError;
        }
        
        console.log('✅ Pagos creados:', payments);
        orderPayments = payments
      } else {
        console.log('ℹ️ No hay pagos válidos para procesar');
      }
    } else {
      console.log('ℹ️ No hay pagos para procesar');
    }

    console.log('🧹 Limpiando caché de usuario...');
    this.clearUserCache(userId)
    
    // Devolver orden completa con items y pagos mapeados al frontend
    const finalOrder = {
      ...order,
      items: orderItems.map(item => ({
        id: item.id,
        description: item.item_desc,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        partCost: item.part_cost
      })),
      payments: orderPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        date: payment.pay_date,
        method: payment.method,
        notes: payment.notes
      }))
    }
    
    console.log('🎉 Orden completa creada exitosamente:', finalOrder);
    return finalOrder;
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
          item_desc: item.description,
          unit_price: item.unitPrice || 0,
          part_cost: item.partCost || 0
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
      const validPayments = orderData.payments.filter(p => Number(p.amount) > 0)
      if (validPayments.length > 0) {
        const paymentsPayload = validPayments.map(payment => ({
          order_id: orderId,
          amount: payment.amount,
          pay_date: payment.date || new Date().toISOString(),
          method: payment.method || 'efectivo',
          notes: payment.notes ?? null
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
    
    // Devolver orden completa con items y pagos mapeados al frontend
    return {
      ...order,
      items: orderItems.map(item => ({
        id: item.id,
        description: item.item_desc,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        partCost: item.part_cost
      })),
      payments: orderPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        date: payment.pay_date,
        method: payment.method,
        notes: payment.notes
      }))
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

  // Passwords
  async getPasswords(userId) {
    const cacheKey = `passwords_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createPassword(passwordData, userId) {
    const sanitizedData = {
      owner_id: userId,
      servicio: sanitizeInput(passwordData.servicio, 200),
      usuario: sanitizeInput(passwordData.usuario, 200),
      clave: passwordData.clave,
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
    const sanitizedData = {}
    if(passwordData.servicio) sanitizedData.servicio = sanitizeInput(passwordData.servicio, 200);
    if(passwordData.usuario) sanitizedData.usuario = sanitizeInput(passwordData.usuario, 200);
    if(passwordData.clave) sanitizedData.clave = passwordData.clave;
    
    const { data, error } = await supabase
      .from('passwords')
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
      .from('passwords')
      .delete()
      .eq('id', passwordId)
      .eq('owner_id', userId)

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
      .select(`*`)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createBudgetExpense(expenseData, userId) {
    const payload = { ...expenseData, owner_id: userId };
    const { data, error } = await supabase
      .from('budget_expenses')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data;
  },

  async updateBudgetExpense(expenseId, expenseData, userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .eq('owner_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data;
  },

  async deleteBudgetExpense(expenseId, userId) {
    const { error } = await supabase
      .from('budget_expenses')
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
      .from('casual_expenses')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createCasualExpense(expenseData, userId) {
    const payload = { ...expenseData, owner_id: userId };
    const { data, error } = await supabase
      .from('casual_expenses')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data;
  },

  async updateCasualExpense(expenseId, expenseData, userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .eq('owner_id', userId)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data;
  },

  async deleteCasualExpense(expenseId, userId) {
    const { error } = await supabase
      .from('casual_expenses')
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
    cache.set(cacheKey, data)
    return data
  },

  async createLicense(licenseData, userId) {
    const payload = {
      owner_id: userId,
      nombre: licenseData.nombre,
      clave: licenseData.clave,
    };
    const { data, error } = await supabase
      .from('licenses')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data;
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

  // Server Credentials
  async getServerCredentials(userId) {
    const cacheKey = `server_credentials_${userId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('servers')
      .select(`*`)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cache.set(cacheKey, data)
    return data
  },

  async createServerCredential(credentialData, userId) {
    const payload = {
      owner_id: userId,
      nombre: credentialData.nombre,
      ip: credentialData.ip,
      usuario: credentialData.usuario,
      clave: credentialData.clave,
    };
    const { data, error } = await supabase
      .from('servers')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    this.clearUserCache(userId)
    return data;
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
}