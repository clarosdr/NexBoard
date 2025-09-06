import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .order('mes', { ascending: true });

    if (error) {
      console.error('❌ Error al cargar reportes:', error.message);
      setReports([]);
    } else {
      setReports(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return { reports, loading, fetchReports };
};
