'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Plus, Edit, Trash2, Eye, Mail, Phone, Calendar, TrendingUp, Users as UsersIcon } from 'lucide-react'

interface Odontologo {
  id: string
  email: string
  username: string
  nombre: string
  apellido: string
  telefono: string | null
  activo: boolean
  createdAt: Date
  _count?: {
    citas: number
    procedimientos: number
  }
}

export default function OdontologosPage() {
  const [odontologos, setOdontologos] = useState<Odontologo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOdontologos()
  }, [])

  const fetchOdontologos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usuarios?rol=ODONTOLOGO')
      const data = await response.json()

      if (response.ok) {
        setOdontologos(data.usuarios || [])
      } else {
        toast.error('Error al cargar odontólogos')
      }
    } catch (error) {
      toast.error('Error al cargar odontólogos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este odontólogo?')) return

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Odontólogo eliminado exitosamente')
        fetchOdontologos()
      } else {
        toast.error('Error al eliminar odontólogo')
      }
    } catch (error) {
      toast.error('Error al eliminar odontólogo')
    }
  }

  const filteredOdontologos = odontologos.filter(odontologo =>
    `${odontologo.nombre} ${odontologo.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
    odontologo.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Odontólogos</h1>
          <p className="text-muted-foreground mt-1">Gestión de profesionales odontológicos</p>
        </div>
        <Link
          href="/dashboard/odontologos/nuevo"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Odontólogo
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Odontólogos</p>
              <p className="text-3xl font-bold mt-2 text-foreground">{odontologos.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Activos</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {odontologos.filter(o => o.activo).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Inactivos</p>
              <p className="text-3xl font-bold mt-2 text-red-600">
                {odontologos.filter(o => !o.activo).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Odontólogo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOdontologos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No hay odontólogos registrados
                  </td>
                </tr>
              ) : (
                filteredOdontologos.map((odontologo) => (
                  <tr key={odontologo.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {odontologo.nombre[0]}{odontologo.apellido[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            Dr. {odontologo.nombre} {odontologo.apellido}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{odontologo.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-4 h-4 mr-2" />
                          {odontologo.email}
                        </div>
                        {odontologo.telefono && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="w-4 h-4 mr-2" />
                            {odontologo.telefono}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          odontologo.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {odontologo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/dashboard/odontologos/${odontologo.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/usuarios`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(odontologo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
