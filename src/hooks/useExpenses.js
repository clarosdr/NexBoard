import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useExpenses = () => {
  const [casualExpenses, setCasualExpenses] = useState([]);
  const [budgetExpenses, setBudgetExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);

    const [casualRes, budgetRes] = await Promise.all([
      supabase.from('casual_expenses').select('*').order('fecha', { ascending: false }),
      supabase.from('budget_expenses').select('*').order('fecha', { ascending: false })
    ]);

    if (casualRes.error || budgetRes.error) {
      console.error('❌ Error al cargar gastos:', casualRes.error || budgetRes.error);
      setError(casualRes.error || budgetRes.error);
      setCasualExpenses([]);
      setBudgetExpenses([]);
    } else {
      setCasualExpenses(casualRes.data || []);
      setBudgetExpenses(budgetRes.data || []);
      setError(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return {
    casualExpenses,
    budgetExpenses,
    loading,
    error,
    refetch: fetchExpenses
  };
};
