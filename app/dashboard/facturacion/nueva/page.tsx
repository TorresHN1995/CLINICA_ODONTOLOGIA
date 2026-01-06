'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2, Plus, Trash2, FileText, Calendar, User, X, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Combobox } from '@/components/ui/Combobox'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'
import { useSession } from 'next-auth/react'

interface Paciente {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

interface Item {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
}

interface Correlativo {
  id: string
  tipo: string
  cai?: string | null
  sucursal: string
  puntoEmision: string
  tipoDoc: string
  siguiente: number
  rangoFinal: number
  activo: boolean
  fechaLimite: string | Date
}

export default function NuevaFacturaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: config } = useConfiguracion()

  const [loading, setLoading] = useState(false)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [correlativos, setCorrelativos] = useState<Correlativo[]>([])

  // State for Modal & Document Type
  const [showTypeModal, setShowTypeModal] = useState(true)
  const [tipoDocumento, setTipoDocumento] = useState('FACTURA')

  // Form State
  const [pacienteId, setPacienteId] = useState('')
  const [fecha] = useState(format(new Date(), 'yyyy-MM-dd')) // Read-only state
  const [items, setItems] = useState<Item[]>([
    { id: '1', descripcion: '', cantidad: 1, precioUnitario: 0 }
  ])
  const [descuento, setDescuento] = useState(0)
  const [impuesto, setImpuesto] = useState(0)
  const [observaciones, setObservaciones] = useState('')

  const moneda = config?.simboloMoneda || 'L.'

  useEffect(() => {
    fetchPacientes()
    fetchCorrelativos()
  }, [])

  const fetchPacientes = async () => {
    try {
      const response = await fetch('/api/pacientes?limit=1000')
      const data = await response.json()
      if (response.ok) {
        setPacientes(data.pacientes)
      }
    } catch (error) {
      console.error('Error al cargar pacientes:', error)
    }
  }

  const fetchCorrelativos = async () => {
    try {
      const response = await fetch('/api/configuracion/correlativos')
      if (response.ok) {
        const data = await response.json()
        setCorrelativos(data)
      }
    } catch (error) {
      console.error('Error al cargar correlativos:', error)
    }
  }

  const correlativoActivo = correlativos.find(c => c.tipo === tipoDocumento && c.activo !== false)

  const handleTypeSelection = (type: string) => {
    setTipoDocumento(type)
    setShowTypeModal(false)
  }

  const agregarItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0
    }])
  }

  const eliminarItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const actualizarItem = (id: string, field: keyof Item, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Constants
  const TASA_ISV = 0.15

  const calcularTotalItems = () => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0)
  }

  const calcularBaseImponible = () => {
    const totalInclusive = calcularTotalItems()
    return totalInclusive / (1 + TASA_ISV)
  }

  const calcularISV = () => {
    const totalInclusive = calcularTotalItems()
    return totalInclusive - (totalInclusive / (1 + TASA_ISV))
  }

  const calcularTotalPagar = () => {
    const totalInclusive = calcularTotalItems()
    return totalInclusive - descuento
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pacienteId) {
      toast.error('Por favor seleccione un paciente')
      return
    }

    if (!correlativoActivo) {
      toast.error(`No hay correlativo configurado para ${tipoDocumento}`)
      return
    }

    setLoading(true)

    try {
      // PREPARAR DATOS PARA API (Convertir montos inclusivos a base + impuesto)
      // Si el usuario ingresó 115 (Total), la API espera Base (100) + Impuesto (15)

      const payloadItems = items.map(({ id, ...item }) => ({
        ...item,
        precioUnitario: item.precioUnitario / (1 + TASA_ISV) // Extraer precio base
      }))

      const payloadImpuesto = calcularISV()

      const response = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoDocumento,
          pacienteId,
          items: payloadItems,
          descuento,
          impuesto: payloadImpuesto,
          observaciones,
        }),
      })

      if (response.ok) {
        toast.success(`${tipoDocumento === 'FACTURA' ? 'Factura' : 'Orden'} creada exitosamente`)
        router.push('/dashboard/facturacion')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al crear documento')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const pacienteOptions = pacientes.map(p => ({
    id: p.id,
    label: `${p.nombre} ${p.apellido} (${p.identificacion})`
  }))

  const getSiguienteCorrelativo = () => {
    if (!correlativoActivo) return 'No configurado'
    const num = String(correlativoActivo.siguiente).padStart(8, '0')
    return `${correlativoActivo.sucursal}-${correlativoActivo.puntoEmision}-${correlativoActivo.tipoDoc}-${num}`
  }

  return (
    <div className="relative min-h-screen">

      {/* Modal de Selección de Tipo */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-50 duration-300">
            <div className="p-6 text-center border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Nueva Emisión</h2>
              <p className="text-gray-500 mt-1">Seleccione el tipo de documento a emitir</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTypeSelection('FACTURA')}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
              >
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <FileText className="w-8 h-8" />
                </div>
                <span className="font-bold text-gray-900 group-hover:text-primary-700">Factura SAR</span>
                <span className="text-xs text-gray-500 mt-1">Con desglose ISV (15%)</span>
              </button>

              <button
                onClick={() => handleTypeSelection('ORDEN_PEDIDO')}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="w-8 h-8" />
                </div>
                <span className="font-bold text-gray-900 group-hover:text-blue-700">Orden de Pedido</span>
                <span className="text-xs text-gray-500 mt-1">Uso interno / Exento</span>
              </button>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <Link href="/dashboard/facturacion" className="text-sm text-gray-500 hover:text-gray-700">
                Cancelar y volver
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal (Blur si modal está activo) */}
      <div className={`space-y-6 transition-all ${showTypeModal ? 'filter blur-sm pointer-events-none' : ''}`}>

        {/* Header Compacto */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link
              href="/dashboard/facturacion"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {tipoDocumento === 'FACTURA' ? 'Nueva Factura' : 'Nueva Orden'}
                <span className="px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-700 font-medium">
                  {getSiguienteCorrelativo()}
                </span>
              </h1>
              {correlativoActivo && (
                <div className="text-xs text-gray-400">
                  CAI: {correlativoActivo.cai || 'N/A'} • Vence: {format(new Date(correlativoActivo.fechaLimite || '2099-12-31'), 'dd/MM/yyyy')}
                </div>
              )}
            </div>
            {/* Botón para cambiar tipo (opcional, si se equivocaron) */}
            <button
              onClick={() => setShowTypeModal(true)}
              className="ml-2 text-xs text-primary-600 hover:underline"
            >
              (Cambiar)
            </button>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto text-sm">
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(fecha), 'dd MMMM yyyy', { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <User className="w-4 h-4" />
              <span className="font-medium">{session?.user?.name || 'Cajero'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Selección de Paciente (Barra Horizontal) */}
          <div className="card py-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 whitespace-nowrap min-w-[150px]">
              <User className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-gray-900">Datos del Paciente</span>
            </div>
            <div className="flex-1 w-full">
              <Combobox
                options={pacienteOptions}
                value={pacienteId}
                onChange={setPacienteId}
                placeholder="Buscar paciente por nombre o identidad..."
                searchPlaceholder="Escriba para buscar..."
                emptyMessage="No encontrado."
                className="w-full"
              />
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200"></div>
            <div className="whitespace-nowrap text-sm text-gray-500">
              {pacienteId ? (
                <span className="flex items-center text-green-600 gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Paciente Seleccionado
                </span>
              ) : (
                <span>Seleccione un paciente de la lista</span>
              )}
            </div>
          </div>

          {/* Items y Detalles */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Tabla de Items (Izquierda - 8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="card min-h-[400px]">
                <div className="flex items-center justify-between mb-4 border-b pb-4">
                  <h2 className="font-bold text-gray-900">Conceptos / Servicios</h2>
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="btn-secondary py-1.5 text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Fila</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Header Items */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-2 mb-2">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-6">Descripción</div>
                    <div className="col-span-2 text-center">Cant.</div>
                    <div className="col-span-2 text-right">Precio (Inc. ISV)</div>
                    <div className="col-span-1"></div>
                  </div>

                  {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center hover:bg-gray-50 p-2 rounded-lg transition-colors group">
                      <div className="col-span-1 text-center text-gray-400 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          className="input-field py-1.5 text-sm"
                          placeholder="Descripción del servicio..."
                          value={item.descripcion}
                          onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="1"
                          className="input-field py-1.5 text-sm text-center"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(item.id, 'cantidad', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2 relative">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          className="input-field py-1.5 text-sm text-right pr-2"
                          value={item.precioUnitario}
                          onChange={(e) => actualizarItem(item.id, 'precioUnitario', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones (Debajo de items) */}
              <div className="card">
                <label className="label text-xs mb-2">Observaciones / Notas al Paciente</label>
                <textarea
                  rows={3}
                  className="input-field text-sm resize-none"
                  placeholder="Notas opcionales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>

            {/* Totales y Acciones (Derecha - 4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="card sticky top-6">
                <h2 className="font-bold text-gray-900 border-b pb-3 mb-4">Resumen</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Subtotal (Base)</span>
                    <span className="font-mono">{moneda} {calcularBaseImponible().toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm group">
                    <span className="text-gray-600 decoration-dotted underline cursor-help" title="Descuento aplicado">Descuento (-)</span>
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field py-1 text-right text-sm"
                        value={descuento}
                        onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">I.S.V. (15%) Included</span>
                    <span className="font-mono text-gray-800">{moneda} {calcularISV().toFixed(2)}</span>
                  </div>

                  <div className="border-t-2 border-dashed border-gray-200 my-4 pt-4">
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-bold text-gray-900">Total a Pagar</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600 leading-none">
                          {moneda} {calcularTotalPagar().toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Impuestos incluidos</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>Emitir {tipoDocumento === 'FACTURA' ? 'Factura' : 'Orden'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}
