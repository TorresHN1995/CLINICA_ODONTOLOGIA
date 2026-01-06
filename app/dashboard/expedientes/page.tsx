'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Eye, FileText, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Expediente {
  id: string
  fecha: Date
  diagnostico: string
  tratamiento: string
  evolucion: string | null
  proximaCita: Date | null
  paciente: {
    nombre: string
    apellido: string
    identificacion: string
  }
  procedimientos: any[]
}

export default function ExpedientesPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchExpedientes()
  }, [])

  const fetchExpedientes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/expedientes')
      const data = await response.json()
      
      if (response.ok) {
        setExpedientes(data)
      } else {
        toast.error('Error al cargar expedientes')
      }
    } catch (error) {
      toast.error('Error al cargar expedientes')
    } finally {
      setLoading(false)
    }
  }

  const expedientesFiltrados = expedientes.filter(exp => 
    exp.paciente.nombre.toLowerCase().includes(search.toLowerCase()) ||
    exp.paciente.apellido.toLowerCase().includes(search.toLowerCase()) ||
    exp.paciente.identificacion.includes(search) ||
    exp.diagnostico.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expedientes Clínicos</h1>
          <p className="text-gray-600 mt-1">
            Historial médico y odontológico de los pacientes
          </p>
        </div>
        <Link
          href="/dashboard/expedientes/nuevo"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Expediente</span>
        </Link>
      </div>

      {/* Barra de búsqueda */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar expedientes por paciente o diagnóstico..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Expedientes */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : expedientesFiltrados.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron expedientes</p>
          </div>
        ) : (
          expedientesFiltrados.map((expediente) => (
            <div key={expediente.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {expediente.paciente.nombre} {expediente.paciente.apellido}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {expediente.paciente.identificacion}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Diagnóstico:</span>
                      <p className="text-sm text-gray-600 mt-1">{expediente.diagnostico}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Tratamiento:</span>
                      <p className="text-sm text-gray-600 mt-1">{expediente.tratamiento}</p>
                    </div>

                    {expediente.evolucion && (
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Evolución:</span>
                        <p className="text-sm text-gray-600 mt-1">{expediente.evolucion}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Fecha: {format(new Date(expediente.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </span>
                    </div>
                    {expediente.proximaCita && (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Próxima cita: {format(new Date(expediente.proximaCita), "d 'de' MMMM", { locale: es })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{expediente.procedimientos.length} procedimientos</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/expedientes/${expediente.id}`}
                  className="ml-4 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-6 h-6" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

