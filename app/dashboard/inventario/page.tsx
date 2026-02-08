'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Package, AlertTriangle, X, Loader2, ArrowUpDown } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function InventarioPage() {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inventario, setInventario] = useState<Array<{
    id: string
    codigo: string
    nombre: string
    categoria: string
    stock: number
    stockMinimo: number
    unidadMedida: string
  }>>([])
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'MATERIAL_DENTAL',
    stock: 0,
    stockMinimo: 5,
    unidadMedida: 'UNIDAD',
    precioCompra: 0,
  })
  const [showMovModal, setShowMovModal] = useState(false)
  const [movItem, setMovItem] = useState<any>(null)
  const [movForm, setMovForm] = useState({ tipo: 'ENTRADA', cantidad: 1, motivo: '' })

  const cargar = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      const response = await fetch(`/api/inventario?${query.toString()}`)
      const data = await response.json()
      if (response.ok) {
        setInventario(data)
      }
    } catch (e) {
      // noop UI
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const itemsBajoStock = inventario.filter(item => item.stock < item.stockMinimo)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        toast.success('Material agregado correctamente')
        setShowModal(false)
        setFormData({
          codigo: '', nombre: '', descripcion: '',
          categoria: 'MATERIAL_DENTAL', stock: 0,
          stockMinimo: 5, unidadMedida: 'UNIDAD', precioCompra: 0,
        })
        cargar()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al agregar material')
      }
    } catch {
      toast.error('Error al agregar material')
    } finally {
      setSaving(false)
    }
  }

  const handleMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movItem) return
    try {
      setSaving(true)
      const res = await fetch('/api/inventario/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventarioId: movItem.id,
          tipo: movForm.tipo,
          cantidad: movForm.cantidad,
          motivo: movForm.motivo || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Movimiento registrado')
        setShowMovModal(false)
        cargar()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al registrar movimiento')
      }
    } catch {
      toast.error('Error al registrar movimiento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Control de Inventario</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los materiales e insumos de la clínica
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Agregar Material</span>
        </button>
      </div>

      {/* Alerta de Bajo Stock */}
      {itemsBajoStock.length > 0 && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 mb-2">Alerta de Bajo Stock</h3>
              <p className="text-sm text-red-800">
                {itemsBajoStock.length} artículos necesitan reposición:
              </p>
              <ul className="mt-2 space-y-1">
                {itemsBajoStock.map(item => (
                  <li key={item.id} className="text-sm text-red-800">
                    • {item.nombre} - Stock actual: {item.stock} (Mínimo: {item.stockMinimo})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stock Mínimo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Unidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {inventario.map((item) => (
                  <tr key={item.id} className="hover:bg-muted">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{item.codigo}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{item.nombre}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.categoria.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${item.stock < item.stockMinimo ? 'text-red-600' : 'text-foreground'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.stockMinimo}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.unidadMedida}</td>
                    <td className="px-6 py-4">
                      {item.stock < item.stockMinimo ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Bajo Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <Package className="w-3 h-3 mr-1" />
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setMovItem(item)
                          setMovForm({ tipo: 'ENTRADA', cantidad: 1, motivo: '' })
                          setShowMovModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-800 p-1 hover:bg-primary-50 rounded text-xs font-medium"
                        title="Registrar movimiento"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal Agregar Material */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">Agregar Material</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código</label>
                  <input type="text" required className="input-field" value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
                </div>
                <div>
                  <label className="label">Nombre</label>
                  <input type="text" required className="input-field" value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <input type="text" className="input-field" value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Categoría</label>
                  <select className="input-field" value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}>
                    <option value="MATERIAL_DENTAL">Material Dental</option>
                    <option value="INSTRUMENTAL">Instrumental</option>
                    <option value="MEDICAMENTO">Medicamento</option>
                    <option value="CONSUMIBLE">Consumible</option>
                    <option value="EQUIPAMIENTO">Equipamiento</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="label">Unidad de Medida</label>
                  <select className="input-field" value={formData.unidadMedida}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}>
                    <option value="UNIDAD">Unidad</option>
                    <option value="CAJA">Caja</option>
                    <option value="PAQUETE">Paquete</option>
                    <option value="LITRO">Litro</option>
                    <option value="KILOGRAMO">Kilogramo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Stock Inicial</label>
                  <input type="number" min="0" required className="input-field" value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="label">Stock Mínimo</label>
                  <input type="number" min="0" required className="input-field" value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="label">Precio Compra</label>
                  <input type="number" min="0" step="0.01" className="input-field" value={formData.precioCompra}
                    onChange={(e) => setFormData({ ...formData, precioCompra: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center space-x-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Movimiento de Inventario */}
      {showMovModal && movItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-foreground">Movimiento: {movItem.nombre}</h2>
              <button onClick={() => setShowMovModal(false)} className="p-1 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMovimiento} className="p-6 space-y-4">
              <div>
                <label className="label">Tipo de Movimiento</label>
                <select className="input-field" value={movForm.tipo}
                  onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                  <option value="AJUSTE">Ajuste</option>
                  <option value="DEVOLUCION">Devolución</option>
                </select>
              </div>
              <div>
                <label className="label">Cantidad</label>
                <input type="number" min="1" required className="input-field" value={movForm.cantidad}
                  onChange={(e) => setMovForm({ ...movForm, cantidad: parseInt(e.target.value) || 1 })} />
                <p className="text-xs text-muted-foreground mt-1">Stock actual: {movItem.stock}</p>
              </div>
              <div>
                <label className="label">Motivo (opcional)</label>
                <input type="text" className="input-field" placeholder="Ej: Compra a proveedor"
                  value={movForm.motivo} onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowMovModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center space-x-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{saving ? 'Registrando...' : 'Registrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

