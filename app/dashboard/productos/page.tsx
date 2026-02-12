'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, ShoppingBag, Wrench, X, Loader2, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'

interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: 'PRODUCTO' | 'SERVICIO'
  precio: number
  isv: number
  activo: boolean
}

export default function ProductosPage() {
  const { data: config } = useConfiguracion()
  const moneda = config?.simboloMoneda || 'L.'

  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [loading, setLoading] = useState(true)
  const [productos, setProductos] = useState<Producto[]>([])
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'SERVICIO' as 'PRODUCTO' | 'SERVICIO',
    precio: 0,
    isv: 15,
  })

  const cargar = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (filtroTipo !== 'TODOS') query.set('tipo', filtroTipo)
      const res = await fetch(`/api/productos?${query.toString()}`)
      if (res.ok) setProductos(await res.json())
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [search, filtroTipo])

  const abrirNuevo = () => {
    setEditando(null)
    setFormData({ codigo: '', nombre: '', descripcion: '', tipo: 'SERVICIO', precio: 0, isv: 15 })
    setShowModal(true)
  }

  const abrirEditar = (p: Producto) => {
    setEditando(p)
    setFormData({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      tipo: p.tipo,
      precio: Number(p.precio),
      isv: Number(p.isv),
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const url = editando ? `/api/productos/${editando.id}` : '/api/productos'
      const method = editando ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success(editando ? 'Producto actualizado' : 'Producto creado')
        setShowModal(false)
        cargar()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (p: Producto) => {
    try {
      const res = await fetch(`/api/productos/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !p.activo }),
      })
      if (res.ok) {
        toast.success(p.activo ? 'Producto desactivado' : 'Producto activado')
        cargar()
      }
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const calcularPrecioBase = (precio: number, isv: number) => {
    return precio / (1 + isv / 100)
  }

  const calcularISV = (precio: number, isv: number) => {
    return precio - calcularPrecioBase(precio, isv)
  }

  const totalProductos = productos.filter(p => p.tipo === 'PRODUCTO').length
  const totalServicios = productos.filter(p => p.tipo === 'SERVICIO').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos y Servicios</h1>
          <p className="text-muted-foreground">Catálogo de productos y servicios ofrecidos</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto/Servicio</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Productos</p>
            <p className="text-2xl font-bold text-foreground">{totalProductos}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Servicios</p>
            <p className="text-2xl font-bold text-foreground">{totalServicios}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Activos</p>
            <p className="text-2xl font-bold text-foreground">{productos.length}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['TODOS', 'PRODUCTO', 'SERVICIO'].map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroTipo === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : t === 'PRODUCTO' ? 'Productos' : 'Servicios'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron productos o servicios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Código</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Precio (Inc. ISV)</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">ISV %</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Precio Base</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Estado</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{p.codigo}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{p.nombre}</div>
                      {p.descripcion && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{p.descripcion}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.tipo === 'PRODUCTO'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {p.tipo === 'PRODUCTO' ? 'Producto' : 'Servicio'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">{moneda} {Number(p.precio).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono">{Number(p.isv).toFixed(0)}%</td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {moneda} {calcularPrecioBase(Number(p.precio), Number(p.isv)).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => toggleActivo(p)} title={p.activo ? 'Desactivar' : 'Activar'}>
                        {p.activo ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => abrirEditar(p)} className="text-primary-600 hover:text-primary-800 p-1" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {editando ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo */}
              <div>
                <label className="label">Tipo</label>
                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'SERVICIO' })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.tipo === 'SERVICIO'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-border text-muted-foreground hover:border-green-300'
                    }`}
                  >
                    <Wrench className="w-4 h-4 inline mr-2" />Servicio
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'PRODUCTO' })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.tipo === 'PRODUCTO'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-border text-muted-foreground hover:border-blue-300'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 inline mr-2" />Producto
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="SRV-001"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Nombre</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Limpieza dental"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Descripción (opcional)</label>
                <textarea
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Descripción del producto o servicio..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio (Inc. ISV)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">ISV (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    className="input-field"
                    value={formData.isv}
                    onChange={(e) => setFormData({ ...formData, isv: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Preview de desglose */}
              {formData.precio > 0 && (
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Precio Base:</span>
                    <span className="font-mono">{moneda} {calcularPrecioBase(formData.precio, formData.isv).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ISV ({formData.isv}%):</span>
                    <span className="font-mono">{moneda} {calcularISV(formData.precio, formData.isv).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-1">
                    <span>Total:</span>
                    <span className="font-mono">{moneda} {formData.precio.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
