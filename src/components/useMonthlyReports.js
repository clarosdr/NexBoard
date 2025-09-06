import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useMonthlyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .order('mes', { ascending: false });

    if (error) {
      console.error('❌ Error al cargar reportes mensuales:', error);
      setReports([]);
      setError(error);
    } else {
      setReports(data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports
  };
};
