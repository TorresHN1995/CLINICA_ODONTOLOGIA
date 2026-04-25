'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, ShoppingBag, Wrench, X, Loader2, Edit2, ToggleLeft, ToggleRight, Package, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'

interface Insumo {
  id: string
  inventarioId: string
  cantidad: number
  inventario: { id: string; nombre: string; codigo: string; unidadMedida: string; stock: number; stockMinimo: number }
}

interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: 'PRODUCTO' | 'SERVICIO'
  precio: number
  isv: number
  activo: boolean
  insumos?: Insumo[]
}

interface InventarioItem {
  id: string
  codigo: string
  nombre: string
  unidadMedida: string
  stock: number
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

  // Insumos
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [inventarioItems, setInventarioItems] = useState<InventarioItem[]>([])
  const [showInsumos, setShowInsumos] = useState(false)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState('')
  const [cantidadInsumo, setCantidadInsumo] = useState(1)
  const [savingInsumo, setSavingInsumo] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '', nombre: '', descripcion: '', tipo: 'SERVICIO' as 'PRODUCTO' | 'SERVICIO', precio: 0, isv: 15,
  })

  const cargar = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (filtroTipo !== 'TODOS') query.set('tipo', filtroTipo)
      const res = await fetch(`/api/productos?${query.toString()}`)
      if (res.ok) setProductos(await res.json())
    } catch { } finally { setLoading(false) }
  }

  const cargarInventario = async () => {
    const res = await fetch('/api/inventario')
    if (res.ok) setInventarioItems(await res.json())
  }

  const cargarInsumos = async (productoId: string) => {
    const res = await fetch(`/api/productos/${productoId}/insumos`)
    if (res.ok) setInsumos(await res.json())
  }

  useEffect(() => { cargar() }, [search, filtroTipo])

  const abrirNuevo = () => {
    setEditando(null)
    setInsumos([])
    setShowInsumos(false)
    setFormData({ codigo: '', nombre: '', descripcion: '', tipo: 'SERVICIO', precio: 0, isv: 15 })
    cargarInventario()
    setShowModal(true)
  }

  const abrirEditar = async (p: Producto) => {
    setEditando(p)
    setFormData({ codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '', tipo: p.tipo, precio: Number(p.precio), isv: Number(p.isv) })
    setShowInsumos(false)
    await cargarInventario()
    await cargarInsumos(p.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const url = editando ? `/api/productos/${editando.id}` : '/api/productos'
      const method = editando ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (res.ok) {
        const data = await res.json()
        if (!editando) {
          // Al crear, quedarse en el modal en modo edición para agregar insumos
          toast.success('Producto creado. Ahora puedes agregar insumos.')
          setEditando(data)
          await cargarInsumos(data.id)
          setShowInsumos(true)
        } else {
          toast.success('Producto actualizado')
          setShowModal(false)
        }
        cargar()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al guardar')
      }
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }

  const agregarInsumo = async () => {
    if (!editando || !insumoSeleccionado) return
    setSavingInsumo(true)
    try {
      const res = await fetch(`/api/productos/${editando.id}/insumos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventarioId: insumoSeleccionado, cantidad: cantidadInsumo }),
      })
      if (res.ok) {
        toast.success('Insumo agregado')
        setInsumoSeleccionado('')
        setCantidadInsumo(1)
        await cargarInsumos(editando.id)
        cargar()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Error al agregar insumo')
      }
    } catch { toast.error('Error al agregar insumo') } finally { setSavingInsumo(false) }
  }

  const eliminarInsumo = async (insumoId: string) => {
    if (!editando) return
    const res = await fetch(`/api/productos/${editando.id}/insumos?insumoId=${insumoId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Insumo eliminado')
      await cargarInsumos(editando.id)
      cargar()
    }
  }

  const toggleActivo = async (p: Producto) => {
    const res = await fetch(`/api/productos/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: !p.activo }) })
    if (res.ok) { toast.success(p.activo ? 'Desactivado' : 'Activado'); cargar() }
  }

  const calcularPrecioBase = (precio: number, isv: number) => precio / (1 + isv / 100)
  const calcularISV = (precio: number, isv: number) => precio - calcularPrecioBase(precio, isv)

  const totalProductos = productos.filter(p => p.tipo === 'PRODUCTO').length
  const totalServicios = productos.filter(p => p.tipo === 'SERVICIO').length

  // Insumos disponibles (los que no están ya agregados)
  const insumosDisponibles = inventarioItems.filter(i => !insumos.find(ins => ins.inventarioId === i.id))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos y Servicios</h1>
          <p className="text-muted-foreground">Catálogo con insumos de inventario por servicio</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" /><span>Nuevo Producto/Servicio</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><ShoppingBag className="w-6 h-6" /></div>
          <div><p className="text-sm text-muted-foreground">Productos</p><p className="text-2xl font-bold text-foreground">{totalProductos}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><Wrench className="w-6 h-6" /></div>
          <div><p className="text-sm text-muted-foreground">Servicios</p><p className="text-2xl font-bold text-foreground">{totalServicios}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center"><Package className="w-6 h-6" /></div>
          <div><p className="text-sm text-muted-foreground">Total Activos</p><p className="text-2xl font-bold text-foreground">{productos.length}</p></div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar por código o nombre..." className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {['TODOS', 'PRODUCTO', 'SERVICIO'].map(t => (
              <button key={t} onClick={() => setFiltroTipo(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === t ? 'bg-primary-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {t === 'TODOS' ? 'Todos' : t === 'PRODUCTO' ? 'Productos' : 'Servicios'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
        ) : productos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No se encontraron productos o servicios</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Código</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Precio (Inc. ISV)</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Insumos</th>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.tipo === 'PRODUCTO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {p.tipo === 'PRODUCTO' ? 'Producto' : 'Servicio'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">{moneda} {Number(p.precio).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {p.tipo === 'SERVICIO' && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="w-3 h-3" />
                          {(p.insumos?.length || 0)} insumo{(p.insumos?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => toggleActivo(p)} title={p.activo ? 'Desactivar' : 'Activar'}>
                        {p.activo ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
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
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold text-foreground">{editando ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Tipo */}
              <div>
                <label className="label">Tipo</label>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setFormData({ ...formData, tipo: 'SERVICIO' })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${formData.tipo === 'SERVICIO' ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-muted-foreground hover:border-green-300'}`}>
                    <Wrench className="w-4 h-4 inline mr-2" />Servicio
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, tipo: 'PRODUCTO' })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${formData.tipo === 'PRODUCTO' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-border text-muted-foreground hover:border-blue-300'}`}>
                    <ShoppingBag className="w-4 h-4 inline mr-2" />Producto
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código</label>
                  <input type="text" required className="input-field" placeholder="SRV-001" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
                </div>
                <div>
                  <label className="label">Nombre</label>
                  <input type="text" required className="input-field" placeholder="Limpieza dental" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Descripción (opcional)</label>
                <textarea rows={2} className="input-field resize-none" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio (Inc. ISV)</label>
                  <input type="number" required min="0" step="0.01" className="input-field" value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="label">ISV (%)</label>
                  <input type="number" required min="0" max="100" step="0.01" className="input-field" value={formData.isv} onChange={(e) => setFormData({ ...formData, isv: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              {formData.precio > 0 && (
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between text-muted-foreground"><span>Precio Base:</span><span className="font-mono">{moneda} {calcularPrecioBase(formData.precio, formData.isv).toFixed(2)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>ISV ({formData.isv}%):</span><span className="font-mono">{moneda} {calcularISV(formData.precio, formData.isv).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-1"><span>Total:</span><span className="font-mono">{moneda} {formData.precio.toFixed(2)}</span></div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editando ? 'Actualizar' : (formData.tipo === 'SERVICIO' ? 'Crear y agregar insumos →' : 'Crear')}
                </button>
              </div>
            </form>

            {/* Sección de Insumos — solo si ya existe el producto */}
            {editando && (
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowInsumos(!showInsumos)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-foreground">Insumos de Inventario</span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{insumos.length} configurado{insumos.length !== 1 ? 's' : ''}</span>
                  </div>
                  {showInsumos ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {showInsumos && (
                  <div className="px-5 pb-5 space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Estos insumos se descontarán automáticamente del inventario al facturar este servicio.
                    </p>

                    {/* Lista de insumos actuales */}
                    {insumos.length > 0 && (
                      <div className="space-y-2">
                        {insumos.map(ins => (
                          <div key={ins.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{ins.inventario.nombre}</p>
                                <p className="text-xs text-muted-foreground">{ins.inventario.codigo} · Stock: {ins.inventario.stock} {ins.inventario.unidadMedida}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-foreground bg-card px-3 py-1 rounded border border-border">
                                x{ins.cantidad}
                              </span>
                              <button onClick={() => eliminarInsumo(ins.id)} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agregar nuevo insumo */}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="label text-xs">Insumo de inventario</label>
                        <select className="input-field text-sm" value={insumoSeleccionado} onChange={(e) => setInsumoSeleccionado(e.target.value)}>
                          <option value="">Seleccionar insumo...</option>
                          {insumosDisponibles.map(i => (
                            <option key={i.id} value={i.id}>{i.nombre} ({i.codigo}) — Stock: {i.stock}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="label text-xs">Cant.</label>
                        <input type="number" min="1" className="input-field text-sm text-center" value={cantidadInsumo} onChange={(e) => setCantidadInsumo(parseInt(e.target.value) || 1)} />
                      </div>
                      <button
                        type="button"
                        onClick={agregarInsumo}
                        disabled={!insumoSeleccionado || savingInsumo}
                        className="btn-primary px-3 py-2 flex items-center gap-1 text-sm disabled:opacity-50"
                      >
                        {savingInsumo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Agregar
                      </button>
                    </div>

                    {/* Botón Listo */}
                    <div className="flex justify-end pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="btn-primary px-6"
                      >
                        Listo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
