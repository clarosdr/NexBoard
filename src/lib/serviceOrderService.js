import { supabase } from './supabaseClient';

/**
 * Creates or updates a service order.
 * If orderData includes an ID, it updates; otherwise, it creates.
 * @param {object} orderData - The service order data.
 * @param {string} userId - The ID of the owner user.
 * @returns {Promise<object>} The created or updated order.
 */
export async function upsertServiceOrder(orderData, userId) {
  // This function is a placeholder. The main logic is in supabase.js supabaseService.
  // For consistency, you should call the methods from there.
  // This is left here to avoid breaking imports but should be refactored.
  if (orderData.id) {
    return supabaseService.updateServiceOrder(orderData.id, orderData, userId);
  } else {
    return supabaseService.createServiceOrder(orderData, userId);
  }
}


export async function fetchServiceOrders() {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*');
  if (error) throw error;
  return data;
}
