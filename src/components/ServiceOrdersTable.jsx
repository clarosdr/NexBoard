import React, { useState } from 'react';
import OrderDetailsModal from './OrderDetailsModal';
import PrintReceipt from './PrintReceipt';
import PullToRefresh from './PullToRefresh';
import { useSwipeCard } from '../hooks/useTouchGestures';
import Button from './ui/Button';
import { FaEye, FaPrint, FaEdit, FaTrash, FaBox, FaChartLine, FaFileInvoiceDollar, FaMoneyBillWave, FaCoins, FaPlus, FaArchive, FaList, FaTh, FaSync } from 'react-icons/fa';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

// Función para formatear valores en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const ServiceOrdersTable = ({ orders, onEdit, onDelete, onViewDetails, onAddNew }) => {
  const [filterStatus, setFilterStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy] = useState('date');  
  const [sortOrder] = useState('desc');  
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showArchived, setShowArchived] = useState(false);
  const [layout, setLayout] = useState('grid'); // 'grid' or 'list'

  const statusOptions = [
    { value: 'todos', label: 'Todos', color: 'gray' },
    { value: 'pending', label: 'Pendiente', color: 'yellow' },
    { value: 'in_progress', label: 'En Proceso', color: 'blue' },
    { value: 'completed', label: 'Completado', color: 'green' },
    { value: 'delivered', label: 'Entregado', color: 'gray' },
    { value: 'archived', label: 'Archivado', color: 'purple' }
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
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Pendiente' },
      in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'En Proceso' },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Completado' },
      delivered: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Entregado' },
      archived: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', label: 'Archivado' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
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
      const matchesSearch = 
        (order.description && order.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.id && order.id.toString().includes(searchTerm));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.service_date || a.date);
          bValue = new Date(b.service_date || b.date);
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
      month: 'long',
      day: 'numeric'
    });
  };

  // Estas funciones se han eliminado porque no se utilizan en el componente

  const calculateTotals = () => {
    return filteredOrders.reduce((acc, order) => {
      acc.totalSales += order.total || 0;
      acc.totalCosts += order.total_part_cost || order.totalPartCost || 0;
      acc.totalProfit += order.profit || 0;
      
      // Calcular totales de pagos y saldos pendientes
      if (order.status === 'FINALIZADO' || order.status === 'ENTREGADO') {
        const totalPaid = order.total_paid || order.totalPaid || 0;
        const pendingBalance = (order.total || 0) - totalPaid;
        
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
    if (order.status !== 'FINALIZADO' && order.status !== 'ENTREGADO') {
      return 0;
    }
    const totalPaid = order.total_paid || order.totalPaid || 0;
    return Math.max(0, (order.total || 0) - totalPaid);
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
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-lg shadow-lg">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Órdenes de Servicio</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar por cliente, ID, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <Button onClick={onAddNew} variant="success" className="hidden sm:flex">
                <FaPlus className="mr-2" />
                Nueva Orden
              </Button>
            </div>
          </div>
          
          {/* Pestañas de estado */}
          <div className="mt-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-6 overflow-x-auto">
                {statusOptions.map(option => {
                  const count = getOrderCountByStatus(option.value);
                  const isActive = filterStatus === option.value;
                  const colorClasses = {
                    yellow: isActive ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-500',
                    blue: isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500',
                    green: isActive ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-500',
                    gray: isActive ? 'border-gray-500 text-gray-600 dark:text-gray-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 hover:border-gray-500',
                    purple: isActive ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-500'
                  };
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilterStatus(option.value)}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 focus:outline-none ${colorClasses[option.color]}`}
                    >
                      {option.label}
                      <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-bold ${
                        isActive 
                          ? `bg-${option.color}-100 dark:bg-${option.color}-900/40 text-${option.color}-800 dark:text-${option.color}-200` 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>

        {/* Controles y Resumen de Totales */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button onClick={() => setLayout('grid')} variant={layout === 'grid' ? 'primary' : 'ghost'} size="sm"><FaTh /></Button>
              <Button onClick={() => setLayout('list')} variant={layout === 'list' ? 'primary' : 'ghost'} size="sm"><FaList /></Button>
              <Button onClick={() => setShowArchived(!showArchived)} variant={showArchived ? 'secondary' : 'ghost'} size="sm">
                <FaArchive className="mr-2" />
                {showArchived ? 'Ver Activas' : 'Ver Archivadas'}
              </Button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando <span className="font-bold">{paginatedOrders.length}</span> de <span className="font-bold">{filteredOrders.length}</span> órdenes
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard icon={<FaBox />} title="Órdenes" value={filteredOrders.length} color="blue" />
            <StatCard icon={<FaFileInvoiceDollar />} title="Ventas" value={formatCurrency(totals.totalSales)} color="green" />
            <StatCard icon={<FaCoins />} title="Costos" value={formatCurrency(totals.totalCosts)} color="red" />
            <StatCard icon={<FaChartLine />} title="Ganancia" value={formatCurrency(totals.totalProfit)} color="purple" />
            <StatCard icon={<FaMoneyBillWave />} title="Cobrado" value={formatCurrency(totals.totalPaid)} color="teal" />
            <StatCard icon={<FaMoneyBillWave />} title="Por Cobrar" value={formatCurrency(totals.totalPending)} color="orange" />
          </div>
        </div>

        {/* Vista de Órdenes */}
        {paginatedOrders.length > 0 ? (
          <div className={`grid gap-4 sm:gap-6 ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {paginatedOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
                onPrint={handlePrint}
                getStatusBadge={getStatusBadge}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                calculatePendingBalance={calculatePendingBalance}
                layout={layout}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FaBox className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No se encontraron órdenes</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Intenta ajustar los filtros o el término de búsqueda.</p>
          </div>
        )}
      
        {/* Paginación */}
        {filteredOrders.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700 dark:text-gray-300">Mostrar:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                 onClick={() => handlePageChange(currentPage - 1)}
                 disabled={currentPage === 1}
                 variant="ghost"
                 size="sm"
               >
                 Anterior
               </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
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
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">...</span>;
                }
                return null;
              })}
              
              <Button
                 onClick={() => handlePageChange(currentPage + 1)}
                 disabled={currentPage === totalPages}
                 variant="ghost"
                 size="sm"
               >
                 Siguiente
               </Button>
            </div>
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

const StatCard = ({ icon, title, value, color }) => {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    teal: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  };

  return (
    <div className={`p-3 rounded-lg flex items-center gap-3 ${colors[color]}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-sm font-medium opacity-80">{title}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
};

const OrderCard = ({ 
  order, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onPrint, 
  getStatusBadge, 
  formatCurrency, 
  formatDate, 
  calculatePendingBalance,
  layout
}) => {
  const { swipeHandlers, isDragging, currentX } = useSwipeCard({
    onSwipeLeft: () => onDelete(order.id),
    onSwipeRight: () => onEdit(order),
    threshold: 80
  });

  const cardContent = (
    <>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-grow">
          <p className="text-sm text-gray-500 dark:text-gray-400">#{order.id} &bull; {formatDate(order.service_date || order.date)}</p>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate" title={order.customer_name}>
            {order.customer_name || 'Cliente no especificado'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate" title={order.description}>
            {order.description}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
        <FinancialInfo label="Total" value={formatCurrency(order.total)} color="text-green-600 dark:text-green-400" />
        <FinancialInfo label="Ganancia" value={formatCurrency(order.profit)} color="text-blue-600 dark:text-blue-400" />
        <FinancialInfo label="Pagado" value={formatCurrency(order.total_paid || 0)} color="text-teal-600 dark:text-teal-400" />
        <FinancialInfo label="Pendiente" value={formatCurrency(calculatePendingBalance(order))} color={calculatePendingBalance(order) > 0 ? 'text-orange-500' : 'text-gray-500'} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t border-gray-200 dark:border-gray-700/50 pt-3">
        <Button onClick={() => onViewDetails(order)} variant="ghost" size="sm" title="Ver Detalles"><FaEye /></Button>
        <Button onClick={() => onPrint(order)} variant="ghost" size="sm" title="Imprimir"><FaPrint /></Button>
        <Button onClick={() => onEdit(order)} variant="ghost" size="sm" title="Editar"><FaEdit /></Button>
        <Button onClick={() => onDelete(order.id)} variant="danger" size="sm" title="Eliminar"><FaTrash /></Button>
      </div>
    </>
  );

  const listContent = (
     <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4 flex-grow">
            <div className="w-16 text-center">
                {getStatusBadge(order.status)}
            </div>
            <div>
                <p className="font-bold text-gray-800 dark:text-white">#{order.id} - {order.customer_name || 'N/A'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{order.description}</p>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-right">
                <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(order.total)}</p>
                <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(order.profit)}</p>
                <p className="text-xs text-gray-500">Ganancia</p>
            </div>
        </div>
        <div className="flex items-center gap-1 ml-4">
            <Button onClick={() => onViewDetails(order)} variant="ghost" size="sm" title="Ver Detalles"><FaEye /></Button>
            <Button onClick={() => onEdit(order)} variant="ghost" size="sm" title="Editar"><FaEdit /></Button>
            <Button onClick={() => onDelete(order.id)} variant="danger" size="sm" title="Eliminar"><FaTrash /></Button>
        </div>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
      className="relative"
    >
      <div
        {...swipeHandlers}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ transform: `translateX(${currentX}px)` }}
      >
        {layout === 'grid' ? cardContent : listContent}
      </div>
      {/* Swipe action hints */}
      <div className="absolute inset-y-0 left-0 flex items-center justify-center w-20 bg-green-500 text-white rounded-l-xl" style={{ opacity: Math.max(0, currentX / 80 - 0.2), zIndex: -1 }}>
        <FaEdit size={24} />
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-500 text-white rounded-r-xl" style={{ opacity: Math.max(0, -currentX / 80 - 0.2), zIndex: -1 }}>
        <FaTrash size={24} />
      </div>
    </motion.div>
  );
};

const FinancialInfo = ({ label, value, color }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`font-semibold ${color}`}>{value}</p>
  </div>
);

export default ServiceOrdersTable;