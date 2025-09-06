import { supabase } from './supabaseClient';

export async function upsertServiceOrder(order) {
  const { data, error } = await supabase
    .from('service_orders')
    .upsert(order, { onConflict: 'id', returning: 'representation' });
  if (error) throw error;
  return data[0];
}

export async function fetchServiceOrders() {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*');
  if (error) throw error;
  return data;
}