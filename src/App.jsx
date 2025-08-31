import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { supabaseService } from './lib/supabase'
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
  const [expenses, setExpenses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [financialView, setFinancialView] = useState('dashboard') // 'dashboard' o 'reports'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showDataMigration, setShowDataMigration] = useState(false)
  const { user, signOut } = useAuth()

  // Cargar órdenes desde Supabase al iniciar
  useEffect(() => {
    const loadOrders = async () => {
      if (user) {
        try {
          const ordersData = await supabaseService.getServiceOrders(user.id)
          setOrders(ordersData)
        } catch (error) {
          console.error('Error loading orders from Supabase:', error)
        }
      }
    }
    loadOrders()
  }, [user])

  // Limpiar datos de localStorage problemáticos al iniciar
  useEffect(() => {
    // Remover datos locales obsoletos que pueden causar conflictos
    const obsoleteKeys = ['nexboard-expenses', 'orders', 'casualExpenses', 'budgetExpenses'];
    obsoleteKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`Removing obsolete localStorage key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Verificar si hay datos locales para migrar cuando el usuario se autentica
  useEffect(() => {
    if (user) {
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
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">NexBoard</h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 hidden sm:block transition-colors duration-200">Sistema de Gestión Empresarial</p>
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

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('orders')
                setShowForm(false)
                setEditingOrder(null)
                setMobileMenuOpen(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📋 Órdenes de Servicio
            </button>
            <button
              onClick={() => {
                setActiveTab('budget')
                setShowForm(false)
                setEditingOrder(null)
                setMobileMenuOpen(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'budget'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              💰 Presupuesto Personal
            </button>
            <button
              onClick={() => {
                setActiveTab('casual-expenses')
                setShowForm(false)
                setEditingOrder(null)
                setMobileMenuOpen(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'casual-expenses'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              🍽️ Gastos Casuales
            </button>
            <button
              onClick={() => {
                setActiveTab('passwords')
                setShowForm(false)
                setEditingOrder(null)
                setMobileMenuOpen(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'passwords'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              🔐 Gestor de Contraseñas
            </button>
            <button
              onClick={() => {
                setActiveTab('servers')
                setShowForm(false)
                setEditingOrder(null)
                setMobileMenuOpen(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'servers'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              🖥️ Credenciales de Servidores
            </button>
            <button
              onClick={() => {
                setActiveTab('licenses')
                setShowForm(false)
                setEditingOrder(null)
                setMobileMenuOpen(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'licenses'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📄 Gestión de Licencias
            </button>
            <button
              onClick={() => {
                setActiveTab('financial')
                setShowForm(false)
                setEditingOrder(null)
                setFinancialView('dashboard')
                setMobileMenuOpen(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'financial'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📊 Informes Financieros
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('orders')
                  setShowForm(false)
                  setEditingOrder(null)
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'orders'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📋 Órdenes de Servicio
              </button>
              <button
                onClick={() => {
                  setActiveTab('budget')
                  setShowForm(false)
                  setEditingOrder(null)
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'budget'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                💰 Presupuesto Personal
              </button>
              <button
                onClick={() => {
                  setActiveTab('casual-expenses')
                  setShowForm(false)
                  setEditingOrder(null)
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'casual-expenses'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                🍽️ Gastos Casuales
              </button>
              <button
                onClick={() => {
                  setActiveTab('passwords')
                  setShowForm(false)
                  setEditingOrder(null)
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'passwords'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                🔐 Gestor de Contraseñas
              </button>
              <button
                onClick={() => {
                  setActiveTab('servers')
                  setShowForm(false)
                  setEditingOrder(null)
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'servers'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                🖥️ Credenciales de Servidores
              </button>
              <button
                onClick={() => {
                  setActiveTab('licenses')
                  setShowForm(false)
                  setEditingOrder(null)
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'licenses'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📄 Gestión de Licencias
              </button>
              <button
                onClick={() => {
                  setActiveTab('financial')
                  setShowForm(false)
                  setEditingOrder(null)
                  setFinancialView('dashboard')
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'financial'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📊 Informes Financieros
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 lg:py-8">
        {activeTab === 'orders' && (
          <>
            {showForm ? (
              <ServiceOrderForm
                order={editingOrder}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
              />
            ) : (
              <ServiceOrdersTable
                orders={orders}
                onEdit={handleEditOrder}
                onDelete={handleDeleteOrder}
                onViewDetails={handleViewDetails}
              />
            )}
          </>
        )}
        
        {activeTab === 'budget' && (
          <BudgetExpensesTable />
        )}
        
        {activeTab === 'casual-expenses' && (
          <CasualExpensesTable />
        )}
        
        {activeTab === 'passwords' && (
          <PasswordsTable />
        )}
        
        {activeTab === 'servers' && (
          <ServerCredentialsTable />
        )}
        
        {activeTab === 'licenses' && (
          <LicensesTable />
        )}
        
        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* Navegación interna de informes financieros */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setFinancialView('dashboard')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    financialView === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📈 Dashboard Financiero
                </button>
                <button
                  onClick={() => setFinancialView('reports')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    financialView === 'reports'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📋 Informes Mensuales
                </button>
              </nav>
            </div>
            
            {/* Contenido de informes financieros */}
            {financialView === 'dashboard' && (
              <FinancialDashboard orders={orders} expenses={expenses} />
            )}
            
            {financialView === 'reports' && (
              <MonthlyReportsTable orders={orders} expenses={expenses} />
            )}
          </div>
        )}
      </main>

      {/* Modal de detalles */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedOrder(null)
        }}
      />

      {/* Modal de migración de datos */}
      {showDataMigration && (
        <DataMigration onClose={handleCloseMigration} />
      )}
    </div>
  )
}

// Componente App principal que maneja la autenticación
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

// Componente que decide qué mostrar basado en el estado de autenticación
function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <MainApp />
}

export default App
