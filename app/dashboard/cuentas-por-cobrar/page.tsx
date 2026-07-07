'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, AlertTriangle, FileText, Users, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'
import { parseFechaLocal } from '@/lib/fecha'

type Bucket = 'corriente' | 'dias31_60' | 'dias61_90' | 'mas90'

interface Cuenta {
  facturaId: string
  numero: string
  fecha: string
  tipoDocumento: string
  pacienteId: string
  pacienteNombre: string
  identificacion: string
  total: number
  pagado: number
  saldo: number
  diasVencido: number
  bucket: Bucket
  enMora: boolean
}

interface Resumen {
  totalPorCobrar: number
  totalEnMora: number
  facturasPendientes: number
  pacientesDeudores: number
  umbralMora: number
}

const ETIQUETAS_BUCKET: Record<Bucket, string> = {
  corriente: '0-30 días',
  dias31_60: '31-60 días',
  dias61_90: '61-90 días',
  mas90: '+90 días',
}

const COLOR_BUCKET: Record<Bucket, string> = {
  corriente: 'text-emerald-600 border-emerald-500',
  dias31_60: 'text-amber-600 border-amber-500',
  dias61_90: 'text-orange-600 border-orange-500',
  mas90: 'text-red-600 border-red-500',
}

const METODOS_PAGO = ['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO']

export default function CuentasPorCobrarPage() {
  const { data: config } = useConfiguracion()
  const moneda = config?.simboloMoneda || 'L.'
  const fmt = (n: number) => `${moneda} ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [buckets, setBuckets] = useState<Record<Bucket, number> | null>(null)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [soloMora, setSoloMora] = useState(false)
  const [bucket, setBucket] = useState<string>('')
  const [busqueda, setBusqueda] = useState('')

  // Modal de abono
  const [abonando, setAbonando] = useState<Cuenta | null>(null)
  const [montoAbono, setMontoAbono] = useState(0)
  const [metodoAbono, setMetodoAbono] = useState('EFECTIVO')
  const [referencia, setReferencia] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      const qs = new URLSearchParams()
      if (soloMora) qs.set('soloMora', 'true')
      if (bucket) qs.set('bucket', bucket)
      const res = await fetch(`/api/cuentas-por-cobrar?${qs.toString()}`)
      if (!res.ok) {
        toast.error('Error al cargar cuentas por cobrar')
        return
      }
      const data = await res.json()
      setResumen(data.resumen)
      setBuckets(data.buckets)
      setCuentas(data.cuentas || [])
    } catch (error) {
      toast.error('Error al cargar cuentas por cobrar')
    } finally {
      setLoading(false)
    }
  }, [soloMora, bucket])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cuentasFiltradas = cuentas.filter((c) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      c.pacienteNombre.toLowerCase().includes(q) ||
      c.numero.toLowerCase().includes(q) ||
      c.identificacion.toLowerCase().includes(q)
    )
  })

  const abrirAbono = (cuenta: Cuenta) => {
    setAbonando(cuenta)
    setMontoAbono(cuenta.saldo)
    setMetodoAbono('EFECTIVO')
    setReferencia('')
  }

  const registrarAbono = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!abonando) return
    if (montoAbono <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }
    if (montoAbono > abonando.saldo) {
      toast.error('El abono excede el saldo pendiente')
      return
    }
    try {
      setGuardando(true)
      const res = await fetch(`/api/facturas/${abonando.facturaId}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: montoAbono,
          metodoPago: metodoAbono,
          referencia: referencia || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al registrar el abono')
        return
      }
      toast.success('Abono registrado')
      setAbonando(null)
      cargar()
    } catch (error) {
      toast.error('Error al registrar el abono')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cuentas por Cobrar</h1>
        <p className="text-muted-foreground mt-1">
          Cartera pendiente y antigüedad de saldos (mora a partir de {resumen?.umbralMora ?? 30} días)
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total por Cobrar</p>
              <p className="text-2xl font-bold text-foreground mt-1">{fmt(resumen?.totalPorCobrar || 0)}</p>
            </div>
            <DollarSign className="w-10 h-10 opacity-20 text-blue-500" />
          </div>
        </div>
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En Mora</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{fmt(resumen?.totalEnMora || 0)}</p>
            </div>
            <AlertTriangle className="w-10 h-10 opacity-20 text-red-500" />
          </div>
        </div>
        <div className="card border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Facturas Pendientes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{resumen?.facturasPendientes ?? 0}</p>
            </div>
            <FileText className="w-10 h-10 opacity-20 text-amber-500" />
          </div>
        </div>
        <div className="card border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pacientes Deudores</p>
              <p className="text-2xl font-bold text-foreground mt-1">{resumen?.pacientesDeudores ?? 0}</p>
            </div>
            <Users className="w-10 h-10 opacity-20 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Antigüedad de saldos */}
      {buckets && (
        <div className="card">
          <h2 className="font-semibold text-foreground mb-4">Antigüedad de saldos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(ETIQUETAS_BUCKET) as Bucket[]).map((b) => (
              <button
                key={b}
                onClick={() => setBucket(bucket === b ? '' : b)}
                className={`text-left p-4 rounded-lg border-l-4 bg-muted/40 transition-all ${COLOR_BUCKET[b]} ${bucket === b ? 'ring-2 ring-offset-1' : ''}`}
              >
                <p className="text-xs text-muted-foreground">{ETIQUETAS_BUCKET[b]}</p>
                <p className="text-lg font-bold text-foreground mt-1">{fmt(buckets[b])}</p>
              </button>
            ))}
          </div>
          {bucket && (
            <p className="text-xs text-muted-foreground mt-2">
              Filtrando por {ETIQUETAS_BUCKET[bucket as Bucket]} · <button className="underline" onClick={() => setBucket('')}>quitar</button>
            </p>
          )}
        </div>
      )}

      {/* Filtros + tabla */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Buscar por paciente, factura o identificación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
            <input type="checkbox" checked={soloMora} onChange={(e) => setSoloMora(e.target.checked)} />
            Solo en mora
          </label>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Cargando...</div>
          ) : cuentasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No hay cuentas por cobrar con los filtros actuales. 🎉
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 px-3 font-semibold">Factura</th>
                  <th className="py-3 px-3 font-semibold">Paciente</th>
                  <th className="py-3 px-3 font-semibold">Fecha</th>
                  <th className="py-3 px-3 font-semibold text-right">Total</th>
                  <th className="py-3 px-3 font-semibold text-right">Pagado</th>
                  <th className="py-3 px-3 font-semibold text-right">Saldo</th>
                  <th className="py-3 px-3 font-semibold text-center">Días</th>
                  <th className="py-3 px-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {cuentasFiltradas.map((c) => (
                  <tr key={c.facturaId} className="border-b border-border hover:bg-muted">
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-foreground">{c.numero}</td>
                    <td className="py-3 px-3 text-foreground">
                      {c.pacienteNombre}
                      <span className="block text-xs text-muted-foreground">{c.identificacion}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-muted-foreground">
                      {format(parseFechaLocal(c.fecha), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground">{fmt(c.total)}</td>
                    <td className="py-3 px-3 text-right text-emerald-600">{fmt(c.pagado)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-foreground">{fmt(c.saldo)}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.enMora ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {c.diasVencido}d
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => abrirAbono(c)} className="btn-primary text-xs py-1.5 px-3">
                        Abonar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de abono */}
      {abonando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Registrar Abono</h3>
              <button onClick={() => setAbonando(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Factura</span><span className="font-medium text-foreground">{abonando.numero}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paciente</span><span className="text-foreground">{abonando.pacienteNombre}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Saldo pendiente</span><span className="font-bold text-foreground">{fmt(abonando.saldo)}</span></div>
            </div>
            <form onSubmit={registrarAbono} className="space-y-3">
              <div>
                <label className="label">Monto a abonar</label>
                <input
                  type="number" step="0.01" min="0" max={abonando.saldo}
                  className="input-field"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <label className="label">Método de pago</label>
                <select className="input-field" value={metodoAbono} onChange={(e) => setMetodoAbono(e.target.value)}>
                  {METODOS_PAGO.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Referencia (opcional)</label>
                <input type="text" className="input-field" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAbonando(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn-primary flex-1 disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Registrar abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
