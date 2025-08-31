import React from 'react';
import { supabaseService } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CacheManager = ({ className = '' }) => {
  const { user } = useAuth();

  const clearAllCache = () => {
    supabaseService.clearCache();
    // También limpiar localStorage de datos temporales problemáticos
    const keysToRemove = [
      'nexboard-expenses',
      'orders',
      'casualExpenses',
      'budgetExpenses',
      'licenses',
      'passwords',
      'serverCredentials',
      'archivedOrders'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    alert('Cache limpiado exitosamente. La página se recargará para aplicar los cambios.');
    window.location.reload();
  };

  const clearUserCache = () => {
    if (user) {
      supabaseService.clearUserCache(user.id);
      alert('Cache del usuario limpiado exitosamente.');
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={clearUserCache}
        className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-200"
        title="Limpiar cache del usuario actual"
      >
        🔄 Cache Usuario
      </button>
      <button
        onClick={clearAllCache}
        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
        title="Limpiar todo el cache y recargar"
      >
        🗑️ Limpiar Todo
      </button>
    </div>
  );
};

export default CacheManager;