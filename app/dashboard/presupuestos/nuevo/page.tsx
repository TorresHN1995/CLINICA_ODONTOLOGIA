'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'

interface Paciente {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

interface ProductoServicio {
  id: string
  nombre: string
  precio: number
  isv: number
}

interface Item {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  tasaIsv: number
  productoId?: string
}

export default function NuevoPresupuestoPage() {
  const router = useRouter()
  const { data: config } = useConfiguracion()
  const moneda = config?.simboloMoneda || 'L.'
  const fmt = (n: number) => `${moneda} ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [productos, setProductos] = useState<ProductoServicio[]>([])
  const [loading, setLoading] = useState(false)

  const [pacienteId, setPacienteId] = useState('')
  const [validoHasta, setValidoHasta] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [items, setItems] = useState<Item[]>([
    { id: '1', descripcion: '', cantidad: 1, precioUnitario: 0, tasaIsv: 15 },
  ])

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resPac, resProd] = await Promise.all([
          fetch('/api/pacientes?limit=1000'),
          fetch('/api/productos'),
        ])
        if (resPac.ok) {
          const d = await resPac.json()
          setPacientes(d.pacientes || [])
        }
        if (resProd.ok) {
          const d = await resProd.json()
          setProductos(Array.isArray(d) ? d : [])
        }
      } catch {
        toast.error('Error al cargar datos')
      }
    }
    cargar()
  }, [])

  const actualizarItem = (id: string, campo: keyof Item, valor: any) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)))
  }

  const seleccionarProducto = (id: string, productoId: string) => {
    const prod = productos.find((p) => p.id === productoId)
    if (!prod) {
      actualizarItem(id, 'productoId', undefined)
      return
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, productoId: prod.id, descripcion: prod.nombre, precioUnitario: Number(prod.precio), tasaIsv: Number(prod.isv) }
          : it
      )
    )
  }

  const agregarItem = () => {
    setItems((prev) => [...prev, { id: Date.now().toString(), descripcion: '', cantidad: 1, precioUnitario: 0, tasaIsv: 15 }])
  }

  const eliminarItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev))
  }

  // Totales (precios inclusivos de ISV)
  const itemsValidos = items.filter((it) => it.descripcion.trim() !== '' && it.precioUnitario > 0)
  let baseTotal = 0
  let isvTotal = 0
  let bruto = 0
  for (const it of itemsValidos) {
    const linea = it.cantidad * it.precioUnitario
    const base = it.tasaIsv > 0 ? linea / (1 + it.tasaIsv / 100) : linea
    baseTotal += base
    isvTotal += linea - base
    bruto += linea
  }
  const total = Math.max(0, bruto - descuento)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pacienteId) {
      toast.error('Seleccione un paciente')
      return
    }
    if (itemsValidos.length === 0) {
      toast.error('Agregue al menos un ítem con descripción y precio')
      return
    }
    if (descuento > bruto) {
      toast.error('El descuento no puede ser mayor que el total')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId,
          descuento,
          validoHasta: validoHasta || undefined,
          observaciones: observaciones || undefined,
          items: itemsValidos.map((it) => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            tasaIsv: it.tasaIsv,
            productoId: it.productoId,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al crear presupuesto')
        return
      }
      toast.success('Presupuesto creado')
      router.push(`/dashboard/presupuestos/${data.id}`)
    } catch {
      toast.error('Error al crear presupuesto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/presupuestos" className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Presupuesto</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Paciente *</label>
            <select className="input-field" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required>
              <option value="">Seleccione...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.identificacion}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Válido hasta</label>
            <input type="date" className="input-field" value={validoHasta} onChange={(e) => setValidoHasta(e.target.value)} />
          </div>
          <div>
            <label className="label">Descuento ({moneda})</label>
            <input type="number" step="0.01" min="0" className="input-field" value={descuento} onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Ítems</h2>
            <button type="button" onClick={agregarItem} className="text-sm flex items-center gap-1 hover:underline" style={{ color: 'rgb(var(--accent))' }}>
              <Plus className="w-4 h-4" /> Agregar fila
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 px-2 font-semibold">Producto/Servicio</th>
                  <th className="py-2 px-2 font-semibold">Descripción</th>
                  <th className="py-2 px-2 font-semibold w-20">Cant.</th>
                  <th className="py-2 px-2 font-semibold w-32">Precio (c/ISV)</th>
                  <th className="py-2 px-2 font-semibold w-24">ISV %</th>
                  <th className="py-2 px-2 font-semibold text-right w-28">Total</th>
                  <th className="py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-border">
                    <td className="py-2 px-2">
                      <select className="input-field" value={it.productoId || ''} onChange={(e) => seleccionarProducto(it.id, e.target.value)}>
                        <option value="">Manual</option>
                        {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" className="input-field" value={it.descripcion} onChange={(e) => actualizarItem(it.id, 'descripcion', e.target.value)} placeholder="Descripción" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min="1" className="input-field" value={it.cantidad} onChange={(e) => actualizarItem(it.id, 'cantidad', parseInt(e.target.value) || 1)} />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" step="0.01" min="0" className="input-field" value={it.precioUnitario} onChange={(e) => actualizarItem(it.id, 'precioUnitario', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="py-2 px-2">
                      <select className="input-field" value={it.tasaIsv} onChange={(e) => actualizarItem(it.id, 'tasaIsv', parseFloat(e.target.value))}>
                        <option value={0}>0%</option>
                        <option value={15}>15%</option>
                        <option value={18}>18%</option>
                      </select>
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-foreground whitespace-nowrap">
                      {fmt(it.cantidad * it.precioUnitario)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button type="button" onClick={() => eliminarItem(it.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales + observaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <label className="label">Observaciones</label>
            <textarea className="input-field" rows={5} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas para el paciente..." />
          </div>
          <div className="card space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base gravable</span><span className="text-foreground">{fmt(baseTotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">ISV</span><span className="text-foreground">{fmt(isvTotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Descuento</span><span className="text-foreground">- {fmt(descuento)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-1"><span className="text-foreground">Total</span><span style={{ color: 'rgb(var(--accent))' }}>{fmt(total)}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/presupuestos" className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Guardando...' : 'Guardar Presupuesto'}
          </button>
        </div>
      </form>
    </div>
  )
}
