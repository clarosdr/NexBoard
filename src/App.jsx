import { useState, useEffect, useMemo, useCallback } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { ThemeProvider } from './contexts/ThemeContextProvider'
import { AppStateProvider } from './contexts/AppStateContext'
import { useAppState } from './hooks/useAppState'
import { isSupabaseConfigured } from './lib/supabase'
import LoginForm from './components/LoginForm'
import DataMigration from './components/DataMigration'
import ThemeToggle from './components/ThemeToggle'
import CacheManager from './components/CacheManager'
import Button from './components/ui/Button'
import ServiceOrderForm from './components/ServiceOrderForm'
import ServiceOrdersTable from './components/ServiceOrdersTable'
import OrderDetailsModal from './components/OrderDetailsModal'
import Modal from './components/ui/Modal'
import BudgetExpensesTable from './components/BudgetExpensesTable'
import CasualExpensesTable from './components/CasualExpensesTable'
import PasswordsTable from './components/PasswordsTable'
import ServerCredentialsTable from './components/ServerCredentialsTable'
import LicensesTable from './components/LicensesTable'
import FinancialDashboard from './components/FinancialDashboard'
import MonthlyReportsTable from './components/MonthlyReportsTable'

// Componente principal de la aplicación (cuando el usuario está autenticado)
function MainApp() {
  const { user, signOut } = useAuth()
  const { state, actions } = useAppState()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  // Banner de aviso cuando Supabase no está configurado (persistente por localStorage)
  const [hideSupabaseBanner, setHideSupabaseBanner] = useState(() => localStorage.getItem('nxb_hide_supabase_banner') === '1')
  const dismissSupabaseBanner = useCallback(() => {
    setHideSupabaseBanner(true)
    localStorage.setItem('nxb_hide_supabase_banner', '1')
  }, [])

  // Cargar órdenes al iniciar
  useEffect(() => {
    if (user) {
      actions.loadOrders(user.id)
    }
  }, [user, actions])

  // Limpiar datos de localStorage obsoletos al iniciar (solo si se usa Supabase)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      // Remover datos locales obsoletos que pueden causar conflictos
      const obsoleteKeys = ['nexboard-expenses', 'orders', 'casualExpenses', 'budgetExpenses'];
      obsoleteKeys.forEach(key => {
        if (localStorage.getItem(key)) {
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
        actions.setShowDataMigration(true);
      }
    }
  }, [user, actions])

  const handleCreateOrder = useCallback(async (orderData) => {
    try {
      await actions.createOrder(orderData, user.id)
      actions.setShowOrderForm(false)
    } catch {
      // Error ya manejado en el contexto
    }
  }, [actions, user?.id])

  const handleEditOrder = useCallback((order) => {
    actions.setEditingOrder(order)
    actions.setShowOrderForm(true)
  }, [actions])

  const handleUpdateOrder = useCallback(async (updatedOrder) => {
    try {
      await actions.updateOrderAsync(updatedOrder, user.id)
      actions.setEditingOrder(null)
      actions.setShowOrderForm(false)
    } catch {
      // Error ya manejado en el contexto
    }
  }, [actions, user?.id])

  const handleCloseMigration = useCallback(() => {
    actions.setShowDataMigration(false)
    // Marcar que ya se mostró el modal para este usuario
    if (user) {
      localStorage.setItem(`migration_shown_${user.id}`, 'true')
    }
  }, [actions, user])

  const handleDeleteOrder = useCallback(async (orderId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      try {
        await actions.deleteOrderAsync(orderId, user.id)
      } catch {
        // Error ya manejado en el contexto
      }
    }
  }, [actions, user?.id])

  const handleViewDetails = useCallback((order) => {
    actions.showOrderDetails(order)
  }, [actions])

  const handleCancelForm = useCallback(() => {
    console.log('handleCancelForm called, hasUnsavedChanges:', hasUnsavedChanges);
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm(
        '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.'
      );
      if (shouldClose) {
        console.log('User confirmed close');
        actions.setShowOrderForm(false)
        actions.setEditingOrder(null)
        setHasUnsavedChanges(false)
      } else {
        console.log('User cancelled close');
      }
    } else {
      console.log('No unsaved changes, closing form');
      actions.setShowOrderForm(false)
      actions.setEditingOrder(null)
      setHasUnsavedChanges(false)
    }
  }, [actions, hasUnsavedChanges])

  const handleFormChange = useCallback((hasChanges) => {
    setHasUnsavedChanges(hasChanges)
  }, [])

  const handleConfirmClose = useCallback(() => {
    actions.setShowOrderForm(false)
    actions.setEditingOrder(null)
    setHasUnsavedChanges(false)
  }, [actions])

  const handleFormSubmit = useCallback(async (orderData) => {
if (state.editingOrder) {
  await handleUpdateOrder({ ...orderData, id: state.editingOrder.id })
} else {
  await handleCreateOrder(orderData)
}
// Resetear el estado de cambios no guardados después del envío exitoso
setHasUnsavedChanges(false)
  }, [state.editingOrder, handleUpdateOrder, handleCreateOrder])

  // Memoizar la configuración de pestañas
  const tabs = useMemo(() => [
    { id: 'orders', label: '📋 Órdenes', icon: '📋' },
    { id: 'financial', label: '💰 Financiero', icon: '💰' },
    { id: 'casual-expenses', label: '💸 Gastos Casuales', icon: '💸' },
    { id: 'budget-expenses', label: '📊 Gastos Presupuesto', icon: '📊' },
    { id: 'licenses', label: '🔑 Licencias', icon: '🔑' },
    { id: 'passwords', label: '🔒 Contraseñas', icon: '🔒' },
    { id: 'servers', label: '🖥️ Servidores', icon: '🖥️' }
  ], [])

  // Memoizar si Supabase está configurado
  const supabaseConfigured = useMemo(() => isSupabaseConfigured(), [])

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
                aria-label="Abrir menú de navegación"
                aria-expanded={mobileMenuOpen}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                  {!supabaseConfigured && (
                    <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      Demo
                    </span>
                  )}
                </h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 hidden sm:block transition-colors duration-200">
                  Sistema de Gestión Empresarial
                  {!supabaseConfigured && (
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
              {state.activeTab === 'orders' && (
                <Button
                  onClick={() => actions.setShowOrderForm(true)}
                  variant="primary"
                  size="md"
                  className="lg:px-6 lg:py-3 lg:text-base"
                  aria-label="Crear nueva orden de servicio"
                >
                  <span className="hidden sm:inline">+ Nueva Orden</span>
                  <span className="sm:hidden">+</span>
                </Button>
              )}
              <CacheManager className="hidden lg:flex" />
              <ThemeToggle />
              <Button
                onClick={signOut}
                variant="ghost"
                size="md"
                title="Cerrar Sesión"
                aria-label="Cerrar sesión de usuario"
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">⏻</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Aviso de configuración faltante de Supabase */}
      {!supabaseConfigured && !hideSupabaseBanner && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-start justify-between">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Modo Demo activo:</span> No se detectaron variables de Supabase. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Netlify y vuelve a desplegar.
            </div>
            <button
              onClick={dismissSupabaseBanner}
              className="ml-4 text-blue-700 dark:text-blue-300 hover:underline text-sm"
              aria-label="Ocultar aviso de configuración"
              title="Ocultar"
            >
              Ocultar
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:space-x-8 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  actions.setActiveTab(tab.id)
                  setMobileMenuOpen(false)
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  state.activeTab === tab.id
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
        <Modal
          isOpen={state.showOrderForm}
          onClose={handleCancelForm}
          title={state.editingOrder ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
          size="lg"
          hasUnsavedChanges={hasUnsavedChanges}
          onConfirmClose={handleConfirmClose}
        >
          <ServiceOrderForm
            order={state.editingOrder}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            onFormChange={handleFormChange}
          />
        </Modal>

        {/* Modal de Detalles */}
         {state.showOrderDetails && state.selectedOrder && (
           <OrderDetailsModal
             order={state.selectedOrder}
             onClose={() => actions.hideOrderDetails()}
           />
         )}

        {/* Modal de Migración de Datos */}
         {state.showDataMigration && supabaseConfigured && (
           <DataMigration onClose={handleCloseMigration} />
         )}

        {/* Contenido por Tab */}
        {state.activeTab === 'orders' && (
          <ServiceOrdersTable 
            orders={state.orders}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            onViewDetails={handleViewDetails}
            onAddNew={handleCreateOrder}
          />
        )}

        {state.activeTab === 'financial' && (
          <div>
            <div className="mb-6 flex space-x-4">
              <Button
                onClick={() => actions.setFinancialView('dashboard')}
                variant={state.financialView === 'dashboard' ? 'primary' : 'secondary'}
                size="md"
              >
                📊 Dashboard
              </Button>
              <Button
                onClick={() => actions.setFinancialView('reports')}
                variant={state.financialView === 'reports' ? 'primary' : 'secondary'}
                size="md"
              >
                📈 Reportes
              </Button>
            </div>
            
            {state.financialView === 'dashboard' ? (
              <FinancialDashboard orders={state.orders} />
            ) : (
              <MonthlyReportsTable orders={state.orders} />
            )}
          </div>
        )}

        {state.activeTab === 'casual-expenses' && <CasualExpensesTable />}
        {state.activeTab === 'budget-expenses' && <BudgetExpensesTable />}
        {state.activeTab === 'licenses' && <LicensesTable />}
        {state.activeTab === 'passwords' && <PasswordsTable />}
        {state.activeTab === 'servers' && <ServerCredentialsTable />}
      </main>
    </div>
  )
}

// Componente raíz de la aplicación
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
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