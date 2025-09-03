import { useContext } from 'react'
import { AppStateContext } from '../contexts/AppStateContext'

// Hook personalizado
export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}