'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

const categoriasEgreso = [
  { value: 'MATERIALES_DENTALES', label: 'Materiales Dentales' },
  { value: 'INSTRUMENTAL', label: 'Instrumental' },
  { value: 'MEDICAMENTOS', label: 'Medicamentos' },
  { value: 'EQUIPAMIENTO', label: 'Equipamiento' },
  { value: 'SERVICIOS_PUBLICOS', label: 'Servicios Públicos' },
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'SALARIOS', label: 'Salarios' },
  { value: 'SEGUROS', label: 'Seguros' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'OTROS_GASTOS', label: 'Otros Gastos' },
]

const metodosPago = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTRO', label: 'Otro' },
]

export default function NuevoEgresoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    concepto: '',
    categoria: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodoPago: 'EFECTIVO',
    proveedor: '',
    numeroFactura: '',
    observaciones: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/egresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monto: parseFloat(formData.monto),
        }),
      })

      if (response.ok) {
        toast.success('Gasto registrado exitosamente')
        router.push('/dashboard/contabilidad')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al registrar gasto')
      }
    } catch (error) {
      toast.error('Error al registrar gasto')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/contabilidad"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registrar Gasto</h1>
          <p className="text-muted-foreground mt-1">Registra un nuevo egreso de la clínica</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Información del Gasto */}
        <div className="card">
          <h2 className="text-xl font-bold text-foreground mb-6">Información del Gasto</h2>
          
          <div className="space-y-6">
            <div>
              <label className="label">Concepto del Gasto *</label>
              <input
                type="text"
                name="concepto"
                required
                className="input-field"
                placeholder="Ej: Compra de materiales dentales, Pago de alquiler..."
                value={formData.concepto}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Categoría *</label>
                <select
                  name="categoria"
                  required
                  className="input-field"
                  value={formData.categoria}
                  onChange={handleChange}
                >
                  <option value="">Seleccione una categoría</option>
                  {categoriasEgreso.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Monto *</label>
                <input
                  type="number"
                  name="monto"
                  required
                  min="0.01"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Fecha *</label>
                <input
                  type="date"
                  name="fecha"
                  required
                  className="input-field"
                  value={formData.fecha}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Método de Pago *</label>
                <select
                  name="metodoPago"
                  required
                  className="input-field"
                  value={formData.metodoPago}
                  onChange={handleChange}
                >
                  {metodosPago.map((metodo) => (
                    <option key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Proveedor */}
        <div className="card">
          <h2 className="text-xl font-bold text-foreground mb-6">Información del Proveedor (Opcional)</h2>
          
          <div className="space-y-6">
            <div>
              <label className="label">Proveedor</label>
              <input
                type="text"
                name="proveedor"
                className="input-field"
                placeholder="Nombre del proveedor o empresa"
                value={formData.proveedor}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Número de Factura</label>
              <input
                type="text"
                name="numeroFactura"
                className="input-field"
                placeholder="Número de factura del proveedor"
                value={formData.numeroFactura}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Observaciones</label>
              <textarea
                name="observaciones"
                rows={3}
                className="input-field"
                placeholder="Notas adicionales sobre este gasto..."
                value={formData.observaciones}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/contabilidad" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Registrar Gasto</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
