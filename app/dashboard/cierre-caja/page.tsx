'use client'

import { useState, useEffect, useCallback } from 'react'
import { Banknote, TrendingUp, TrendingDown, Calculator, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'

interface Preview {
  totalIngresos: number
  totalEfectivo: number
  totalEgresos: number
  egresosEfectivo: number
  efectivoNeto: number
  desglosePorMetodo: Record<string, number>
}

interface Cierre {
  id: string
  fecha: string
  usuarioNombre: string | null
  fondoInicial: number
  efectivoEsperado: number
  efectivoContado: number
  diferencia: number
  observaciones: string | null
}

const ETIQUETA_METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_CREDITO: 'Tarjeta Crédito',
  TARJETA_DEBITO: 'Tarjeta Débito',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  OTRO: 'Otro',
}

export default function CierreCajaPage() {
  const { data: config } = useConfiguracion()
  const moneda = config?.simboloMoneda || 'L.'
  const fmt = (n: number) => `${moneda} ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [preview, setPreview] = useState<Preview | null>(null)
  const [existente, setExistente] = useState<Cierre | null>(null)
  const [historial, setHistorial] = useState<Cierre[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [fondoInicial, setFondoInicial] = useState(0)
  const [efectivoContado, setEfectivoContado] = useState(0)
  const [observaciones, setObservaciones] = useState('')

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cierre-caja?fecha=${fecha}`)
      if (!res.ok) {
        toast.error('Error al cargar el cierre de caja')
        return
      }
      const data = await res.json()
      setPreview(data.preview)
      setExistente(data.existente)
      setHistorial(data.historial || [])
    } catch {
      toast.error('Error al cargar el cierre de caja')
    } finally {
      setLoading(false)
    }
  }, [fecha])

  useEffect(() => {
    cargar()
  }, [cargar])

  const efectivoEsperado = (preview?.efectivoNeto || 0) + fondoInicial
  const diferencia = efectivoContado - efectivoEsperado

  const cerrarCaja = async () => {
    if (guardando) return
    try {
      setGuardando(true)
      const res = await fetch('/api/cierre-caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, fondoInicial, efectivoContado, observaciones: observaciones || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al cerrar la caja')
        return
      }
      toast.success('Caja cerrada correctamente')
      setObservaciones('')
      cargar()
    } catch {
      toast.error('Error al cerrar la caja')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cierre de Caja</h1>
          <p className="text-muted-foreground mt-1">Arqueo diario: efectivo esperado vs. contado</p>
        </div>
        <div>
          <label className="label">Fecha</label>
          <input type="date" className="input-field" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>

      {existente && (
        <div className="card border-l-4 border-amber-500 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Ya existe un cierre para este día</p>
            <p className="text-muted-foreground">
              Cerrado por {existente.usuarioNombre || 'usuario'} · Esperado {fmt(Number(existente.efectivoEsperado))} · Contado {fmt(Number(existente.efectivoContado))} ·{' '}
              <span className={Number(existente.diferencia) === 0 ? 'text-emerald-600' : 'text-red-600'}>
                Diferencia {fmt(Number(existente.diferencia))}
              </span>. Puedes registrar un nuevo cierre si necesitas corregirlo.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Cargando...</div>
      ) : (
        <>
          {/* Movimientos del día */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos del día</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{fmt(preview?.totalIngresos || 0)}</p>
                </div>
                <TrendingUp className="w-9 h-9 opacity-20 text-emerald-500" />
              </div>
            </div>
            <div className="card border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cobros en efectivo</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{fmt(preview?.totalEfectivo || 0)}</p>
                </div>
                <Banknote className="w-9 h-9 opacity-20 text-blue-500" />
              </div>
            </div>
            <div className="card border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Egresos del día</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{fmt(preview?.totalEgresos || 0)}</p>
                </div>
                <TrendingDown className="w-9 h-9 opacity-20 text-red-500" />
              </div>
            </div>
            <div className="card border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Egresos en efectivo</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{fmt(preview?.egresosEfectivo || 0)}</p>
                </div>
                <Banknote className="w-9 h-9 opacity-20 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desglose por método */}
            <div className="card">
              <h2 className="font-semibold text-foreground mb-3">Cobros por método de pago</h2>
              <div className="space-y-2">
                {Object.entries(preview?.desglosePorMetodo || {}).map(([metodo, monto]) => (
                  <div key={metodo} className="flex justify-between text-sm border-b border-border pb-1.5">
                    <span className="text-muted-foreground">{ETIQUETA_METODO[metodo] || metodo}</span>
                    <span className="text-foreground font-medium">{fmt(Number(monto))}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span className="text-foreground">Total cobrado</span>
                  <span className="text-foreground">{fmt(preview?.totalIngresos || 0)}</span>
                </div>
              </div>
            </div>

            {/* Cuadre de efectivo */}
            <div className="card">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calculator className="w-5 h-5" /> Cuadre de efectivo
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="label">Fondo inicial (base de caja)</label>
                  <input type="number" step="0.01" min="0" className="input-field" value={fondoInicial} onChange={(e) => setFondoInicial(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Fondo inicial</span><span className="text-foreground">{fmt(fondoInicial)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">+ Cobros en efectivo</span><span className="text-foreground">{fmt(preview?.totalEfectivo || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">− Egresos en efectivo</span><span className="text-foreground">{fmt(preview?.egresosEfectivo || 0)}</span></div>
                  <div className="flex justify-between font-bold border-t border-border pt-1.5"><span className="text-foreground">Efectivo esperado</span><span className="text-foreground">{fmt(efectivoEsperado)}</span></div>
                </div>
                <div>
                  <label className="label">Efectivo contado (físico)</label>
                  <input type="number" step="0.01" min="0" className="input-field" value={efectivoContado} onChange={(e) => setEfectivoContado(parseFloat(e.target.value) || 0)} />
                </div>
                <div className={`rounded-lg p-3 flex items-center justify-between ${diferencia === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <span className={`font-medium ${diferencia === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                    {diferencia === 0 ? 'Cuadra exacto' : diferencia > 0 ? 'Sobrante' : 'Faltante'}
                  </span>
                  <span className={`text-lg font-bold ${diferencia === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                    {fmt(diferencia)}
                  </span>
                </div>
                <div>
                  <label className="label">Observaciones</label>
                  <textarea className="input-field" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas del arqueo (opcional)..." />
                </div>
                <button onClick={cerrarCaja} disabled={guardando} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  <CheckCircle className="w-5 h-5" />
                  {guardando ? 'Guardando...' : 'Cerrar caja'}
                </button>
              </div>
            </div>
          </div>

          {/* Historial */}
          <div className="card overflow-x-auto">
            <h2 className="font-semibold text-foreground mb-3">Historial de cierres</h2>
            {historial.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Aún no hay cierres registrados.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 px-3 font-semibold">Fecha</th>
                    <th className="py-2 px-3 font-semibold">Cerrado por</th>
                    <th className="py-2 px-3 font-semibold text-right">Esperado</th>
                    <th className="py-2 px-3 font-semibold text-right">Contado</th>
                    <th className="py-2 px-3 font-semibold text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-muted">
                      <td className="py-2 px-3 whitespace-nowrap text-foreground">{format(new Date(c.fecha), 'dd/MM/yyyy', { locale: es })}</td>
                      <td className="py-2 px-3 text-foreground">{c.usuarioNombre || '—'}</td>
                      <td className="py-2 px-3 text-right text-foreground">{fmt(Number(c.efectivoEsperado))}</td>
                      <td className="py-2 px-3 text-right text-foreground">{fmt(Number(c.efectivoContado))}</td>
                      <td className={`py-2 px-3 text-right font-medium ${Number(c.diferencia) === 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(Number(c.diferencia))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
