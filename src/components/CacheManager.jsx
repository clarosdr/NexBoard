import React from 'react';
import { supabaseService, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const CacheManager = ({ className = '' }) => {
  const { user } = useAuth();

  const clearAllCache = () => {
    if (isSupabaseConfigured()) {
      supabaseService.clearCache();
    }
    
    // Limpiar localStorage de datos temporales problemáticos
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

  const clearLocalData = () => {
    if (user && !isSupabaseConfigured()) {
      const confirmDelete = window.confirm(
        '¿Estás seguro de que deseas eliminar todos los datos locales? Esta acción no se puede deshacer.'
      );
      
      if (confirmDelete) {
        supabaseService.clearUserCache(user.id);
        alert('Todos los datos locales han sido eliminados.');
        window.location.reload();
      }
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={clearUserCache}
        className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-200"
        title="Limpiar cache del usuario actual"
      >
        🔄 Cache
      </button>
      
      {!isSupabaseConfigured() && (
        <button
          onClick={clearLocalData}
          className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200"
          title="Eliminar todos los datos locales"
        >
          🗑️ Datos
        </button>
      )}
      
      <button
        onClick={clearAllCache}
        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
        title="Limpiar todo el cache y recargar"
      >
        🔄 Todo
      </button>
    </div>
  );
};

export default CacheManager;