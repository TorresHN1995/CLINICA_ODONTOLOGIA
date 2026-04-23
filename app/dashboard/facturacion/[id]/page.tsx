'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ArrowLeft, DollarSign, Save, Loader2, X, CreditCard, CheckCircle, Clock, Download, FileText, Image, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/components/providers/ConfiguracionProvider'
import { generarTicketFactura, imprimirTicketFactura, type TamanoTicket } from '@/lib/generar-ticket-factura'

interface Params {
  params: { id: string }
}

interface PacienteInfo {
  nombre: string
  apellido: string
  identificacion: string
}

interface FacturaItem {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface PagoItem {
  id: string
  monto: number
  metodoPago: string
  referencia: string | null
  observaciones: string | null
  fecha: string
}

interface FacturaDetalle {
  id: string
  numero: string
  fecha: string
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  estado: 'PENDIENTE' | 'PAGADA_PARCIAL' | 'PAGADA' | 'ANULADA'
  observaciones: string | null
  tipoDocumento?: string
  cai?: string | null
  paciente: PacienteInfo
  emitente?: { nombre: string; apellido: string } | null
  items: FacturaItem[]
  pagos: PagoItem[]
  correlativo?: {
    cai?: string | null
    sucursal?: string
    puntoEmision?: string
    tipoDoc?: string
    rangoInicial?: number
    rangoFinal?: number
    fechaLimite?: string
  } | null
}

export default function FacturaDetallePage({ params }: Params) {
  const { formatearMoneda } = useConfiguracion()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [registrando, setRegistrando] = useState(false)
  const [factura, setFactura] = useState<FacturaDetalle | null>(null)
  const [monto, setMonto] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [referencia, setReferencia] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketTipo, setTicketTipo] = useState<'pago' | 'pendiente'>('pago')
  const [tamanoTicket, setTamanoTicket] = useState<TamanoTicket>('carta')

  const obtenerEmpresa = async () => {
    try {
      const res = await fetch('/api/configuracion-empresa')
      if (res.ok) return await res.json()
    } catch {}
    return { nombre: 'Clínica Dental' }
  }

  const [empresaCache] = useState<any>({ nombre: 'Clínica Dental' })

  const obtenerCorrelativoActivo = async () => {
    try {
      const res = await fetch('/api/configuracion/correlativos')
      if (res.ok) {
        const data = await res.json()
        const activo = Array.isArray(data) 
          ? data.find((c: any) => c.activo && c.tipo === 'FACTURA')
          : null
        return activo || null
      }
    } catch {}
    return null
  }

  const buildTicketOpts = async (tipo: 'pago' | 'pendiente') => {
    if (!factura) return null

    // Si la factura no tiene correlativo asignado, buscar el activo como fallback
    let correlativoData = factura.correlativo
    if (!correlativoData && factura.tipoDocumento !== 'ORDEN_PEDIDO') {
      correlativoData = await obtenerCorrelativoActivo()
    }

    return {
      empresa: empresaCache,
      factura: {
        numero: factura.numero,
        fecha: format(new Date(factura.fecha), 'dd/MM/yyyy', { locale: es }),
        tipoDocumento: factura.tipoDocumento || 'FACTURA',
        cai: factura.cai || correlativoData?.cai || null,
        paciente: factura.paciente,
        emitente: factura.emitente,
        items: factura.items.map(i => ({
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: Number(i.precioUnitario),
          subtotal: Number(i.subtotal),
        })),
        subtotal: Number(factura.subtotal),
        descuento: Number(factura.descuento),
        impuesto: Number(factura.impuesto),
        total: Number(factura.total),
        estado: factura.estado,
        correlativo: correlativoData,
      },
      pagos: factura.pagos.map(p => ({
        monto: Number(p.monto),
        metodoPago: p.metodoPago,
        referencia: p.referencia,
        fecha: format(new Date(p.fecha), 'dd/MM/yyyy HH:mm', { locale: es }),
      })),
      totalPagado,
      saldoPendiente: saldo,
      tipo,
    }
  }

  const generarTicket = async (formato: 'pdf' | 'png') => {
    const opts = await buildTicketOpts(ticketTipo)
    if (!opts) return
    setShowTicketModal(false)
    const toastId = toast.loading('Generando factura...')
    try {
      if (!empresaCache.nombre || empresaCache.nombre === 'Clínica Dental') {
        const emp = await obtenerEmpresa()
        Object.assign(empresaCache, emp)
        opts.empresa = empresaCache
      }
      await generarTicketFactura(opts, formato, tamanoTicket)
      toast.success(`Factura generada en ${formato.toUpperCase()}`, { id: toastId })
    } catch (error) {
      console.error('Error generando factura:', error)
      toast.error('Error al generar factura', { id: toastId })
    }
  }

  const imprimirTicket = async () => {
    const opts = await buildTicketOpts(ticketTipo)
    if (!opts) return
    setShowTicketModal(false)
    try {
      if (!empresaCache.nombre || empresaCache.nombre === 'Clínica Dental') {
        const emp = await obtenerEmpresa()
        Object.assign(empresaCache, emp)
        opts.empresa = empresaCache
      }
      await imprimirTicketFactura(opts, tamanoTicket)
    } catch (error) {
      console.error('Error imprimiendo:', error)
      toast.error('Error al imprimir. Verifique que los popups estén permitidos.')
    }
  }

  const mostrarTicketModal = (tipo: 'pago' | 'pendiente') => {
    setTicketTipo(tipo)
    setShowTicketModal(true)
  }

  const cargarFactura = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facturas/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setFactura(data)
      } else {
        toast.error(data.error || 'Error al cargar factura')
      }
    } catch (error) {
      toast.error('Error al cargar factura')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarFactura()
    
    // Si viene el parámetro pago=nuevo, mostrar modal de pago
    if (searchParams.get('pago') === 'nuevo') {
      setTimeout(() => setShowPagoModal(true), 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const totalPagado = factura?.pagos.reduce((sum, p) => sum + Number(p.monto), 0) || 0
  const saldo = factura ? Number(factura.total) - totalPagado : 0

  // Inicializar monto con el saldo pendiente cuando se abre el modal
  useEffect(() => {
    if (showPagoModal && saldo > 0) {
      setMonto(saldo)
    }
  }, [showPagoModal, saldo])

  const registrarPago = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!monto || monto <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }
    if (monto > saldo) {
      toast.error('El monto excede el saldo pendiente')
      return
    }

    try {
      setRegistrando(true)
      const response = await fetch(`/api/facturas/${params.id}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto,
          metodoPago,
          referencia: referencia || undefined,
          observaciones: observaciones || undefined,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Pago registrado exitosamente')
        setMonto(0)
        setReferencia('')
        setObservaciones('')
        setShowPagoModal(false)
        await cargarFactura()
        
        // Mostrar modal de ticket después de registrar pago
        mostrarTicketModal('pago')
      } else {
        toast.error(data.error || 'Error al registrar pago')
      }
    } catch (error) {
      toast.error('Error al registrar pago')
    } finally {
      setRegistrando(false)
    }
  }

  const dejarPendiente = () => {
    setShowPagoModal(false)
    toast.success('Factura guardada como pendiente')
    mostrarTicketModal('pendiente')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/facturacion" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Factura no encontrada</h1>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/facturacion" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Factura {factura.numero}</h1>
              <p className="text-muted-foreground mt-1">
                {format(new Date(factura.fecha), "dd/MM/yyyy", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => mostrarTicketModal(saldo > 0 ? 'pendiente' : 'pago')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            {saldo > 0 && (
              <button
                onClick={() => setShowPagoModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Registrar Pago
              </button>
            )}
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
              factura.estado === 'PAGADA' ? 'bg-green-100 text-green-800' :
              factura.estado === 'PAGADA_PARCIAL' ? 'bg-yellow-100 text-yellow-800' :
              factura.estado === 'PENDIENTE' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {factura.estado.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <p className="text-sm text-muted-foreground">Paciente</p>
            <p className="text-lg font-semibold text-foreground">
              {factura.paciente.nombre} {factura.paciente.apellido}
            </p>
            <p className="text-sm text-muted-foreground">{factura.paciente.identificacion}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{formatearMoneda(factura.total)}</p>
            <p className="text-sm text-muted-foreground">Subtotal {formatearMoneda(factura.subtotal)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className={`text-2xl font-bold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatearMoneda(saldo)}
            </p>
            <p className="text-sm text-muted-foreground">Pagado {formatearMoneda(totalPagado)}</p>
          </div>
        </div>

        {/* Items */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Precio Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {factura.items.map(item => (
                  <tr key={item.id} className="hover:bg-muted">
                    <td className="px-6 py-4">{item.descripcion}</td>
                    <td className="px-6 py-4">{item.cantidad}</td>
                    <td className="px-6 py-4">{formatearMoneda(item.precioUnitario)}</td>
                    <td className="px-6 py-4">{formatearMoneda(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-muted border-t border-border flex items-center justify-end space-x-6">
            <div className="text-sm text-muted-foreground">Descuento: {formatearMoneda(factura.descuento)}</div>
            <div className="text-sm text-muted-foreground">Impuesto: {formatearMoneda(factura.impuesto)}</div>
            <div className="text-lg font-bold text-foreground">Total: {formatearMoneda(factura.total)}</div>
          </div>
        </div>

        {/* Pagos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Historial de Pagos</h2>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>

          {factura.pagos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay pagos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Referencia</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {factura.pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-muted">
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {format(new Date(pago.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-foreground">{formatearMoneda(pago.monto)}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{pago.metodoPago.replace('_', ' ')}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{pago.referencia || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pago */}
      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-green-500 to-green-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Registrar Pago</h2>
                  <p className="text-sm text-white/80">Factura {factura.numero}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPagoModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={registrarPago} className="p-6 space-y-4">
              {/* Resumen */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Factura:</span>
                  <span className="font-semibold text-foreground">{formatearMoneda(factura.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ya Pagado:</span>
                  <span className="font-semibold text-green-600">{formatearMoneda(totalPagado)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                  <span className="text-foreground">Saldo Pendiente:</span>
                  <span className="text-red-600">{formatearMoneda(saldo)}</span>
                </div>
              </div>

              {/* Monto */}
              <div>
                <label className="label">Monto a Pagar</label>
                <input
                  type="number"
                  className="input-field text-lg font-semibold"
                  min="0.01"
                  max={saldo}
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                  required
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setMonto(saldo)}
                    className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Pago Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonto(saldo / 2)}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    50%
                  </button>
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="label">Método de Pago</label>
                <select
                  className="input-field"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA_CREDITO">💳 Tarjeta de Crédito</option>
                  <option value="TARJETA_DEBITO">💳 Tarjeta de Débito</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia</option>
                  <option value="CHEQUE">📝 Cheque</option>
                  <option value="OTRO">➕ Otro</option>
                </select>
              </div>

              {/* Referencia */}
              <div>
                <label className="label">Referencia (Opcional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Número de transacción, cheque..."
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="label">Observaciones (Opcional)</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Notas adicionales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={dejarPendiente}
                  className="flex-1 px-4 py-3 border-2 border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Dejar Pendiente
                </button>
                <button
                  type="submit"
                  disabled={registrando}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {registrando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Registrar Pago
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ticket */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 text-center ${ticketTipo === 'pago' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                {ticketTipo === 'pago' ? (
                  <CheckCircle className="w-7 h-7 text-white" />
                ) : (
                  <Clock className="w-7 h-7 text-white" />
                )}
              </div>
              <h2 className="text-lg font-bold text-white">
                {ticketTipo === 'pago' ? 'Pago Registrado' : 'Cuenta Pendiente'}
              </h2>
              <p className="text-sm text-white/80 mt-1">Seleccione formato y tamaño</p>
            </div>

            <div className="p-6 space-y-3">
              {/* Selector de tamaño */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
                <button
                  onClick={() => setTamanoTicket('carta')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
                    tamanoTicket === 'carta'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📄 Tamaño Carta
                </button>
                <button
                  onClick={() => setTamanoTicket('ticket')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
                    tamanoTicket === 'ticket'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🧾 Ticket 80mm
                </button>
              </div>
              <button
                onClick={() => imprimirTicket()}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3"
              >
                <Printer className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Imprimir Factura</div>
                  <div className="text-xs text-blue-200">Enviar a impresora directamente</div>
                </div>
              </button>
              <button
                onClick={() => generarTicket('pdf')}
                className="w-full px-4 py-3 border-2 border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">Descargar PDF</div>
                  <div className="text-xs text-muted-foreground">Guardar como archivo</div>
                </div>
              </button>
              <button
                onClick={() => generarTicket('png')}
                className="w-full px-4 py-3 border-2 border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
              >
                <Image className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">Descargar PNG</div>
                  <div className="text-xs text-muted-foreground">Imagen para enviar por WhatsApp</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowTicketModal(false)
                  router.push('/dashboard/facturacion')
                }}
                className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Omitir y volver a facturación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
