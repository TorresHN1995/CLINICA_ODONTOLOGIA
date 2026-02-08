'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Plus, Edit, Trash2, Eye, Mail, Phone, Shield, X, Loader2, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono: string | null
  rol: string
  activo: boolean
  createdAt: Date
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    rol: '',
    password: '',
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usuarios')
      const data = await response.json()

      if (response.ok) {
        setUsuarios(data.usuarios || [])
      } else {
        toast.error('Error al cargar usuarios')
      }
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Usuario eliminado exitosamente')
        fetchUsuarios()
      } else {
        toast.error('Error al eliminar usuario')
      }
    } catch (error) {
      toast.error('Error al eliminar usuario')
    }
  }

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      })

      if (response.ok) {
        toast.success('Estado actualizado')
        fetchUsuarios()
      } else {
        toast.error('Error al actualizar estado')
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      setSaving(true)
      const payload: any = {
        nombre: editForm.nombre,
        apellido: editForm.apellido,
        telefono: editForm.telefono || null,
        rol: editForm.rol,
      }
      if (editForm.password) {
        payload.password = editForm.password
      }
      const response = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        toast.success('Usuario actualizado correctamente')
        setShowEditModal(false)
        setEditingUser(null)
        fetchUsuarios()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error al actualizar usuario')
    } finally {
      setSaving(false)
    }
  }

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'bg-red-100 text-red-800'
      case 'ODONTOLOGO':
        return 'bg-blue-100 text-blue-800'
      case 'ASISTENTE':
        return 'bg-green-100 text-green-800'
      case 'RECEPCION':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'Administrador'
      case 'ODONTOLOGO':
        return 'Odontólogo'
      case 'ASISTENTE':
        return 'Asistente'
      case 'RECEPCION':
        return 'Recepción'
      default:
        return rol
    }
  }

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre.toLowerCase().includes(search.toLowerCase()) ||
    usuario.apellido.toLowerCase().includes(search.toLowerCase()) ||
    usuario.email.toLowerCase().includes(search.toLowerCase()) ||
    usuario.rol.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra los usuarios y permisos del sistema
          </p>
        </div>
        <Link
          href="/dashboard/usuarios/nuevo"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Usuario</span>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Administradores</p>
              <p className="text-3xl font-bold mt-2">
                {usuarios.filter(u => u.rol === 'ADMINISTRADOR').length}
              </p>
            </div>
            <Shield className="w-12 h-12 text-red-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Odontólogos</p>
              <p className="text-3xl font-bold mt-2">
                {usuarios.filter(u => u.rol === 'ODONTOLOGO').length}
              </p>
            </div>
            <Shield className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Asistentes</p>
              <p className="text-3xl font-bold mt-2">
                {usuarios.filter(u => u.rol === 'ASISTENTE').length}
              </p>
            </div>
            <Shield className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Recepción</p>
              <p className="text-3xl font-bold mt-2">
                {usuarios.filter(u => u.rol === 'RECEPCION').length}
              </p>
            </div>
            <Shield className="w-12 h-12 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="card">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--accent))' }}>
                          <span className="text-white font-semibold">
                            {usuario.nombre[0]}{usuario.apellido[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {usuario.nombre} {usuario.apellido}
                          </div>
                          {usuario.telefono && (
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {usuario.telefono}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                        {usuario.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRolColor(usuario.rol)}`}>
                        {getRolLabel(usuario.rol)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActivo(usuario.id, usuario.activo)}
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full transition-colors ${usuario.activo
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(usuario.createdAt), "dd/MM/yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(usuario)
                            setEditForm({
                              nombre: usuario.nombre,
                              apellido: usuario.apellido,
                              telefono: usuario.telefono || '',
                              rol: usuario.rol,
                              password: '',
                            })
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(usuario)
                            setEditForm({
                              nombre: usuario.nombre,
                              apellido: usuario.apellido,
                              telefono: usuario.telefono || '',
                              rol: usuario.rol,
                              password: '',
                            })
                            setShowEditModal(true)
                          }}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Editar Usuario */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">Editar Usuario</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre</label>
                  <input type="text" required className="input-field" value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
                </div>
                <div>
                  <label className="label">Apellido</label>
                  <input type="text" required className="input-field" value={editForm.apellido}
                    onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input type="text" className="input-field" value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input-field" value={editForm.rol}
                  onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}>
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="ODONTOLOGO">Odontólogo</option>
                  <option value="ASISTENTE">Asistente</option>
                  <option value="RECEPCION">Recepción</option>
                </select>
              </div>
              <div>
                <label className="label flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Nueva Contraseña (dejar vacío para no cambiar)</span>
                </label>
                <input type="password" className="input-field" placeholder="••••••••" value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center space-x-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
