import React, { createContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({})

// Función para generar UUID simple
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (isSupabaseConfigured()) {
      // Usar Supabase Auth si está configurado
      const getInitialSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          console.log('🔍 getInitialSession - Session obtenida:', session)
          console.log('🔍 getInitialSession - User ID:', session?.user?.id)
          if (error) {
            console.error('Error getting session:', error)
          } else {
            setSession(session)
            setUser(session?.user ?? null)
            console.log('✅ Session y User establecidos correctamente')
          }
        } catch (error) {
          console.error('Supabase auth error:', error)
        }
        setLoading(false)
      }

      getInitialSession()

      // Escuchar cambios de autenticación
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state changed:', event)
          console.log('🔄 Nueva session:', session)
          console.log('🔄 User ID en nueva session:', session?.user?.id)
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => {
        subscription?.unsubscribe()
      }
    } else {
      // Usar localStorage como fallback
      const savedUser = localStorage.getItem('nexboard-user')
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setUser(userData)
          setSession({ user: userData })
        } catch (error) {
          console.error('Error parsing saved user:', error)
          localStorage.removeItem('nexboard-user')
        }
      }
      setLoading(false)
    }
  }, [])

  // Función para iniciar sesión
  const signIn = async (email, password) => {
    if (isSupabaseConfigured()) {
      try {
        setLoading(true)
        console.log('🔐 Intentando login con email:', email)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        console.log('🔐 Respuesta de signInWithPassword:', { data, error })
        console.log('🔐 User ID obtenido:', data?.user?.id)
        console.log('🔐 Session obtenida:', data?.session)

        if (error) {
          throw error
        }

        return { data, error: null }
      } catch (error) {
        console.error('❌ Error signing in:', error)
        return { data: null, error }
      } finally {
        setLoading(false)
      }
    } else {
      // Modo demo - cualquier email/password funciona
      setLoading(true)
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const demoUser = {
        id: generateUUID(),
        email: email,
        created_at: new Date().toISOString(),
        user_metadata: {
          email: email,
          full_name: email.split('@')[0]
        }
      }
      
      setUser(demoUser)
      setSession({ user: demoUser })
      localStorage.setItem('nexboard-user', JSON.stringify(demoUser))
      setLoading(false)
      
      return { data: { user: demoUser, session: { user: demoUser } }, error: null }
    }
  }

  // Función para registrarse
  const signUp = async (email, password, metadata = {}) => {
    if (isSupabaseConfigured()) {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        })

        if (error) {
          throw error
        }

        return { data, error: null }
      } catch (error) {
        console.error('Error signing up:', error)
        return { data: null, error }
      } finally {
        setLoading(false)
      }
    } else {
      // Modo demo - crear usuario automáticamente
      setLoading(true)
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const demoUser = {
        id: generateUUID(),
        email: email,
        created_at: new Date().toISOString(),
        user_metadata: {
          email: email,
          full_name: metadata.full_name || email.split('@')[0],
          ...metadata
        }
      }
      
      setUser(demoUser)
      setSession({ user: demoUser })
      localStorage.setItem('nexboard-user', JSON.stringify(demoUser))
      setLoading(false)
      
      return { data: { user: demoUser, session: { user: demoUser } }, error: null }
    }
  }

  // Función para cerrar sesión
  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        setLoading(true)
        // Limpiar estado local primero
        setUser(null)
        setSession(null)
        localStorage.removeItem('nexboard-user')
        
        // Intentar logout en Supabase (no crítico si falla)
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch (supabaseError) {
          console.warn('Supabase logout failed (non-critical):', supabaseError)
          // Continuar con el logout local exitoso
        }
      } catch (error) {
        console.error('Error signing out:', error)
        // Asegurar que el estado local se limpie incluso si hay errores
        setUser(null)
        setSession(null)
        localStorage.removeItem('nexboard-user')
      } finally {
        setLoading(false)
      }
    } else {
      // Modo demo - limpiar localStorage
      setUser(null)
      setSession(null)
      localStorage.removeItem('nexboard-user')
    }
  }

  // Función para restablecer contraseña
  const resetPassword = async (email) => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
          throw error
        }

        return { data, error: null }
      } catch (error) {
        console.error('Error resetting password:', error)
        return { data: null, error }
      }
    } else {
      // Modo demo - simular éxito
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { 
        data: { message: 'Password reset email sent (demo mode)' }, 
        error: null 
      }
    }
  }

  // Función para actualizar contraseña
  const updatePassword = async (password) => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: password
        })

        if (error) {
          throw error
        }

        return { data, error: null }
      } catch (error) {
        console.error('Error updating password:', error)
        return { data: null, error }
      }
    } else {
      // Modo demo - simular éxito
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { 
        data: { message: 'Password updated (demo mode)' }, 
        error: null 
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isSupabaseConfigured: isSupabaseConfigured()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext