'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Pill,
  Heart,
  FileText,
  DollarSign,
  Clock,
  Upload,
  Trash2,
  Loader2,
  File
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/components/providers/ConfiguracionProvider'

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
  ocupacion: string | null
  contactoEmergencia: string | null
  telefonoEmergencia: string | null
  alergias: string | null
  medicamentos: string | null
  enfermedades: string | null
  observaciones: string | null
  createdAt: Date
  citas: any[]
  expedientes: any[]
  tratamientos: any[]
  facturas: any[]
}

export default function DetallePacientePage() {
  const { formatearMoneda } = useConfiguracion()
  const params = useParams()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [loading, setLoading] = useState(true)
  const [documentos, setDocumentos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchPaciente()
    fetchDocumentos()
  }, [params.id])

  const fetchPaciente = async () => {
    try {
      const response = await fetch(`/api/pacientes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPaciente(data)
      } else {
        toast.error('Error al cargar paciente')
      }
    } catch (error) {
      toast.error('Error al cargar paciente')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentos = async () => {
    try {
      const res = await fetch(`/api/documentos?pacienteId=${params.id}`)
      if (res.ok) setDocumentos(await res.json())
    } catch { /* silent */ }
  }

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)

      await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId: params.id,
          nombre: file.name,
          tipo: 'OTRO',
          url: uploadData.url,
          tamanio: file.size,
        }),
      })
      toast.success('Documento subido')
      fetchDocumentos()
    } catch {
      toast.error('Error al subir documento')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return
    try {
      await fetch(`/api/documentos?id=${id}`, { method: 'DELETE' })
      toast.success('Documento eliminado')
      fetchDocumentos()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Paciente no encontrado</p>
        <Link href="/dashboard/pacientes" className="text-primary-600 hover:underline mt-4 inline-block">
          Volver a Pacientes
        </Link>
      </div>
    )
  }

  const edad = differenceInYears(new Date(), new Date(paciente.fechaNacimiento))

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/pacientes"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--accent))' }}>
              <span className="text-white text-2xl font-bold">
                {paciente.nombre[0]}{paciente.apellido[0]}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {paciente.nombre} {paciente.apellido}
              </h1>
              <p className="text-muted-foreground mt-1">
                {edad} años • {paciente.identificacion}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/pacientes/${paciente.id}/editar`}
          className="btn-primary flex items-center space-x-2"
        >
          <Edit className="w-5 h-5" />
          <span>Editar</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda */}
        <div className="lg:col-span-1 space-y-6">
          {/* Información de Contacto */}
          <div className="card">
            <h2 className="text-lg font-bold text-foreground mb-4">Información de Contacto</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span>{paciente.telefono}</span>
              </div>
              {paciente.celular && (
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span>{paciente.celular}</span>
                </div>
              )}
              {paciente.email && (
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span>{paciente.email}</span>
                </div>
              )}
              {paciente.direccion && (
                <div className="flex items-start space-x-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                  <span>{paciente.direccion}, {paciente.ciudad}</span>
                </div>
              )}
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span>
                  {format(new Date(paciente.fechaNacimiento), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
            </div>
          </div>

          {/* Contacto de Emergencia */}
          {(paciente.contactoEmergencia || paciente.telefonoEmergencia) && (
            <div className="card bg-red-50 border-red-200">
              <h2 className="text-lg font-bold text-red-900 mb-4">Contacto de Emergencia</h2>
              <div className="space-y-2">
                {paciente.contactoEmergencia && (
                  <p className="text-red-800 font-medium">{paciente.contactoEmergencia}</p>
                )}
                {paciente.telefonoEmergencia && (
                  <p className="text-red-700">{paciente.telefonoEmergencia}</p>
                )}
              </div>
            </div>
          )}

          {/* Historia Médica */}
          <div className="card">
            <h2 className="text-lg font-bold text-foreground mb-4">Historia Médica</h2>
            <div className="space-y-4">
              {paciente.alergias && (
                <div>
                  <div className="flex items-center space-x-2 text-red-600 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Alergias</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">{paciente.alergias}</p>
                </div>
              )}
              {paciente.medicamentos && (
                <div>
                  <div className="flex items-center space-x-2 text-blue-600 mb-2">
                    <Pill className="w-5 h-5" />
                    <span className="font-semibold">Medicamentos</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">{paciente.medicamentos}</p>
                </div>
              )}
              {paciente.enfermedades && (
                <div>
                  <div className="flex items-center space-x-2 text-orange-600 mb-2">
                    <Heart className="w-5 h-5" />
                    <span className="font-semibold">Enfermedades</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">{paciente.enfermedades}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Citas</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{paciente.citas.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-300" />
              </div>
            </div>
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Expedientes</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{paciente.expedientes.length}</p>
                </div>
                <FileText className="w-8 h-8 text-green-300" />
              </div>
            </div>
            <div className="card bg-purple-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Tratamientos</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{paciente.tratamientos.length}</p>
                </div>
                <Heart className="w-8 h-8 text-purple-300" />
              </div>
            </div>
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Facturas</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{paciente.facturas.length}</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-300" />
              </div>
            </div>
          </div>

          {/* Últimas Citas */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Últimas Citas</h2>
              <Link
                href={`/dashboard/citas?paciente=${paciente.id}`}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Ver todas →
              </Link>
            </div>
            {paciente.citas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hay citas registradas</p>
            ) : (
              <div className="space-y-3">
                {paciente.citas.slice(0, 5).map((cita: any) => (
                  <div key={cita.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{cita.tipoCita}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(cita.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        {' • '}
                        {cita.horaInicio} - {cita.horaFin}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Dr. {cita.odontologo.nombre} {cita.odontologo.apellido}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${cita.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                      cita.estado === 'PROGRAMADA' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {cita.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tratamientos Activos */}
          {paciente.tratamientos.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tratamientos</h2>
                <Link
                  href={`/dashboard/tratamientos?paciente=${paciente.id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Ver todos →
                </Link>
              </div>
              <div className="space-y-3">
                {paciente.tratamientos.slice(0, 3).map((tratamiento: any) => (
                  <div key={tratamiento.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">{tratamiento.nombre}</p>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${tratamiento.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                        tratamiento.estado === 'EN_PROGRESO' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {tratamiento.estado}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{tratamiento.descripcion}</p>
                    <p className="text-sm font-semibold text-primary-600 mt-2">
                      {formatearMoneda(tratamiento.costoTotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentos */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Documentos</h2>
              <label className="btn-primary flex items-center space-x-2 cursor-pointer text-sm">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{uploading ? 'Subiendo...' : 'Subir'}</span>
                <input type="file" className="hidden" onChange={handleUploadDoc} disabled={uploading}
                  accept="image/*,.pdf" />
              </label>
            </div>
            {documentos.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hay documentos</p>
            ) : (
              <div className="space-y-2">
                {documentos.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-medium text-primary-600 hover:underline">{doc.nombre}</a>
                        <p className="text-xs text-muted-foreground">{doc.tipo} · {(doc.tamanio / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

