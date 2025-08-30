import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginForm from './components/LoginForm'
import DataMigration from './components/DataMigration'
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

  // Cargar órdenes desde localStorage al iniciar
  useEffect(() => {
    const savedOrders = localStorage.getItem('nexboard-orders')
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders))
      } catch (error) {
        console.error('Error loading orders from localStorage:', error)
      }
    }
  }, [])

  // Cargar gastos desde localStorage al iniciar
  useEffect(() => {
    const savedExpenses = localStorage.getItem('nexboard-expenses')
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses))
      } catch (error) {
        console.error('Error loading expenses from localStorage:', error)
      }
    }
  }, [])

  // Guardar órdenes en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('nexboard-orders', JSON.stringify(orders))
  }, [orders])

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

  const handleCreateOrder = (orderData) => {
    setOrders(prev => [...prev, orderData])
    setShowForm(false)
  }

  const handleEditOrder = (order) => {
    setEditingOrder(order)
    setShowForm(true)
  }

  const handleUpdateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ))
    setEditingOrder(null)
    setShowForm(false)
  }

  const handleCloseMigration = () => {
    setShowDataMigration(false)
    // Marcar que ya se mostró el modal para este usuario
    if (user) {
      localStorage.setItem(`migration_shown_${user.id}`, 'true')
    }
  }

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      setOrders(prev => prev.filter(order => order.id !== orderId))
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

  const handleFormSubmit = (orderData) => {
    if (editingOrder) {
      handleUpdateOrder({ ...orderData, id: editingOrder.id, createdAt: editingOrder.createdAt })
    } else {
      handleCreateOrder(orderData)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">NexBoard</h1>
                <p className="text-sm lg:text-base text-gray-600 hidden sm:block">Sistema de Gestión Empresarial</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
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
              <button
                onClick={signOut}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
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
      <nav className="bg-white border-b">
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'budget'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'casual-expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'passwords'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'servers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'licenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'financial'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
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
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'budget'
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
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
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'casual-expenses'
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
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
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'passwords'
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
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
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'servers'
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
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
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'licenses'
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
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
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'financial'
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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
