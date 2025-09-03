import React, { createContext, useReducer, useMemo } from 'react'
import { supabaseService } from '../lib/supabase'
import { actionTypes } from '../constants/actionTypes'

// Estado inicial
const initialState = {
  activeTab: 'orders',
  orders: [],
  showOrderForm: false,
  editingOrder: null,
  showOrderDetails: false,
  selectedOrder: null,
  showDataMigration: false,
  isLoading: false,
  financialView: 'dashboard'
}

// Los tipos de acciones se han movido a src/constants/actionTypes.js

// Reducer
function appStateReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload }
    
    case actionTypes.SET_ORDERS:
      return { ...state, orders: action.payload }
    
    case actionTypes.ADD_ORDER:
      return { ...state, orders: [...state.orders, action.payload] }
    
    case actionTypes.UPDATE_ORDER:
      return {
        ...state,
        orders: state.orders.map(order => 
          order.id === action.payload.id ? action.payload : order
        )
      }
    
    case actionTypes.DELETE_ORDER:
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload)
      }
    
    case actionTypes.SHOW_ORDER_FORM:
      return { ...state, showOrderForm: true }
    
    case actionTypes.HIDE_ORDER_FORM:
      return { ...state, showOrderForm: false, editingOrder: null }
    
    case actionTypes.SET_EDITING_ORDER:
      return { ...state, editingOrder: action.payload, showOrderForm: true }
    
    case actionTypes.SHOW_ORDER_DETAILS:
      return { ...state, showOrderDetails: true, selectedOrder: action.payload }
    
    case actionTypes.HIDE_ORDER_DETAILS:
      return { ...state, showOrderDetails: false, selectedOrder: null }
    
    case actionTypes.SET_SELECTED_ORDER:
      return { ...state, selectedOrder: action.payload }
    
    case actionTypes.SHOW_DATA_MIGRATION:
      return { ...state, showDataMigration: true }
    
    case actionTypes.HIDE_DATA_MIGRATION:
      return { ...state, showDataMigration: false }
    
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload }
    
    case actionTypes.SET_FINANCIAL_VIEW:
      return { ...state, financialView: action.payload }
    
    default:
      return state
  }
}

// Contexto
const AppStateContext = createContext()
export { AppStateContext }

// Provider
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState)

  // Actions with useCallback to prevent infinite loops
  const actions = useMemo(() => ({
    setActiveTab: (tab) => dispatch({ type: actionTypes.SET_ACTIVE_TAB, payload: tab }),
    setOrders: (orders) => dispatch({ type: actionTypes.SET_ORDERS, payload: orders }),
    addOrder: (order) => dispatch({ type: actionTypes.ADD_ORDER, payload: order }),
    updateOrder: (order) => dispatch({ type: actionTypes.UPDATE_ORDER, payload: order }),
    deleteOrder: (orderId) => dispatch({ type: actionTypes.DELETE_ORDER, payload: orderId }),
    setShowOrderForm: (show) => dispatch({ type: show ? actionTypes.SHOW_ORDER_FORM : actionTypes.HIDE_ORDER_FORM }),
    showOrderForm: () => dispatch({ type: actionTypes.SHOW_ORDER_FORM }),
    hideOrderForm: () => dispatch({ type: actionTypes.HIDE_ORDER_FORM }),
    setEditingOrder: (order) => dispatch({ type: actionTypes.SET_EDITING_ORDER, payload: order }),
    setShowOrderDetails: (show) => dispatch({ type: show ? actionTypes.SHOW_ORDER_DETAILS : actionTypes.HIDE_ORDER_DETAILS }),
    showOrderDetails: (order) => dispatch({ type: actionTypes.SHOW_ORDER_DETAILS, payload: order }),
    hideOrderDetails: () => dispatch({ type: actionTypes.HIDE_ORDER_DETAILS }),
    setSelectedOrder: (order) => dispatch({ type: actionTypes.SET_SELECTED_ORDER, payload: order }),
    setShowDataMigration: (show) => dispatch({ type: show ? actionTypes.SHOW_DATA_MIGRATION : actionTypes.HIDE_DATA_MIGRATION }),
    showDataMigration: () => dispatch({ type: actionTypes.SHOW_DATA_MIGRATION }),
    hideDataMigration: () => dispatch({ type: actionTypes.HIDE_DATA_MIGRATION }),
    setLoading: (loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }),
    setFinancialView: (view) => dispatch({ type: actionTypes.SET_FINANCIAL_VIEW, payload: view }),
    
    // Async actions
    loadOrders: async (userId) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true })
        const ordersData = await supabaseService.getServiceOrders(userId)
        dispatch({ type: actionTypes.SET_ORDERS, payload: ordersData })
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false })
      }
    },
    
    createOrder: async (orderData, userId) => {
      try {
        const newOrder = await supabaseService.createServiceOrder(orderData, userId)
        dispatch({ type: actionTypes.ADD_ORDER, payload: newOrder })
      } catch (error) {
        console.error('Error creating order:', error)
        alert('Error al crear la orden. Por favor, intenta de nuevo.')
        throw error
      }
    },
    
    updateOrderAsync: async (updatedOrder, userId) => {
      try {
        const updated = await supabaseService.updateServiceOrder(updatedOrder.id, updatedOrder, userId)
        dispatch({ type: actionTypes.UPDATE_ORDER, payload: updated })
      } catch (error) {
        console.error('Error updating order:', error)
        alert('Error al actualizar la orden. Por favor, intenta de nuevo.')
        throw error
      }
    },
    
    deleteOrderAsync: async (orderId, userId) => {
      try {
        await supabaseService.deleteServiceOrder(orderId, userId)
        dispatch({ type: actionTypes.DELETE_ORDER, payload: orderId })
      } catch (error) {
        console.error('Error deleting order:', error)
        alert('Error al eliminar la orden. Por favor, intenta de nuevo.')
        throw error
      }
    }
  }), [])

  return (
    <AppStateContext.Provider value={{ state, actions }}>
      {children}
    </AppStateContext.Provider>
  )
}

// El hook useAppState se ha movido a src/hooks/useAppState.js