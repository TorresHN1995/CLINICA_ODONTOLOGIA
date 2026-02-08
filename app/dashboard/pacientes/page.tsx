'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Eye, Phone, Mail, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Paciente {
  id: string
  identificacion: string
  nombre: string
  apellido: string
  fechaNacimiento: Date
  email: string | null
  telefono: string
  celular: string | null
  direccion: string | null
  ciudad: string | null
  createdAt: Date
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchPacientes()
  }, [page, search])

  const fetchPacientes = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/pacientes?page=${page}&limit=10&search=${search}`
      )
      const data = await response.json()
      
      if (response.ok) {
        setPacientes(data.pacientes)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast.error('Error al cargar pacientes')
      }
    } catch (error) {
      toast.error('Error al cargar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este paciente?')) return

    try {
      const response = await fetch(`/api/pacientes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Paciente eliminado exitosamente')
        fetchPacientes()
      } else {
        toast.error('Error al eliminar paciente')
      }
    } catch (error) {
      toast.error('Error al eliminar paciente')
    }
  }

  const calcularEdad = (fechaNacimiento: Date) => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Administra la información de tus pacientes
          </p>
        </div>
        <Link
          href="/dashboard/pacientes/nuevo"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Paciente</span>
        </Link>
      </div>

      {/* Barra de búsqueda */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, identificación, email o teléfono..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Tabla de Pacientes */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron pacientes</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Identificación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Edad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Contacto
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
                  {pacientes.map((paciente) => (
                    <tr key={paciente.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--accent))' }}>
                            <span className="text-white font-semibold">
                              {paciente.nombre[0]}{paciente.apellido[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {paciente.nombre} {paciente.apellido}
                            </div>
                            {paciente.ciudad && (
                              <div className="text-sm text-muted-foreground">
                                {paciente.ciudad}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{paciente.identificacion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {calcularEdad(paciente.fechaNacimiento)} años
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground space-y-1">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{paciente.telefono}</span>
                          </div>
                          {paciente.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{paciente.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(paciente.createdAt), "dd/MM/yyyy", { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/dashboard/pacientes/${paciente.id}`}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <Link
                            href={`/dashboard/pacientes/${paciente.id}/editar`}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(paciente.id)}
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-muted border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

