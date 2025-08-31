import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from './ui/Button'

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function ServerCredentialsForm({ credential, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    serverName: '',
    ipAddress: '',
    username: '',
    password: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (credential) {
      setFormData({
        serverName: credential.serverName || '',
        ipAddress: credential.ipAddress || '',
        username: credential.username || '',
        password: credential.password || '',
        notes: credential.notes || ''
      })
    }
  }, [credential])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!formData.serverName.trim()) {
      alert('El nombre del servidor es requerido')
      return
    }

    setIsSubmitting(true)

    try {
      const credentialData = {
        ...formData,
        id: credential ? credential.id : generateUUID(),
        created_at: credential ? credential.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      let error
      if (credential) {
        ({ error } = await supabase
          .from('server_credentials')
          .update(credentialData)
          .eq('id', credential.id))
      } else {
        ({ error } = await supabase
          .from('server_credentials')
          .insert([credentialData]))
      }

      if (error) {
        console.error('Error al guardar en Supabase:', error.message)
        alert(`No se pudo guardar la credencial: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      alert('Credencial guardada correctamente ✅')
      if (onSubmit) onSubmit(credentialData)

    } catch (err) {
      console.error('Error inesperado:', err)
      alert('Ocurrió un error inesperado')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="serverName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del servidor *
          </label>
          <input
            type="text"
            id="serverName"
            name="serverName"
            placeholder="Ej: Servidor Web Principal, Base de Datos"
            value={formData.serverName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dirección IP *
          </label>
          <input
            type="text"
            id="ipAddress"
            name="ipAddress"
            placeholder="192.168.1.100 o servidor.ejemplo.com"
            value={formData.ipAddress}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono"
          />
        </div>
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Usuario *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Nombre de usuario del servidor"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
           <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             Contraseña *
           </label>
           <input
             type="password"
             id="password"
             name="password"
             placeholder="Contraseña del servidor"
             value={formData.password}
             onChange={handleChange}
             required
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono"
           />
         </div>
         
         <div>
           <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             Notas adicionales
           </label>
           <textarea
             id="notes"
             name="notes"
             placeholder="Información adicional sobre el servidor..."
             value={formData.notes}
             onChange={handleChange}
             rows="3"
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
           />
         </div>
       </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            variant="secondary"
            size="lg"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          variant="primary"
          size="lg"
        >
          {isSubmitting ? 'Guardando...' : (credential ? 'Actualizar Credenciales' : 'Guardar Credenciales')}
        </Button>
      </div>
    </form>
  )
}
