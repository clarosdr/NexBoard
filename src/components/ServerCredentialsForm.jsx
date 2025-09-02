import React, { useState, useEffect } from 'react'
import Button from './ui/Button'

export default function ServerCredentialsForm({ credential, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    client: '', // Empresa
    server_name: '', // Nombre del Servidor
    vpnIp: '', // IP VPN
    localName: '', // Nombre local
    notes: '', // Notas
    passVpn: '' // Pass VPN (solo para entrada; se mapeará a 'password' en el payload)
  })
  const [users, setUsers] = useState([{ username: '', password: '' }]) // Usuarios
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (credential) {
      setFormData(prev => ({
        ...prev,
        client: credential.client || '',
        server_name: credential.server_name || '',
        vpnIp: credential.vpnIp || '',
        localName: credential.localName || '',
        notes: credential.notes || '',
        passVpn: '' // Por seguridad no prellenamos el password
      }))
      setUsers(Array.isArray(credential.users) && credential.users.length > 0
        ? credential.users.map(u => ({ username: u.username || '', password: '' }))
        : [{ username: '', password: '' }]
      )
    }
  }, [credential])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleUserChange = (index, field, value) => {
    setUsers(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u))
  }

  const addUser = () => setUsers(prev => [...prev, { username: '', password: '' }])
  const removeUser = (index) => setUsers(prev => prev.filter((_, i) => i !== index))

  const validate = () => {
    if (!formData.client.trim()) { alert('La Empresa es requerida'); return false }
    if (!formData.server_name.trim()) { alert('El Nombre del Servidor es requerido'); return false }
    if (!formData.passVpn.trim()) { alert('El Pass VPN es requerido'); return false }
    if (!formData.vpnIp.trim()) { alert('La IP VPN es requerida'); return false }
    if (!formData.localName.trim()) { alert('El Nombre local es requerido'); return false }
    if (!formData.notes.trim()) { alert('Las Notas son requeridas'); return false }
    if (!users.length) { alert('Debe agregar al menos un usuario'); return false }
    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      if (!u.username.trim()) { alert(`El usuario #${i + 1} requiere nombre de usuario`); return false }
      if (!u.password.trim()) { alert(`El usuario #${i + 1} requiere contraseña`); return false }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = {
        client: formData.client.trim(),
        server_name: formData.server_name.trim(),
        vpnIp: formData.vpnIp.trim(),
        localName: formData.localName.trim(),
        notes: formData.notes.trim(),
        users: users.map(u => ({ username: u.username.trim(), password: u.password }))
      }
      // Mapear Pass VPN al campo 'password' para que el servicio lo encripte (no guardamos texto plano)
      if (formData.passVpn.trim()) {
        payload.password = formData.passVpn.trim()
      }

      await onSubmit?.(payload)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Empresa *
          </label>
          <input
            type="text"
            id="client"
            name="client"
            placeholder="Ej: ACME S.A.S."
            value={formData.client}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="server_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del Servidor *
          </label>
          <input
            type="text"
            id="server_name"
            name="server_name"
            placeholder="Ej: Servidor Web Principal"
            value={formData.server_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="passVpn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pass VPN *
          </label>
          <input
            type="password"
            id="passVpn"
            name="passVpn"
            placeholder="Contraseña de la VPN"
            value={formData.passVpn}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono"
          />
        </div>

        <div>
          <label htmlFor="vpnIp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            IP VPN *
          </label>
          <input
            type="text"
            id="vpnIp"
            name="vpnIp"
            placeholder="192.168.1.100"
            value={formData.vpnIp}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono"
          />
        </div>

        <div>
          <label htmlFor="localName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre local *
          </label>
          <input
            type="text"
            id="localName"
            name="localName"
            placeholder="Ej: Servidor Local Oficina"
            value={formData.localName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Usuarios *
          </label>
          <div className="space-y-3">
            {users.map((u, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Usuario</label>
                  <input
                    type="text"
                    value={u.username}
                    onChange={(e) => handleUserChange(idx, 'username', e.target.value)}
                    placeholder="Nombre de usuario"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={u.password}
                    onChange={(e) => handleUserChange(idx, 'password', e.target.value)}
                    placeholder="Contraseña del usuario"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                  />
                </div>
                <div className="md:col-span-1 flex md:justify-end">
                  <button
                    type="button"
                    onClick={() => removeUser(idx)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    aria-label="Eliminar usuario"
                    disabled={users.length === 1}
                    title={users.length === 1 ? 'Debe haber al menos un usuario' : 'Eliminar usuario'}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            <div>
              <button
                type="button"
                onClick={addUser}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                + Agregar usuario
              </button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas *
          </label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Información adicional sobre el servidor..."
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            required
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
