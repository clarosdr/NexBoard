import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { supabaseService, isSupabaseConfigured } from './lib/supabase'
import LoginForm from './components/LoginForm'
import DataMigration from './components/DataMigration'
import ThemeToggle from './components/ThemeToggle'
import CacheManager from './components/CacheManager'
import ServiceOrderForm from './components/ServiceOrderForm'
import ServiceOrdersTable from './components/ServiceOrdersTable'
import OrderDetailsModal from './components/OrderDetailsModal'
import BudgetExpensesTable from './components/BudgetExpensesTable'
import CasualExpensesTable from './components/CasualExpensesTable'
import PasswordsTable from './components/PasswordsTable'
import ServerCredentialsTable from './components/ServerCredentialsTable'
import LicensesTable from './components/LicensesTable'
import FinancialDashboard from './components/FinancialDashboard'
import MonthlyReportsTable from './components/MonthlyReportsTable'

// Componente principal de la aplicación (cuando el usuario está autenticado)
function MainApp() {
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [financialView, setFinancialView] = useState('dashboard') // 'dashboard' o 'reports'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showDataMigration, setShowDataMigration] = useState(false)
  const { user, signOut } = useAuth()

  // Cargar órdenes al iniciar
  useEffect(() => {
    const loadOrders = async () => {
      if (user) {
        try {
          const ordersData = await supabaseService.getServiceOrders(user.id)
          setOrders(ordersData)
        } catch (error) {
          console.error('Error loading orders:', error)
        }
      }
    }
    loadOrders()
  }, [user])

  // Limpiar datos de localStorage obsoletos al iniciar (solo si se usa Supabase)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      // Remover datos locales obsoletos que pueden causar conflictos
      const obsoleteKeys = ['nexboard-expenses', 'orders', 'casualExpenses', 'budgetExpenses'];
      obsoleteKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`Removing obsolete localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  // Verificar si hay datos locales para migrar cuando el usuario se autentica (solo para Supabase)
  useEffect(() => {
    if (user && isSupabaseConfigured()) {
      const hasLocalData = () => {
        const localData = {
          orders: JSON.parse(localStorage.getItem('orders') || '[]'),
          casualExpenses: JSON.parse(localStorage.getItem('casualExpenses') || '[]'),
          budgetExpenses: JSON.parse(localStorage.getItem('budgetExpenses') || '[]'),
          licenses: JSON.parse(localStorage.getItem('licenses') || '[]'),
          passwords: JSON.parse(localStorage.getItem('passwords') || '[]'),
          serverCredentials: JSON.parse(localStorage.getItem('serverCredentials') || '[]')
        };
        return Object.values(localData).some(arr => arr.length > 0);
      };

      // Verificar si ya se mostró el modal de migración para este usuario
      const migrationShown = localStorage.getItem(`migration_shown_${user.id}`);
      
      if (hasLocalData() && !migrationShown) {
        setShowDataMigration(true);
      }
    }
  }, [user])

  const handleCreateOrder = async (orderData) => {
    try {
      const newOrder = await supabaseService.createServiceOrder(orderData, user.id)
      setOrders(prev => [...prev, newOrder])
      setShowForm(false)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error al crear la orden. Por favor, intenta de nuevo.')
    }
  }

  const handleEditOrder = (order) => {
    setEditingOrder(order)
    setShowForm(true)
  }

  const handleUpdateOrder = async (updatedOrder) => {
    try {
      const updated = await supabaseService.updateServiceOrder(updatedOrder.id, updatedOrder, user.id)
      setOrders(prev => prev.map(order => 
        order.id === updatedOrder.id ? updated : order
      ))
      setEditingOrder(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error al actualizar la orden. Por favor, intenta de nuevo.')
    }
  }

  const handleCloseMigration = () => {
    setShowDataMigration(false)
    // Marcar que ya se mostró el modal para este usuario
    if (user) {
      localStorage.setItem(`migration_shown_${user.id}`, 'true')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      try {
        await supabaseService.deleteServiceOrder(orderId, user.id)
        setOrders(prev => prev.filter(order => order.id !== orderId))
      } catch (error) {
        console.error('Error deleting order:', error)
        alert('Error al eliminar la orden. Por favor, intenta de nuevo.')
      }
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingOrder(null)
  }

  const handleFormSubmit = async (orderData) => {
    if (editingOrder) {
      await handleUpdateOrder({ ...orderData, id: editingOrder.id, createdAt: editingOrder.createdAt })
    } else {
      await handleCreateOrder(orderData)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <div className="ml-2 lg:ml-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  NexBoard
                  {!isSupabaseConfigured() && (
                    <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      Demo
                    </span>
                  )}
                </h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 hidden sm:block transition-colors duration-200">
                  Sistema de Gestión Empresarial
                  {!isSupabaseConfigured() && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      (Datos guardados localmente)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
                {user?.email}
              </div>
              {activeTab === 'orders' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-3 py-2 lg:px-6 lg:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm lg:text-base"
                >
                  <span className="hidden sm:inline">+ Nueva Orden</span>
                  <span className="sm:hidden">+</span>
                </button>
              )}
              <CacheManager className="hidden lg:flex" />
              <ThemeToggle />
              <button
                onClick={signOut}
                className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-colors duration-200"
                title="Cerrar Sesión"
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:space-x-8 py-4">
            {[
              { id: 'orders', label: '📋 Órdenes', icon: '📋' },
              { id: 'financial', label: '💰 Financiero', icon: '💰' },
              { id: 'casual-expenses', label: '💸 Gastos Casuales', icon: '💸' },
              { id: 'budget-expenses', label: '📊 Gastos Presupuesto', icon: '📊' },
              { id: 'licenses', label: '🔑 Licencias', icon: '🔑' },
              { id: 'passwords', label: '🔒 Contraseñas', icon: '🔒' },
              { id: 'servers', label: '🖥️ Servidores', icon: '🖥️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMobileMenuOpen(false)
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="lg:hidden">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Formulario de Orden */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ServiceOrderForm
                order={editingOrder}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
              />
            </div>
          </div>
        )}

        {/* Modal de Detalles */}
        {showDetailsModal && selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setShowDetailsModal(false)}
          />
        )}

        {/* Modal de Migración de Datos */}
        {showDataMigration && isSupabaseConfigured() && (
          <DataMigration onClose={handleCloseMigration} />
        )}

        {/* Contenido por Tab */}
        {activeTab === 'orders' && (
          <ServiceOrdersTable
            orders={orders}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            onViewDetails={handleViewDetails}
          />
        )}

        {activeTab === 'financial' && (
          <div>
            <div className="mb-6 flex space-x-4">
              <button
                onClick={() => setFinancialView('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  financialView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setFinancialView('reports')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  financialView === 'reports'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                📈 Reportes
              </button>
            </div>
            
            {financialView === 'dashboard' ? (
              <FinancialDashboard orders={orders} />
            ) : (
              <MonthlyReportsTable orders={orders} />
            )}
          </div>
        )}

        {activeTab === 'casual-expenses' && <CasualExpensesTable />}
        {activeTab === 'budget-expenses' && <BudgetExpensesTable />}
        {activeTab === 'licenses' && <LicensesTable />}
        {activeTab === 'passwords' && <PasswordsTable />}
        {activeTab === 'servers' && <ServerCredentialsTable />}
      </main>
    </div>
  )
}

// Componente raíz de la aplicación
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

// Componente que maneja la lógica de autenticación
function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Cargando...</p>
        </div>
      </div>
    )
  }

  return user ? <MainApp /> : <LoginForm />
}

export default App