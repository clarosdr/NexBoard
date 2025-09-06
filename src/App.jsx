import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';

import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import ServiceOrderForm from './components/ServiceOrderForm';
import ServiceOrdersTable from './components/ServiceOrdersTable';
import MonthlyReportForm from './components/MonthlyReportForm';
import MonthlyReportsTable from './components/MonthlyReportsTable';
import MonthlyReportsChart from './components/MonthlyReportsChart';
import FinancialDashboard from './components/FinancialDashboard';
import CasualExpensesTable from './components/CasualExpensesTable';
import BudgetExpensesTable from './components/BudgetExpensesTable';
import PasswordsTable from './components/PasswordsTable';
import PasswordForm from './components/PasswordForm';
import LicensesTable from './components/LicensesTable';
import LicenseForm from './components/LicenseForm';
import ServerCredentialsTable from './components/ServerCredentialsTable';
import ServerCredentialsForm from './components/ServerCredentialsForm';
import ThemeToggle from './components/ThemeToggle';
import CacheManager from './components/CacheManager';
import DataMigration from './components/DataMigration';
import Modal from './components/ui/Modal';
import Button from './components/ui/Button';
import { useMonthlyReports } from './hooks/useMonthlyReports';

const ServiceOrdersView = () => {
    const { state, actions } = useAppState();
    const { user } = useAuth();

    const handleSave = async (orderData) => {
        try {
            if (state.editingOrder?.id) {
                await actions.updateOrderAsync({ ...orderData, id: state.editingOrder.id }, user.id);
            } else {
                await actions.createOrder(orderData, user.id);
            }
        } finally {
            actions.hideOrderForm();
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Órdenes de Servicio</h1>
                <Button onClick={() => actions.setEditingOrder(null)} variant="primary" size="md">
                    + Nueva Orden
                </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <ServiceOrdersTable />
            </div>
            <Modal
                isOpen={state.showOrderForm}
                onClose={actions.hideOrderForm}
                title={state.editingOrder ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
                size="lg"
            >
                <ServiceOrderForm
                    order={state.editingOrder}
                    onSaved={handleSave}
                />
            </Modal>
        </div>
    );
};

const MonthlyReportsManager = () => {
  const [activeTab, setActiveTab] = useState('tabla');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { reports, loading, refetch } = useMonthlyReports({ year: selectedYear });

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">📊 Panel de Reportes Mensuales</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Gestión financiera por año</p>
      </header>
       <div className="flex items-center space-x-2">
          <label htmlFor="year" className="font-medium">Año:</label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2 py-1 rounded border dark:bg-gray-800 bg-white"
          >
            {[2023, 2024, 2025].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      <nav className="flex space-x-2">
        <Button onClick={() => setActiveTab('tabla')} variant={activeTab === 'tabla' ? 'primary' : 'secondary'}>Tabla</Button>
        <Button onClick={() => setActiveTab('formulario')} variant={activeTab === 'formulario' ? 'primary' : 'secondary'}>Formulario</Button>
        <Button onClick={() => setActiveTab('graficos')} variant={activeTab === 'graficos' ? 'primary' : 'secondary'}>Gráficos</Button>
      </nav>
      <section className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        {loading ? (
          <p className="text-center text-gray-500">⏳ Cargando reportes...</p>
        ) : activeTab === 'tabla' ? (
          <MonthlyReportsTable reports={reports} onRefresh={refetch} />
        ) : activeTab === 'formulario' ? (
          <MonthlyReportForm onSaved={refetch} />
        ) : (
          <MonthlyReportsChart data={reports} />
        )}
      </section>
    </div>
  )
}

const FinancialView = () => {
    const [subView, setSubView] = useState('dashboard');
    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Finanzas</h1>
            <div className="flex space-x-2 border-b dark:border-gray-700 pb-2">
                <Button variant={subView === 'dashboard' ? 'primary' : 'ghost'} onClick={() => setSubView('dashboard')}>Resumen</Button>
                <Button variant={subView === 'reports' ? 'primary' : 'ghost'} onClick={() => setSubView('reports')}>Reportes Mensuales</Button>
                <Button variant={subView === 'casual' ? 'primary' : 'ghost'} onClick={() => setSubView('casual')}>Gastos Casuales</Button>
                <Button variant={subView === 'budget' ? 'primary' : 'ghost'} onClick={() => setSubView('budget')}>Gastos Fijos</Button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                {subView === 'dashboard' && <FinancialDashboard />}
                {subView === 'reports' && <MonthlyReportsManager />}
                {subView === 'casual' && <CasualExpensesTable />}
                {subView === 'budget' && <BudgetExpensesTable />}
            </div>
        </div>
    );
}

const CrudView = ({ title, addLabel, TableComponent, FormComponent }) => {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setShowModal(false);
    setRefreshKey(k => k + 1);
  };
  
  const handleCancel = () => {
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{title}</h1>
        <Button onClick={() => setShowModal(true)} variant="primary">{addLabel}</Button>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <TableComponent key={refreshKey} />
      </div>
      <Modal isOpen={showModal} onClose={handleCancel} title={`Añadir ${title}`}>
          <FormComponent onSaved={handleSaved} onCancel={handleCancel} />
      </Modal>
    </div>
  );
};


const MainLayout = () => {
  const { state, actions } = useAppState();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user?.id) {
        actions.loadOrders(user.id);
    }
  }, [user, actions]);

  const renderContent = () => {
    switch (state.activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <ServiceOrdersView />;
      case 'finances':
        return <FinancialView />;
      case 'passwords':
        return <CrudView title="Contraseñas" addLabel="+ Añadir Contraseña" TableComponent={PasswordsTable} FormComponent={PasswordForm} />;
      case 'licenses':
        return <CrudView title="Licencias" addLabel="+ Añadir Licencia" TableComponent={LicensesTable} FormComponent={LicenseForm} />;
      case 'servers':
        return <CrudView title="Servidores" addLabel="+ Añadir Servidor" TableComponent={ServerCredentialsTable} FormComponent={ServerCredentialsForm} />;
      default:
        return <Dashboard />;
    }
  };
  
  const NavItem = ({ tab, icon, label }) => (
    <li>
      <button
        onClick={() => actions.setActiveTab(tab)}
        className={`w-full flex items-center px-4 py-2 text-left text-sm font-medium rounded-md transition-colors duration-200 ${
          state.activeTab === tab
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <span className="mr-3 text-lg">{icon}</span>
        {label}
      </button>
    </li>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col p-4 transition-colors duration-200">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-8 flex items-center justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-xl font-bold text-white">N</span>
            </div>
            <span>NexBoard</span>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <NavItem tab="dashboard" icon="📊" label="Dashboard" />
            <NavItem tab="orders" icon="📦" label="Órdenes" />
            <NavItem tab="finances" icon="💰" label="Finanzas" />
            <NavItem tab="passwords" icon="🔐" label="Contraseñas" />
            <NavItem tab="licenses" icon="🔑" label="Licencias" />
            <NavItem tab="servers" icon="🖥️" label="Servidores" />
          </ul>
        </nav>
        <div className="mt-auto space-y-4">
            <CacheManager />
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="text-sm">
                    <p className="font-semibold text-gray-800 dark:text-white">{user?.email}</p>
                    <button onClick={signOut} className="text-xs text-red-500 hover:underline">
                        Cerrar Sesión
                    </button>
                </div>
                <ThemeToggle />
            </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderContent()}
        </div>
      </main>
      
      {state.showDataMigration && <DataMigration onClose={actions.hideDataMigration} />}
    </div>
  );
}

const App = () => {
  const { user, loading, isSupabaseConfigured } = useAuth();
  const { actions } = useAppState();

  useEffect(() => {
    if (user && isSupabaseConfigured()) {
      const localDataKeys = ['orders', 'casualExpenses', 'budgetExpenses', 'licenses', 'passwords', 'serverCredentials'];
      const localDataExists = localDataKeys.some(key => {
        const item = localStorage.getItem(key);
        return item && item !== '[]';
      });

      const migrationShown = localStorage.getItem(`migration_shown_${user.id}`);

      if (localDataExists && !migrationShown) {
        actions.showDataMigration();
      }
    }
  }, [user, isSupabaseConfigured, actions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return user ? <MainLayout /> : <LoginForm />;
};

export default App;
