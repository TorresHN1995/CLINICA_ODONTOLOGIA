'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Mail, Phone, Calendar, TrendingUp, Users, DollarSign, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Odontologo {
  id: string
  email: string
  username: string
  nombre: string
  apellido: string
  telefono: string | null
  activo: boolean
  createdAt: Date
}

interface Cita {
  id: string
  fecha: Date
  horaInicio: string
  horaFin: string
  tipoCita: string
  estado: string
  paciente: {
    nombre: string
    apellido: string
  }
}

export default function OdontologoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [odontologo, setOdontologo] = useState<Odontologo | null>(null)
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCitas: 0,
    citasCompletadas: 0,
    citasPendientes: 0,
    pacientesAtendidos: 0,
  })

  useEffect(() => {
    if (params.id) {
      fetchOdontologo()
      fetchCitas()
    }
  }, [params.id])

  const fetchOdontologo = async () => {
    try {
      const response = await fetch(`/api/usuarios/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setOdontologo(data.usuario)
      } else {
        toast.error('Error al cargar odontólogo')
        router.push('/dashboard/odontologos')
      }
    } catch (error) {
      toast.error('Error al cargar odontólogo')
    } finally {
      setLoading(false)
    }
  }

  const fetchCitas = async () => {
    try {
      const response = await fetch(`/api/citas?odontologoId=${params.id}`)
      const data = await response.json()

      if (response.ok) {
        const citasData = data.citas || []
        setCitas(citasData.slice(0, 10))

        // Calcular estadísticas
        const completadas = citasData.filter((c: Cita) => c.estado === 'COMPLETADA').length
        const pendientes = citasData.filter((c: Cita) => 
          c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA'
        ).length
        const pacientesUnicos = new Set(citasData.map((c: Cita) => c.paciente)).size

        setStats({
          totalCitas: citasData.length,
          citasCompletadas: completadas,
          citasPendientes: pendientes,
          pacientesAtendidos: pacientesUnicos,
        })
      }
    } catch (error) {
      console.error('Error al cargar citas:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!odontologo) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/odontologos"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dr. {odontologo.nombre} {odontologo.apellido}
          </h1>
          <p className="text-muted-foreground mt-1">Perfil del odontólogo</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-3xl text-blue-600 font-bold">
                {odontologo.nombre[0]}{odontologo.apellido[0]}
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Dr. {odontologo.nombre} {odontologo.apellido}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {odontologo.email}
                </div>
                {odontologo.telefono && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {odontologo.telefono}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    odontologo.activo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {odontologo.activo ? 'Activo' : 'Inactivo'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Registrado: {format(new Date(odontologo.createdAt), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Citas</p>
              <p className="text-3xl font-bold mt-2 text-foreground">{stats.totalCitas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Completadas</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats.citasCompletadas}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Pendientes</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">{stats.citasPendientes}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Pacientes</p>
              <p className="text-3xl font-bold mt-2 text-purple-600">{stats.pacientesAtendidos}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Citas Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {citas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No hay citas registradas
                  </td>
                </tr>
              ) : (
                citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm text-foreground">
                      {format(new Date(cita.fecha), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {cita.horaInicio}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {cita.paciente.nombre} {cita.paciente.apellido}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {cita.tipoCita}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cita.estado === 'COMPLETADA'
                            ? 'bg-green-100 text-green-800'
                            : cita.estado === 'PROGRAMADA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {cita.estado}
                      </span>
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
