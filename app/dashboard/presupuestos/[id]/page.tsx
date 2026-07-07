'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, FileText, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseFechaLocal } from '@/lib/fecha'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'

interface Item {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  tasaIsv: number
}

interface Presupuesto {
  id: string
  numero: string
  fecha: string
  validoHasta: string | null
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  estado: string
  observaciones: string | null
  facturaId: string | null
  creadoPorNombre: string | null
  paciente: { id: string; nombre: string; apellido: string; identificacion: string; telefono: string }
  items: Item[]
}

const colorEstado = (estado: string) => {
  switch (estado) {
    case 'PROPUESTO': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    case 'APROBADO': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'RECHAZADO': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    case 'FACTURADO': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

export default function PresupuestoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { data: config } = useConfiguracion()
  const moneda = config?.simboloMoneda || 'L.'
  const fmt = (n: number) => `${moneda} ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [loading, setLoading] = useState(true)
  const accionEnCurso = useRef(false)

  const cargar = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/presupuestos/${id}`)
      if (!res.ok) {
        toast.error('No se encontró el presupuesto')
        router.push('/dashboard/presupuestos')
        return
      }
      setPresupuesto(await res.json())
    } catch {
      toast.error('Error al cargar el presupuesto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const cambiarEstado = async (estado: string) => {
    if (accionEnCurso.current) return
    accionEnCurso.current = true
    try {
      const res = await fetch(`/api/presupuestos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al actualizar')
        return
      }
      toast.success('Presupuesto actualizado')
      cargar()
    } catch {
      toast.error('Error al actualizar')
    } finally {
      accionEnCurso.current = false
    }
  }

  const eliminar = async () => {
    if (!confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.')) return
    if (accionEnCurso.current) return
    accionEnCurso.current = true
    try {
      const res = await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al eliminar')
        accionEnCurso.current = false
        return
      }
      toast.success('Presupuesto eliminado')
      router.push('/dashboard/presupuestos')
    } catch {
      toast.error('Error al eliminar')
      accionEnCurso.current = false
    }
  }

  if (loading || !presupuesto) {
    return <div className="py-12 text-center text-muted-foreground">Cargando...</div>
  }

  const p = presupuesto

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/presupuestos" className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              {p.numero}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorEstado(p.estado)}`}>{p.estado}</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {p.paciente.nombre} {p.paciente.apellido} · {p.paciente.identificacion}
            </p>
          </div>
        </div>

        {/* Acciones según estado */}
        <div className="flex items-center gap-2 flex-wrap">
          {p.estado === 'PROPUESTO' && (
            <>
              <button onClick={() => cambiarEstado('APROBADO')} className="btn-primary flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Aprobar
              </button>
              <button onClick={() => cambiarEstado('RECHAZADO')} className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Rechazar
              </button>
            </>
          )}
          {p.estado === 'APROBADO' && (
            <Link href={`/dashboard/facturacion/nueva?presupuestoId=${p.id}`} className="btn-primary flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Facturar
            </Link>
          )}
          {p.estado === 'FACTURADO' && p.facturaId && (
            <Link href={`/dashboard/facturacion/${p.facturaId}`} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" /> Ver factura
            </Link>
          )}
          {p.estado !== 'FACTURADO' && (
            <button onClick={eliminar} className="px-3 py-2 rounded-lg border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="card">
          <p className="text-muted-foreground">Fecha</p>
          <p className="font-medium text-foreground">{format(parseFechaLocal(p.fecha), "dd 'de' MMMM, yyyy", { locale: es })}</p>
        </div>
        <div className="card">
          <p className="text-muted-foreground">Válido hasta</p>
          <p className="font-medium text-foreground">{p.validoHasta ? format(parseFechaLocal(p.validoHasta), "dd 'de' MMMM, yyyy", { locale: es }) : 'Sin vencimiento'}</p>
        </div>
        <div className="card">
          <p className="text-muted-foreground">Creado por</p>
          <p className="font-medium text-foreground">{p.creadoPorNombre || '—'}</p>
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-3 font-semibold">Descripción</th>
              <th className="py-2 px-3 font-semibold text-center">Cant.</th>
              <th className="py-2 px-3 font-semibold text-right">Precio (c/ISV)</th>
              <th className="py-2 px-3 font-semibold text-center">ISV</th>
              <th className="py-2 px-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {p.items.map((it) => (
              <tr key={it.id} className="border-b border-border">
                <td className="py-2 px-3 text-foreground">{it.descripcion}</td>
                <td className="py-2 px-3 text-center text-foreground">{it.cantidad}</td>
                <td className="py-2 px-3 text-right text-foreground">{fmt(Number(it.precioUnitario))}</td>
                <td className="py-2 px-3 text-center text-muted-foreground">{Number(it.tasaIsv)}%</td>
                <td className="py-2 px-3 text-right font-medium text-foreground">{fmt(Number(it.subtotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="flex justify-end">
        <div className="card w-full md:w-80 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base gravable</span><span className="text-foreground">{fmt(Number(p.subtotal))}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">ISV</span><span className="text-foreground">{fmt(Number(p.impuesto))}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Descuento</span><span className="text-foreground">- {fmt(Number(p.descuento))}</span></div>
          <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-1"><span className="text-foreground">Total</span><span style={{ color: 'rgb(var(--accent))' }}>{fmt(Number(p.total))}</span></div>
        </div>
      </div>

      {p.observaciones && (
        <div className="card">
          <p className="text-sm text-muted-foreground mb-1">Observaciones</p>
          <p className="text-foreground whitespace-pre-wrap">{p.observaciones}</p>
        </div>
      )}
    </div>
  )
}
