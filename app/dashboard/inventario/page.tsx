'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Package, AlertTriangle } from 'lucide-react'

export default function InventarioPage() {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [inventario, setInventario] = useState<Array<{
    id: string
    codigo: string
    nombre: string
    categoria: string
    stock: number
    stockMinimo: number
    unidadMedida: string
  }>>([])

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

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Inventario</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los materiales e insumos de la clínica
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventario.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{item.codigo}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.categoria.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${item.stock < item.stockMinimo ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.stockMinimo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.unidadMedida}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

