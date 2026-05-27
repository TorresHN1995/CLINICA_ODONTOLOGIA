'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Search, ChevronLeft, ChevronRight, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface RegistroAuditoria {
  id: string
  fecha: string
  accion: string
  entidad: string
  entidadId: string | null
  descripcion: string
  datos: any
  usuarioId: string | null
  usuarioNombre: string | null
  ip: string | null
}

const ACCIONES = ['CREAR', 'ACTUALIZAR', 'ANULAR', 'ELIMINAR', 'EXPORTAR', 'LIMPIAR', 'OTRO']

const colorAccion = (accion: string) => {
  switch (accion) {
    case 'CREAR':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'ACTUALIZAR':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    case 'ANULAR':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'ELIMINAR':
    case 'LIMPIAR':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    case 'EXPORTAR':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [entidades, setEntidades] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filtros
  const [search, setSearch] = useState('')
  const [entidad, setEntidad] = useState('')
  const [accion, setAccion] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      const qs = new URLSearchParams()
      qs.set('page', String(page))
      if (search) qs.set('search', search)
      if (entidad) qs.set('entidad', entidad)
      if (accion) qs.set('accion', accion)
      if (fechaInicio) qs.set('fechaInicio', fechaInicio)
      if (fechaFin) qs.set('fechaFin', fechaFin)

      const res = await fetch(`/api/auditoria?${qs.toString()}`)
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('No tienes permisos para ver la auditoría')
        } else {
          toast.error('Error al cargar la auditoría')
        }
        setRegistros([])
        return
      }
      const data = await res.json()
      setRegistros(data.registros || [])
      setEntidades(data.entidades || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (error) {
      toast.error('Error al cargar la auditoría')
    } finally {
      setLoading(false)
    }
  }, [page, search, entidad, accion, fechaInicio, fechaFin])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Al cambiar un filtro, volver a la primera página
  const onFiltro = (setter: (v: string) => void) => (v: string) => {
    setPage(1)
    setter(v)
  }

  const limpiarFiltros = () => {
    setPage(1)
    setSearch('')
    setEntidad('')
    setAccion('')
    setFechaInicio('')
    setFechaFin('')
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" style={{ color: 'rgb(var(--accent))' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bitácora de Auditoría</h1>
          <p className="text-muted-foreground mt-1">
            Registro de acciones sensibles del sistema ({total} registros)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <label className="label">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Descripción..."
                value={search}
                onChange={(e) => onFiltro(setSearch)(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Entidad</label>
            <select className="input-field" value={entidad} onChange={(e) => onFiltro(setEntidad)(e.target.value)}>
              <option value="">Todas</option>
              {entidades.map((ent) => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Acción</label>
            <select className="input-field" value={accion} onChange={(e) => onFiltro(setAccion)(e.target.value)}>
              <option value="">Todas</option>
              {ACCIONES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input-field" value={fechaInicio} onChange={(e) => onFiltro(setFechaInicio)(e.target.value)} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input-field" value={fechaFin} onChange={(e) => onFiltro(setFechaFin)(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={limpiarFiltros} className="text-sm text-muted-foreground hover:text-foreground">
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Cargando...</div>
        ) : registros.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No hay registros de auditoría que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 px-3 font-semibold">Fecha</th>
                <th className="py-3 px-3 font-semibold">Usuario</th>
                <th className="py-3 px-3 font-semibold">Acción</th>
                <th className="py-3 px-3 font-semibold">Entidad</th>
                <th className="py-3 px-3 font-semibold">Descripción</th>
                <th className="py-3 px-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-muted">
                  <td className="py-3 px-3 whitespace-nowrap text-foreground">
                    {format(new Date(r.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {r.usuarioNombre || 'Sistema'}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorAccion(r.accion)}`}>
                      {r.accion}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-foreground">{r.entidad}</td>
                  <td className="py-3 px-3 text-foreground">{r.descripcion}</td>
                  <td className="py-3 px-3 whitespace-nowrap text-muted-foreground">{r.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg border border-border text-foreground disabled:opacity-40 hover:bg-muted flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded-lg border border-border text-foreground disabled:opacity-40 hover:bg-muted flex items-center gap-1"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
