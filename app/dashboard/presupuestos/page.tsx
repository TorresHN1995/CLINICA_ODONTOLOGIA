'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseFechaLocal } from '@/lib/fecha'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'

interface Presupuesto {
  id: string
  numero: string
  fecha: string
  total: number
  estado: string
  validoHasta: string | null
  paciente: { nombre: string; apellido: string; identificacion: string }
  _count?: { items: number }
}

const ESTADOS = ['PROPUESTO', 'APROBADO', 'RECHAZADO', 'FACTURADO', 'VENCIDO']

const colorEstado = (estado: string) => {
  switch (estado) {
    case 'PROPUESTO':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    case 'APROBADO':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'RECHAZADO':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    case 'FACTURADO':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
    case 'VENCIDO':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function PresupuestosPage() {
  const { data: config } = useConfiguracion()
  const moneda = config?.simboloMoneda || 'L.'
  const fmt = (n: number) => `${moneda} ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true)
        const url = filtroEstado ? `/api/presupuestos?estado=${filtroEstado}` : '/api/presupuestos'
        const res = await fetch(url)
        if (!res.ok) {
          toast.error('Error al cargar presupuestos')
          return
        }
        const data = await res.json()
        setPresupuestos(data.presupuestos || [])
      } catch {
        toast.error('Error al cargar presupuestos')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [filtroEstado])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Presupuestos</h1>
          <p className="text-muted-foreground mt-1">Cotizaciones de tratamiento para aprobación del paciente</p>
        </div>
        <Link href="/dashboard/presupuestos/nuevo" className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Nuevo Presupuesto</span>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltroEstado('')}
          className={`px-3 py-1.5 rounded-lg text-sm border ${filtroEstado === '' ? 'bg-muted border-border font-medium' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${filtroEstado === e ? 'bg-muted border-border font-medium' : 'border-border text-muted-foreground hover:bg-muted'}`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Cargando...</div>
        ) : presupuestos.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No hay presupuestos {filtroEstado && `en estado ${filtroEstado}`}.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 px-3 font-semibold">Número</th>
                <th className="py-3 px-3 font-semibold">Paciente</th>
                <th className="py-3 px-3 font-semibold">Fecha</th>
                <th className="py-3 px-3 font-semibold">Válido hasta</th>
                <th className="py-3 px-3 font-semibold text-right">Total</th>
                <th className="py-3 px-3 font-semibold text-center">Estado</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted">
                  <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">{p.numero}</td>
                  <td className="py-3 px-3 text-foreground">
                    {p.paciente.nombre} {p.paciente.apellido}
                    <span className="block text-xs text-muted-foreground">{p.paciente.identificacion}</span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {format(new Date(p.fecha), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {p.validoHasta ? format(parseFechaLocal(p.validoHasta), 'dd/MM/yyyy', { locale: es }) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-foreground">{fmt(p.total)}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorEstado(p.estado)}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link href={`/dashboard/presupuestos/${p.id}`} className="inline-flex items-center gap-1 text-sm hover:underline" style={{ color: 'rgb(var(--accent))' }}>
                      <Eye className="w-4 h-4" /> Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
