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
    
    // Map database fields back to application fields
    return (data || []).map(order => ({
      id: order.id,
      customerName: order.customer_name,
      description: order.description,
      date: order.date,
      status: order.status,
      items: order.items,
      payments: order.payments,
      totalPaid: order.total_paid,
      total: order.total,
      totalPartCost: order.total_part_cost,
      profit: order.profit,
      pendingBalance: order.pending_balance,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }))
  },

  async createServiceOrder(order, userId) {
    // Map form fields to database fields
    const dbOrder = {
      id: order.id,
      user_id: userId,
      customer_name: order.customerName,
      description: order.description,
      date: order.date,
      status: order.status,
      items: order.items,
      payments: order.payments,
      total_paid: order.totalPaid,
      total: order.total,
      total_part_cost: order.totalPartCost,
      profit: order.profit,
      pending_balance: order.pendingBalance,
      created_at: order.createdAt
    };
    
    const { data, error } = await supabase
      .from('service_orders')
      .insert([dbOrder])
      .select()
    
    if (error) throw error
    
    // Map database fields back to application fields
    const createdOrder = data[0]
    return {
      id: createdOrder.id,
      customerName: createdOrder.customer_name,
      description: createdOrder.description,
      date: createdOrder.date,
      status: createdOrder.status,
      items: createdOrder.items,
      payments: createdOrder.payments,
      totalPaid: createdOrder.total_paid,
      total: createdOrder.total,
      totalPartCost: createdOrder.total_part_cost,
      profit: createdOrder.profit,
      pendingBalance: createdOrder.pending_balance,
      createdAt: createdOrder.created_at,
      updatedAt: createdOrder.updated_at
    }
  },

  async updateServiceOrder(id, order, userId) {
    // Map form fields to database fields
    const dbOrder = {
      customer_name: order.customerName,
      description: order.description,
      date: order.date,
      status: order.status,
      items: order.items,
      payments: order.payments,
      total_paid: order.totalPaid,
      total: order.total,
      total_part_cost: order.totalPartCost,
      profit: order.profit,
      pending_balance: order.pendingBalance
    };
    
    const { data, error } = await supabase
      .from('service_orders')
      .update(dbOrder)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    
    // Map database fields back to application fields
    const updatedOrder = data[0]
    return {
      id: updatedOrder.id,
      customerName: updatedOrder.customer_name,
      description: updatedOrder.description,
      date: updatedOrder.date,
      status: updatedOrder.status,
      items: updatedOrder.items,
      payments: updatedOrder.payments,
      totalPaid: updatedOrder.total_paid,
      total: updatedOrder.total,
      totalPartCost: updatedOrder.total_part_cost,
      profit: updatedOrder.profit,
      pendingBalance: updatedOrder.pending_balance,
      createdAt: updatedOrder.created_at,
      updatedAt: updatedOrder.updated_at
    }
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
    
    // Mapear campos de DB a aplicación
    return (data || []).map(license => ({
      ...license,
      client: license.software_name,
      licenseName: license.software_name,
      code: license.license_key,
      installationDate: license.purchase_date,
      expirationDate: license.expiry_date,
      numberOfInstallations: license.max_installations,
      saleValue: license.cost,
      costValue: 0, // No existe en DB
      profit: license.cost || 0,
      provider: license.vendor
    }))
  },

  async createLicense(license, userId) {
    // Mapear campos de aplicación a DB
    const dbLicense = {
      software_name: license.licenseName || license.client,
      license_key: license.code,
      purchase_date: license.installationDate,
      expiry_date: license.expirationDate,
      vendor: license.provider,
      cost: license.saleValue,
      max_installations: license.numberOfInstallations,
      current_installations: 0,
      notes: license.notes || '',
      user_id: userId
    }
    
    const { data, error } = await supabase
      .from('licenses')
      .insert([dbLicense])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateLicense(id, license, userId) {
    // Mapear campos de aplicación a DB
    const dbLicense = {
      software_name: license.licenseName || license.client,
      license_key: license.code,
      purchase_date: license.installationDate,
      expiry_date: license.expirationDate,
      vendor: license.provider,
      cost: license.saleValue,
      max_installations: license.numberOfInstallations,
      notes: license.notes || ''
    }
    
    const { data, error } = await supabase
      .from('licenses')
      .update(dbLicense)
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
    
    // Mapear campos de DB a aplicación
    return (data || []).map(password => ({
      ...password,
      website: password.service_name,
      // username ya coincide
      // password se mapea a password_encrypted pero lo mantenemos como password para el frontend
      password: password.password_encrypted
    }))
  },

  async createPassword(password, userId) {
    // Mapear campos de aplicación a DB
    const dbPassword = {
      service_name: password.website,
      username: password.username,
      email: password.email || '',
      password_encrypted: password.password,
      url: password.website,
      notes: password.notes || '',
      category: password.category || 'general',
      user_id: userId
    }
    
    const { data, error } = await supabase
      .from('passwords')
      .insert([dbPassword])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updatePassword(id, password, userId) {
    // Mapear campos de aplicación a DB
    const dbPassword = {
      service_name: password.website,
      username: password.username,
      email: password.email || '',
      password_encrypted: password.password,
      url: password.website,
      notes: password.notes || '',
      category: password.category || 'general'
    }
    
    const { data, error } = await supabase
      .from('passwords')
      .update(dbPassword)
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
    
    // Mapear campos de DB a aplicación
    return (data || []).map(credential => ({
      ...credential,
      client: credential.description || credential.server_name,
      vpnName: credential.server_name,
      vpnPassword: credential.password_encrypted,
      vpnIp: credential.ip_address,
      localServerName: credential.hostname,
      users: [{ username: credential.username, password: credential.password_encrypted }]
    }))
  },

  async createServerCredential(credential, userId) {
    // Mapear campos de aplicación a DB
    const dbCredential = {
      server_name: credential.vpnName,
      ip_address: credential.vpnIp,
      hostname: credential.localServerName,
      username: credential.users?.[0]?.username || credential.vpnName,
      password_encrypted: credential.vpnPassword,
      ssh_key: '',
      port: 22,
      protocol: 'SSH',
      description: credential.client,
      notes: JSON.stringify(credential.users || []),
      user_id: userId
    }
    
    const { data, error } = await supabase
      .from('server_credentials')
      .insert([dbCredential])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateServerCredential(id, credential, userId) {
    // Mapear campos de aplicación a DB
    const dbCredential = {
      server_name: credential.vpnName,
      ip_address: credential.vpnIp,
      hostname: credential.localServerName,
      username: credential.users?.[0]?.username || credential.vpnName,
      password_encrypted: credential.vpnPassword,
      description: credential.client,
      notes: JSON.stringify(credential.users || [])
    }
    
    const { data, error } = await supabase
      .from('server_credentials')
      .update(dbCredential)
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