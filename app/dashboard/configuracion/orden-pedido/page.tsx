'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Save, FileText, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Correlativo {
    id: string
    tipo: 'FACTURA' | 'ORDEN_PEDIDO'
    sucursal: string
    puntoEmision: string
    tipoDoc: string
    rangoInicial: number
    rangoFinal: number
    siguiente: number
    fechaLimite: string
    activo: boolean
}

export default function ConfiguracionOrdenPedidoPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [ordenConfig, setOrdenConfig] = useState<Correlativo | null>(null)

    const [form, setForm] = useState({
        sucursal: 'OP',
        siguiente: 1,
        rangoInicial: 1,
        rangoFinal: 999999,
    })

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/configuracion/correlativos')
            if (res.ok) {
                const data: Correlativo[] = await res.json()
                const orden = data.find(c => c.tipo === 'ORDEN_PEDIDO' && c.activo) || data.find(c => c.tipo === 'ORDEN_PEDIDO')
                setOrdenConfig(orden || null)
                if (orden) {
                    setForm({
                        sucursal: orden.sucursal,
                        siguiente: orden.siguiente,
                        rangoInicial: orden.rangoInicial,
                        rangoFinal: orden.rangoFinal,
                    })
                }
            }
        } catch {
            toast.error('Error al cargar configuración')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                tipo: 'ORDEN_PEDIDO',
                sucursal: form.sucursal,
                puntoEmision: '',
                tipoDoc: '',
                rangoInicial: Number(form.rangoInicial),
                rangoFinal: Number(form.rangoFinal),
                siguiente: Number(form.siguiente),
                fechaLimite: '2099-12-31',
                activo: true,
            }

            const url = ordenConfig
                ? `/api/configuracion/correlativos/${ordenConfig.id}`
                : '/api/configuracion/correlativos'
            const method = ordenConfig ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                toast.success('Configuración de Orden de Pedido guardada')
                fetchConfig()
            } else {
                const data = await res.json()
                toast.error(typeof data.error === 'string' ? data.error : 'Error al guardar')
            }
        } catch {
            toast.error('Error de conexión')
        } finally {
            setSaving(false)
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
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/configuracion" className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Orden de Pedido</h1>
                    <p className="text-muted-foreground mt-1">Configura la numeración de órdenes de pedido internas</p>
                </div>
            </div>

            <div className="card border-t-4 border-t-amber-500">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Configuración de Numeración</h2>
                        <p className="text-sm text-muted-foreground">Control interno — Sin valor fiscal</p>
                    </div>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-sm rounded-lg flex items-start space-x-2 mb-6">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>Este documento es para control interno y no sustituye a una factura fiscal autorizada por el SAR.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="label">Prefijo</label>
                        <input
                            type="text"
                            className="input-field"
                            value={form.sucursal}
                            onChange={(e) => setForm({ ...form, sucursal: e.target.value })}
                            placeholder="Ej: OP"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Las órdenes se generarán como: <span className="font-mono font-semibold">{form.sucursal}-00001</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="label">Rango Inicial</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.rangoInicial}
                                onChange={(e) => setForm({ ...form, rangoInicial: parseInt(e.target.value) || 1 })}
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Rango Final</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.rangoFinal}
                                onChange={(e) => setForm({ ...form, rangoFinal: parseInt(e.target.value) || 1 })}
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Siguiente Número</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.siguiente}
                                onChange={(e) => setForm({ ...form, siguiente: parseInt(e.target.value) || 1 })}
                                min="1"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">Número actual</p>
                        </div>
                    </div>

                    {ordenConfig && (
                        <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                            Última orden emitida: <span className="font-semibold font-mono">{ordenConfig.sucursal}-{String(ordenConfig.siguiente - 1).padStart(5, '0')}</span>
                        </div>
                    )}

                    <div className="pt-4 border-t border-border flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary flex items-center space-x-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Guardar Configuración</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
