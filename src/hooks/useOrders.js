import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        cliente,
        estado,
        fecha,
        ventas,
        costos,
        ganancia,
        pagado,
        pendiente
      `)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('❌ Error al cargar órdenes:', error);
      setError(error);
      setOrders([]);
    } else {
      setOrders(data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, error, refetch: fetchOrders };
};
