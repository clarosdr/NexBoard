import { createClient } from '@supabase/supabase-js'

// Estas variables se configurarán más adelante con las credenciales reales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funciones helper para manejo de datos
export const supabaseHelpers = {
  // Órdenes de servicio
  async getServiceOrders(userId) {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Mapear los datos de la base de datos al formato esperado por la aplicación
    const mappedData = (data || []).map(order => ({
      id: order.id,
      customerName: order.client_name,
      description: order.problem_description,
      date: order.estimated_delivery,
      status: order.status,
      items: order.items || [],
      payments: order.payments || [],
      total: order.total_cost,
      totalPaid: order.total_paid,
      pendingBalance: order.pending_balance,
      profit: order.profit,
      createdAt: order.created_at,
      totalPartCost: order.total_cost - order.profit // Calcular costo de partes
    }))
    
    return mappedData
  },

  async createServiceOrder(order, userId) {
    // Mapear los campos del formulario a los campos de la base de datos
    const mappedOrder = {
      user_id: userId,
      order_number: `ORD-${Date.now()}`,
      client_name: order.customerName || '',
      problem_description: order.description || '',
      device_type: 'General', // Valor por defecto
      items: order.items || [],
      payments: order.payments || [],
      total_cost: order.total || 0,
      total_paid: order.totalPaid || 0,
      pending_balance: order.pendingBalance || 0,
      profit: order.profit || 0,
      status: order.status || 'pendiente',
      estimated_delivery: order.date ? new Date(order.date).toISOString().split('T')[0] : null,
      notes: order.notes || ''
    }
    
    const { data, error } = await supabase
      .from('service_orders')
      .insert([mappedOrder])
      .select()
    
    if (error) throw error
    
    // Mapear la respuesta de vuelta al formato esperado por la aplicación
    const mappedResponse = {
      id: data[0].id,
      customerName: data[0].client_name,
      description: data[0].problem_description,
      date: data[0].estimated_delivery,
      status: data[0].status,
      items: data[0].items,
      payments: data[0].payments,
      total: data[0].total_cost,
      totalPaid: data[0].total_paid,
      pendingBalance: data[0].pending_balance,
      profit: data[0].profit,
      createdAt: data[0].created_at
    }
    
    return mappedResponse
  },

  async updateServiceOrder(id, order, userId) {
    // Mapear los campos del formulario a los campos de la base de datos
    const mappedOrder = {
      client_name: order.customerName || '',
      problem_description: order.description || '',
      items: order.items || [],
      payments: order.payments || [],
      total_cost: order.total || 0,
      total_paid: order.totalPaid || 0,
      pending_balance: order.pendingBalance || 0,
      profit: order.profit || 0,
      status: order.status || 'pendiente',
      estimated_delivery: order.date ? new Date(order.date).toISOString().split('T')[0] : null,
      notes: order.notes || '',
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('service_orders')
      .update(mappedOrder)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    
    // Mapear la respuesta de vuelta al formato esperado por la aplicación
    const mappedResponse = {
      id: data[0].id,
      customerName: data[0].client_name,
      description: data[0].problem_description,
      date: data[0].estimated_delivery,
      status: data[0].status,
      items: data[0].items,
      payments: data[0].payments,
      total: data[0].total_cost,
      totalPaid: data[0].total_paid,
      pendingBalance: data[0].pending_balance,
      profit: data[0].profit,
      createdAt: data[0].created_at,
      totalPartCost: data[0].total_cost - data[0].profit
    }
    
    return mappedResponse
  },

  async deleteServiceOrder(id, userId) {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Gastos casuales
  async getCasualExpenses(userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createCasualExpense(expense, userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .insert([{ ...expense, user_id: userId }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateCasualExpense(id, expense, userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .update(expense)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteCasualExpense(id, userId) {
    const { error } = await supabase
      .from('casual_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Gastos presupuestarios
  async getBudgetExpenses(userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createBudgetExpense(expense, userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .insert([{ ...expense, user_id: userId }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateBudgetExpense(id, expense, userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .update(expense)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteBudgetExpense(id, userId) {
    const { error } = await supabase
      .from('budget_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Licencias
  async getLicenses(userId) {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createLicense(license, userId) {
    const { data, error } = await supabase
      .from('licenses')
      .insert([{ ...license, user_id: userId }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateLicense(id, license, userId) {
    const { data, error } = await supabase
      .from('licenses')
      .update(license)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteLicense(id, userId) {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Contraseñas
  async getPasswords(userId) {
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createPassword(password, userId) {
    const { data, error } = await supabase
      .from('passwords')
      .insert([{ ...password, user_id: userId }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updatePassword(id, password, userId) {
    const { data, error } = await supabase
      .from('passwords')
      .update(password)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deletePassword(id, userId) {
    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Credenciales de servidor
  async getServerCredentials(userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createServerCredential(credential, userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .insert([{ ...credential, user_id: userId }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateServerCredential(id, credential, userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .update(credential)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteServerCredential(id, userId) {
    const { error } = await supabase
      .from('server_credentials')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Exportar también como supabaseService para compatibilidad
export const supabaseService = supabaseHelpers