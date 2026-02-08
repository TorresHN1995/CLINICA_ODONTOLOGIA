'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ArrowLeft, DollarSign, Save, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/components/providers/ConfiguracionProvider'

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
  paciente: PacienteInfo
  items: FacturaItem[]
  pagos: PagoItem[]
}

export default function FacturaDetallePage({ params }: Params) {
  const { formatearMoneda } = useConfiguracion()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [registrando, setRegistrando] = useState(false)
  const [factura, setFactura] = useState<FacturaDetalle | null>(null)
  const [monto, setMonto] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [referencia, setReferencia] = useState('')
  const [observaciones, setObservaciones] = useState('')

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const totalPagado = factura?.pagos.reduce((sum, p) => sum + Number(p.monto), 0) || 0
  const saldo = factura ? Number(factura.total) - totalPagado : 0

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
        toast.success('Pago registrado')
        setMonto(0)
        setReferencia('')
        setObservaciones('')
        await cargarFactura()
      } else {
        toast.error(data.error || 'Error al registrar pago')
      }
    } catch (error) {
      toast.error('Error al registrar pago')
    } finally {
      setRegistrando(false)
    }
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
        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${factura.estado === 'PAGADA' ? 'bg-green-100 text-green-800' :
          factura.estado === 'PAGADA_PARCIAL' ? 'bg-yellow-100 text-yellow-800' :
            factura.estado === 'PENDIENTE' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
          }`}>
          {factura.estado.replace('_', ' ')}
        </span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Pagos</h2>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>

          {factura.pagos.length === 0 ? (
            <p className="text-muted-foreground">No hay pagos registrados.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6 md:mx-0">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Monto</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Método</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Referencia</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {factura.pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-muted">
                      <td className="px-4 sm:px-6 py-3 text-sm text-muted-foreground">
                        {format(new Date(pago.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-foreground">{formatearMoneda(pago.monto)}</td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-muted-foreground">{pago.metodoPago.replace('_', ' ')}</td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-muted-foreground">{pago.referencia || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-foreground mb-4">Registrar Pago</h2>
          <form onSubmit={registrarPago} className="space-y-4">
            <div>
              <label className="label">Monto</label>
              <input
                type="number"
                className="input-field"
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(parseFloat(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="label">Método de Pago</label>
              <select
                className="input-field"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Referencia</label>
              <input
                type="text"
                className="input-field"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="# de transacción, cheque, etc."
              />
            </div>
            <div>
              <label className="label">Observaciones</label>
              <textarea
                className="input-field"
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={registrando}
                className="btn-primary inline-flex items-center space-x-2"
              >
                {registrando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Registrar Pago</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


