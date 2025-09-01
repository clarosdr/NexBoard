import React, { useState } from 'react';
import OrderDetailsModal from './OrderDetailsModal';
import PrintReceipt from './PrintReceipt';
import PullToRefresh from './PullToRefresh';
import { useSwipeCard } from '../hooks/useTouchGestures';
import Button from './ui/Button';

// Función para formatear valores en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const ServiceOrdersTable = ({ orders, onEdit, onDelete, onViewDetails }) => {
  const [filterStatus, setFilterStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showArchived, setShowArchived] = useState(false);

  const statusOptions = [
    { value: 'todos', label: 'Todos', color: 'gray' },
    { value: 'pendiente', label: 'Pendiente', color: 'yellow' },
    { value: 'en_proceso', label: 'En Proceso', color: 'blue' },
    { value: 'finalizado', label: 'Finalizado', color: 'green' },
    { value: 'entregado', label: 'Entregado', color: 'gray' }
  ];

  // Función para contar órdenes por estado
  const getOrderCountByStatus = (status) => {
    if (status === 'todos') {
      return orders.length;
    }
    return orders.filter(order => order.status === status).length;
  };

  // Función para manejar la impresión
  const handlePrint = (order) => {
    setSelectedOrderForPrint(order);
    setShowPrintReceipt(true);
  };

  const closePrintReceipt = () => {
    setShowPrintReceipt(false);
    setSelectedOrderForPrint(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendiente: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Pendiente' },
      en_proceso: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'En Proceso' },
      finalizado: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Finalizado' },
      entregado: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Entregado' }
    };
    
    const config = statusConfig[status] || statusConfig.pendiente;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} transition-colors duration-200`}>
        {config.label}
      </span>
    );
  };

  // Obtener órdenes archivadas si es necesario
  const archivedOrders = showArchived ? JSON.parse(localStorage.getItem('archivedOrders') || '[]') : [];
  const allOrders = showArchived ? archivedOrders : orders;

  const filteredOrders = allOrders
    .filter(order => {
      const matchesStatus = filterStatus === 'todos' || order.status === filterStatus;
      const matchesSearch = order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.id.toString().includes(searchTerm) ||
                          (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'profit':
          aValue = a.profit;
          bValue = b.profit;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const calculateTotals = () => {
    return filteredOrders.reduce((acc, order) => {
      acc.totalSales += order.total;
      acc.totalCosts += order.total_part_cost || order.totalPartCost || 0;
      acc.totalProfit += order.profit;
      
      // Calcular totales de pagos y saldos pendientes
      if (order.status === 'finalizado' || order.status === 'entregado') {
        const totalPaid = order.total_paid || order.totalPaid || 0;
        const pendingBalance = order.total - totalPaid;
        
        acc.totalPaid += totalPaid;
        acc.totalPending += pendingBalance > 0 ? pendingBalance : 0;
      }
      
      return acc;
    }, { 
      totalSales: 0, 
      totalCosts: 0, 
      totalProfit: 0, 
      totalPaid: 0, 
      totalPending: 0 
    });
  };
  
  // Función para calcular el saldo pendiente de una orden
  const calculatePendingBalance = (order) => {
    if (order.status !== 'finalizado' && order.status !== 'entregado') {
      return 0;
    }
    const totalPaid = order.total_paid || order.totalPaid || 0;
    return Math.max(0, order.total - totalPaid);
  };

  const totals = calculateTotals();

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    // Simular actualización de datos
    setCurrentPage(1);
    setSearchTerm('');
    setFilterStatus('todos');
    
    // Mostrar feedback visual
    const originalTitle = document.title;
    document.title = '🔄 Actualizando...';
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (orders.length === 0) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center transition-colors duration-200">
          <div className="text-gray-600 dark:text-gray-300 text-lg mb-4 transition-colors duration-200">📋</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">No hay órdenes de servicio</h3>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">Crea tu primera orden de servicio para comenzar.</p>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">Órdenes de Servicio</h2>
            <Button
              onClick={() => setShowArchived(!showArchived)}
              variant={showArchived ? 'secondary' : 'primary'}
              size="sm"
            >
              {showArchived ? 'Ver Activas' : 'Ver Archivadas'}
            </Button>
            {showArchived && (
              <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded transition-colors duration-200">
                Datos Archivados
              </span>
            )}
          </div>
          
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar por descripción, cliente o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
          />
        </div>
        
        {/* Pestañas de estado */}
        <div className="mt-6">
          <div className="border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <nav className="-mb-px flex space-x-8">
              {statusOptions.map(option => {
                const count = getOrderCountByStatus(option.value);
                const isActive = filterStatus === option.value;
                const colorClasses = {
                  yellow: isActive ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-300',
                  blue: isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300',
                  green: isActive ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300',
                  gray: isActive ? 'border-gray-500 text-gray-600 dark:text-gray-400' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300'
                };
                
                return (
                  <Button
                    key={option.value}
                    onClick={() => setFilterStatus(option.value)}
                    variant="ghost"
                    size="sm"
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${colorClasses[option.color]}`}
                  >
                    {option.label}
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs transition-colors duration-200 ${
                      isActive 
                        ? `bg-${option.color}-100 dark:bg-${option.color}-900/30 text-${option.color}-800 dark:text-${option.color}-300` 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </span>
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Resumen de totales */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md transition-colors duration-200">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Órdenes</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{filteredOrders.length}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md transition-colors duration-200">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Ventas</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-300">{formatCurrency(totals.totalSales)}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md transition-colors duration-200">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">Total Costos</div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-300">{formatCurrency(totals.totalCosts)}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md transition-colors duration-200">
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Ganancia Total</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">{formatCurrency(totals.totalProfit)}</div>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-md transition-colors duration-200">
            <div className="text-sm font-medium text-teal-600 dark:text-teal-400">Total Cobrado</div>
            <div className="text-2xl font-bold text-teal-900 dark:text-teal-300">{formatCurrency(totals.totalPaid)}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md transition-colors duration-200">
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Por Cobrar</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">{formatCurrency(totals.totalPending)}</div>
          </div>
        </div>
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                ID
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                onClick={() => handleSort('date')}
              >
                Fecha {getSortIcon('date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                Descripción
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                onClick={() => handleSort('status')}
              >
                Estado {getSortIcon('status')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                onClick={() => handleSort('total')}
              >
                Total {getSortIcon('total')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                onClick={() => handleSort('profit')}
              >
                Ganancia {getSortIcon('profit')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                Pagado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                Saldo Pendiente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
            {paginatedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                  #{order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
                  {formatDate(order.date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white transition-colors duration-200">
                  <div className="max-w-xs truncate" title={order.customer_name}>
                    {order.customer_name || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white transition-colors duration-200">
                  <div className="max-w-xs truncate" title={order.description}>
                    {order.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400 transition-colors duration-200">
                  {formatCurrency(order.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors duration-200">
                  {formatCurrency(order.profit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {(order.status === 'finalizado' || order.status === 'entregado') ? (
                    <span className="text-teal-600 dark:text-teal-400 transition-colors duration-200">
                      {formatCurrency(order.total_paid || order.totalPaid || 0)}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 transition-colors duration-200">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {(order.status === 'finalizado' || order.status === 'entregado') ? (
                    <span className={calculatePendingBalance(order) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} transition-colors duration-200>
                      {formatCurrency(calculatePendingBalance(order))}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 transition-colors duration-200">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                       onClick={() => onViewDetails(order)}
                       variant="ghost"
                       size="sm"
                       title="Ver detalles"
                       aria-label="Ver detalles de la orden"
                     >
                       👁️
                     </Button>
                     <Button
                       onClick={() => handlePrint(order)}
                       variant="ghost"
                       size="sm"
                       title="Imprimir comprobante"
                       aria-label="Imprimir comprobante de la orden"
                     >
                       🖨️
                     </Button>
                     <Button
                       onClick={() => onEdit(order)}
                       variant="ghost"
                       size="sm"
                       title="Editar"
                       aria-label="Editar orden de servicio"
                     >
                       ✏️
                     </Button>
                     <Button
                       onClick={() => onDelete(order.id)}
                       variant="ghost"
                       size="sm"
                       title="Eliminar"
                       aria-label="Eliminar orden de servicio"
                     >
                       🗑️
                     </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile - Cards */}
      <div className="lg:hidden space-y-4 p-4">
        {paginatedOrders.map((order) => {
          const SwipeableCard = ({ children }) => {
                const { swipeHandlers, currentX, isDragging } = useSwipeCard({
                   onSwipeLeft: () => onDelete(order.id),
                   onSwipeRight: () => onViewDetails(order),
                   threshold: 100
                 });

            return (
                <div 
                  {...swipeHandlers}
                  className={`relative overflow-hidden ${
                    isDragging ? 'transition-none' : 'transition-transform duration-200'
                  }`}
                  style={{
                    transform: `translateX(${currentX}px)`
                  }}
              >
                {/* Acciones de fondo */}
                <div className="absolute inset-0 flex">
                  {/* Acción derecha (Ver detalles) */}
                  <div className="flex-1 bg-blue-500 flex items-center justify-start pl-4">
                    <div className="text-white text-center">
                      <div className="text-2xl mb-1">👁️</div>
                      <div className="text-xs font-medium">Ver</div>
                    </div>
                  </div>
                  {/* Acción izquierda (Eliminar) */}
                  <div className="flex-1 bg-red-500 flex items-center justify-end pr-4">
                    <div className="text-white text-center">
                      <div className="text-2xl mb-1">🗑️</div>
                      <div className="text-xs font-medium">Eliminar</div>
                    </div>
                  </div>
                </div>
                {/* Contenido de la tarjeta */}
                <div className="relative bg-white dark:bg-gray-800 transition-colors duration-200">
                  {children}
                </div>
              </div>
            );
          };

          return (
          <SwipeableCard key={order.id}>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 space-y-3 transition-colors duration-200">
            {/* Header del Card */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">#{order.id}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">{formatDate(order.date)}</p>
              </div>
              <div className="text-right">
                {getStatusBadge(order.status)}
              </div>
            </div>
            
            {/* Cliente y Descripción */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Cliente:</p>
              <p className="text-sm text-gray-900 dark:text-white transition-colors duration-200">{order.customer_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Descripción:</p>
              <p className="text-sm text-gray-900 dark:text-white transition-colors duration-200">{order.description}</p>
            </div>
            
            {/* Información Financiera */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Total:</p>
                <p className="text-green-600 dark:text-green-400 font-semibold transition-colors duration-200">{formatCurrency(order.total)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Ganancia:</p>
                <p className="text-blue-600 dark:text-blue-400 font-semibold transition-colors duration-200">{formatCurrency(order.profit)}</p>
              </div>
              {(order.status === 'finalizado' || order.status === 'entregado') && (
                <>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Pagado:</p>
                    <p className="text-teal-600 dark:text-teal-400 font-semibold transition-colors duration-200">{formatCurrency(order.total_paid || order.totalPaid || 0)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Pendiente:</p>
                    <p className={`font-semibold transition-colors duration-200 ${
                      calculatePendingBalance(order) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(calculatePendingBalance(order))}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {/* Acciones */}
            <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <Button
                 onClick={() => onViewDetails(order)}
                 variant="ghost"
                 size="sm"
                 className="flex items-center space-x-2 touch-manipulation"
                 aria-label="Ver detalles de la orden"
               >
                 <span>👁️</span>
                 <span className="text-sm font-medium">Ver</span>
               </Button>
               <Button
                 onClick={() => handlePrint(order)}
                 variant="ghost"
                 size="sm"
                 className="flex items-center space-x-2 touch-manipulation"
                 aria-label="Imprimir comprobante de la orden"
               >
                 <span>🖨️</span>
                 <span className="text-sm font-medium">Imprimir</span>
               </Button>
               <Button
                 onClick={() => onEdit(order)}
                 variant="ghost"
                 size="sm"
                 className="flex items-center space-x-2 touch-manipulation"
                 aria-label="Editar orden de servicio"
               >
                 <span>✏️</span>
                 <span className="text-sm font-medium">Editar</span>
               </Button>
               <Button
                 onClick={() => onDelete(order.id)}
                 variant="ghost"
                 size="sm"
                 className="flex items-center space-x-2 touch-manipulation"
                 aria-label="Eliminar orden de servicio"
               >
                 <span>🗑️</span>
                 <span className="text-sm font-medium">Eliminar</span>
               </Button>
            </div>
          </div>
          </SwipeableCard>
        );
        })}
      </div>
      
      {/* Paginación */}
      {filteredOrders.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-200">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length} órdenes
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-200">Mostrar:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                   onClick={() => handlePageChange(currentPage - 1)}
                   disabled={currentPage === 1}
                   variant="ghost"
                   size="sm"
                 >
                   Anterior
                 </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                      return (
                        <Button
                           key={page}
                           onClick={() => handlePageChange(page)}
                           variant={currentPage === page ? 'primary' : 'ghost'}
                           size="sm"
                         >
                           {page}
                         </Button>
                      );
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="px-2 text-gray-500 dark:text-gray-400 transition-colors duration-200">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <Button
                   onClick={() => handlePageChange(currentPage + 1)}
                   disabled={currentPage === totalPages}
                   variant="ghost"
                   size="sm"
                 >
                   Siguiente
                 </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {filteredOrders.length === 0 && orders.length > 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 transition-colors duration-200">
          No se encontraron órdenes que coincidan con los filtros aplicados.
        </div>
      )}
      
      {showPrintReceipt && selectedOrderForPrint && (
        <PrintReceipt
          order={selectedOrderForPrint}
          onClose={closePrintReceipt}
        />
      )}
      </div>
    </PullToRefresh>
  );
};

export default ServiceOrdersTable;