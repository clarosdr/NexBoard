import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (credential) {
      setFormData({
        serverName: credential.serverName || '',
        ipAddress: credential.ipAddress || '',
        username: credential.username || '',
        password: credential.password || ''
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
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* ... tu JSX original para inputs */}
    </form>
  )
}
