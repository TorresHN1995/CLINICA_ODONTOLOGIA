'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Save, AlertTriangle, ShieldCheck, FileText, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Correlativo {
    id: string
    tipo: 'FACTURA' | 'ORDEN_PEDIDO'
    cai: string | null
    sucursal: string
    puntoEmision: string
    tipoDoc: string
    rangoInicial: number
    rangoFinal: number
    siguiente: number
    fechaLimite: string
    activo: boolean
}

export default function ConfiguracionFacturacionPage() {
    const [loading, setLoading] = useState(true)
    const [savingFactura, setSavingFactura] = useState(false)
    const [savingOrden, setSavingOrden] = useState(false)

    // Data State
    const [facturaConfig, setFacturaConfig] = useState<Correlativo | null>(null)
    const [ordenConfig, setOrdenConfig] = useState<Correlativo | null>(null)

    // Form State
    const [facturaForm, setFacturaForm] = useState({
        cai: '',
        sucursal: '000',
        puntoEmision: '001',
        tipoDoc: '01',
        rangoInicial: 1,
        rangoFinal: 0,
        siguiente: 1,
        fechaLimite: ''
    })

    const [ordenForm, setOrdenForm] = useState({
        sucursal: '000',
        puntoEmision: '001',
        tipoDoc: '00',
        rangoInicial: 1,
        rangoFinal: 999999,
        siguiente: 1,
        fechaLimite: ''
    })

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const response = await fetch('/api/configuracion/correlativos')
            if (response.ok) {
                const data: Correlativo[] = await response.json()

                // Encontrar activos o los más recientes
                const activeFactura = data.find(c => c.tipo === 'FACTURA' && c.activo) || data.find(c => c.tipo === 'FACTURA')
                const activeOrden = data.find(c => c.tipo === 'ORDEN_PEDIDO' && c.activo) || data.find(c => c.tipo === 'ORDEN_PEDIDO')

                setFacturaConfig(activeFactura || null)
                setOrdenConfig(activeOrden || null)

                if (activeFactura) {
                    setFacturaForm({
                        cai: activeFactura.cai || '',
                        sucursal: activeFactura.sucursal,
                        puntoEmision: activeFactura.puntoEmision,
                        tipoDoc: activeFactura.tipoDoc,
                        rangoInicial: activeFactura.rangoInicial,
                        rangoFinal: activeFactura.rangoFinal,
                        siguiente: activeFactura.siguiente,
                        fechaLimite: activeFactura.fechaLimite ? format(new Date(activeFactura.fechaLimite), 'yyyy-MM-dd') : ''
                    })
                }

                if (activeOrden) {
                    setOrdenForm({
                        sucursal: activeOrden.sucursal,
                        puntoEmision: activeOrden.puntoEmision,
                        tipoDoc: activeOrden.tipoDoc,
                        rangoInicial: activeOrden.rangoInicial,
                        rangoFinal: activeOrden.rangoFinal,
                        siguiente: activeOrden.siguiente,
                        fechaLimite: activeOrden.fechaLimite ? format(new Date(activeOrden.fechaLimite), 'yyyy-MM-dd') : ''
                    })
                }
            }
        } catch (error) {
            toast.error('Error al cargar configuración')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveFactura = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingFactura(true)

        try {
            const payload = {
                ...facturaForm,
                tipo: 'FACTURA',
                rangoInicial: Number(facturaForm.rangoInicial),
                rangoFinal: Number(facturaForm.rangoFinal),
                siguiente: Number(facturaForm.siguiente),
                activo: true
            }

            let url = '/api/configuracion/correlativos'
            let method = 'POST'

            if (facturaConfig) {
                url = `/api/configuracion/correlativos/${facturaConfig.id}`
                method = 'PUT'
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                toast.success('Configuración de Facturación actualizada')
                fetchConfig()
            } else {
                const data = await response.json()
                const errorMessage = typeof data.error === 'string'
                    ? data.error
                    : Array.isArray(data.error)
                        ? data.error.map((e: any) => e.message).join(', ')
                        : 'Error al guardar configuración'
                toast.error(errorMessage)
            }
        } catch (error) {
            console.error(error)
            toast.error('Error de conexión')
        } finally {
            setSavingFactura(false)
        }
    }

    const handleSaveOrden = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingOrden(true)

        try {
            const payload = {
                ...ordenForm,
                tipo: 'ORDEN_PEDIDO',
                rangoInicial: Number(ordenForm.rangoInicial),
                rangoFinal: Number(ordenForm.rangoFinal),
                siguiente: Number(ordenForm.siguiente),
                activo: true
            }

            let url = '/api/configuracion/correlativos'
            let method = 'POST'

            if (ordenConfig) {
                url = `/api/configuracion/correlativos/${ordenConfig.id}`
                method = 'PUT'
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                toast.success('Configuración de Órdenes actualizada')
                fetchConfig()
            } else {
                const data = await response.json()
                const errorMessage = typeof data.error === 'string'
                    ? data.error
                    : Array.isArray(data.error)
                        ? data.error.map((e: any) => e.message).join(', ')
                        : 'Error al guardar configuración'
                toast.error(errorMessage)
            }
        } catch (error) {
            console.error(error)
            toast.error('Error de conexión')
        } finally {
            setSavingOrden(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Configuración de Facturación (SAR)</h1>
                <p className="text-muted-foreground mt-1">Establece los parámetros de facturación autorizados por el SAR.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card Factura SAR */}
                <div className="card border-t-4 border-t-blue-600">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Facturación SAR</h2>
                            <p className="text-sm text-muted-foreground">Documento fiscal válido</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveFactura} className="space-y-4">
                        <div>
                            <label className="label">CAI</label>
                            <input
                                type="text"
                                className="input-field font-mono text-sm"
                                value={facturaForm.cai}
                                onChange={(e) => setFacturaForm({ ...facturaForm, cai: e.target.value })}
                                placeholder="AAAAAA-BBBBBB-CCCCCC-DDDDDD-EEEEEE-FF"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="label text-xs">Sucursal</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={facturaForm.sucursal}
                                    onChange={(e) => setFacturaForm({ ...facturaForm, sucursal: e.target.value })}
                                    maxLength={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label text-xs">Punto Emisión</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={facturaForm.puntoEmision}
                                    onChange={(e) => setFacturaForm({ ...facturaForm, puntoEmision: e.target.value })}
                                    maxLength={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label text-xs">Tipo Doc</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={facturaForm.tipoDoc}
                                    onChange={(e) => setFacturaForm({ ...facturaForm, tipoDoc: e.target.value })}
                                    maxLength={2}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Rango Inicial</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={facturaForm.rangoInicial}
                                    onChange={(e) => setFacturaForm({ ...facturaForm, rangoInicial: parseInt(e.target.value) })}
                                    min="1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Rango Final</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={facturaForm.rangoFinal}
                                    onChange={(e) => setFacturaForm({ ...facturaForm, rangoFinal: parseInt(e.target.value) })}
                                    min="1"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Siguiente Número</label>
                                <input
                                    type="number"
                                    className="input-field bg-muted"
                                    value={facturaForm.siguiente}
                                    onChange={(e) => setFacturaForm({ ...facturaForm, siguiente: parseInt(e.target.value) })}
                                    min="1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Último usado + 1</p>
                            </div>
                            <div>
                                <label className="label">Fecha Límite</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={facturaForm.fechaLimite}
                                    onChange={(e) => setFacturaForm({ ...facturaForm, fechaLimite: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex justify-end">
                            <button
                                type="submit"
                                disabled={savingFactura}
                                className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2"
                            >
                                {savingFactura ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Guardar Configuración</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Card Orden de Pedido */}
                <div className="card border-t-4 border-t-gray-500">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Orden de Pedido</h2>
                            <p className="text-sm text-muted-foreground">Control interno (Sin valor fiscal)</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveOrden} className="space-y-4">
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p>Este documento es para control interno y no sustituye a una factura fiscal autorizada por el SAR.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Prefijo</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={ordenForm.sucursal}
                                    onChange={(e) => setOrdenForm({ ...ordenForm, sucursal: e.target.value })}
                                    placeholder="Ej. ORDEN-"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">Identificador del documento</p>
                            </div>
                            <div>
                                <label className="label">Siguiente Correlativo</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={ordenForm.siguiente}
                                    onChange={(e) => setOrdenForm({ ...ordenForm, siguiente: parseInt(e.target.value) })}
                                    min="1"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">Número actual</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex justify-end">
                            <button
                                type="submit"
                                disabled={savingOrden}
                                className="btn-secondary w-full sm:w-auto flex items-center justify-center space-x-2"
                            >
                                {savingOrden ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Guardar Configuración</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
