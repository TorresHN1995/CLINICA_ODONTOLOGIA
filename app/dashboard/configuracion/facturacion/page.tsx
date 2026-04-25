'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Save, ShieldCheck, Loader2 } from 'lucide-react'
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
    const [saving, setSaving] = useState(false)
    const [facturaConfig, setFacturaConfig] = useState<Correlativo | null>(null)
    const [form, setForm] = useState({
        cai: '',
        sucursal: '000',
        puntoEmision: '001',
        tipoDoc: '01',
        rangoInicial: 1,
        rangoFinal: 0,
        siguiente: 1,
        fechaLimite: ''
    })

    useEffect(() => { fetchConfig() }, [])

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/configuracion/correlativos')
            if (res.ok) {
                const data: Correlativo[] = await res.json()
                const activo = data.find(c => c.tipo === 'FACTURA' && c.activo) || data.find(c => c.tipo === 'FACTURA')
                setFacturaConfig(activo || null)
                if (activo) {
                    setForm({
                        cai: activo.cai || '',
                        sucursal: activo.sucursal,
                        puntoEmision: activo.puntoEmision,
                        tipoDoc: activo.tipoDoc,
                        rangoInicial: activo.rangoInicial,
                        rangoFinal: activo.rangoFinal,
                        siguiente: activo.siguiente,
                        fechaLimite: activo.fechaLimite ? format(new Date(activo.fechaLimite), 'yyyy-MM-dd') : ''
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
                ...form,
                tipo: 'FACTURA',
                rangoInicial: Number(form.rangoInicial),
                rangoFinal: Number(form.rangoFinal),
                siguiente: Number(form.siguiente),
                activo: true
            }
            const url = facturaConfig ? `/api/configuracion/correlativos/${facturaConfig.id}` : '/api/configuracion/correlativos'
            const method = facturaConfig ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            if (res.ok) {
                toast.success('Configuración SAR guardada')
                fetchConfig()
            } else {
                const data = await res.json()
                toast.error(typeof data.error === 'string' ? data.error : Array.isArray(data.error) ? data.error.map((e: any) => e.message).join(', ') : 'Error al guardar')
            }
        } catch {
            toast.error('Error de conexión')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Facturación SAR</h1>
                <p className="text-muted-foreground mt-1">Parámetros de facturación autorizados por el SAR.</p>
            </div>

            <div className="card border-t-4 border-t-blue-600">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Configuración SAR</h2>
                        <p className="text-sm text-muted-foreground">Documento fiscal válido</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">CAI</label>
                        <input type="text" className="input-field font-mono text-sm" value={form.cai}
                            onChange={(e) => setForm({ ...form, cai: e.target.value })}
                            placeholder="AAAAAA-BBBBBB-CCCCCC-DDDDDD-EEEEEE-FF" required />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="label text-xs">Sucursal</label>
                            <input type="text" className="input-field" value={form.sucursal}
                                onChange={(e) => setForm({ ...form, sucursal: e.target.value })} maxLength={3} required />
                        </div>
                        <div>
                            <label className="label text-xs">Punto Emisión</label>
                            <input type="text" className="input-field" value={form.puntoEmision}
                                onChange={(e) => setForm({ ...form, puntoEmision: e.target.value })} maxLength={3} required />
                        </div>
                        <div>
                            <label className="label text-xs">Tipo Doc</label>
                            <input type="text" className="input-field" value={form.tipoDoc}
                                onChange={(e) => setForm({ ...form, tipoDoc: e.target.value })} maxLength={2} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Rango Inicial</label>
                            <input type="number" className="input-field" value={form.rangoInicial}
                                onChange={(e) => setForm({ ...form, rangoInicial: parseInt(e.target.value) })} min="1" required />
                        </div>
                        <div>
                            <label className="label">Rango Final</label>
                            <input type="number" className="input-field" value={form.rangoFinal}
                                onChange={(e) => setForm({ ...form, rangoFinal: parseInt(e.target.value) })} min="1" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Siguiente Número</label>
                            <input type="number" className="input-field bg-muted" value={form.siguiente}
                                onChange={(e) => setForm({ ...form, siguiente: parseInt(e.target.value) })} min="1" />
                            <p className="text-xs text-muted-foreground mt-1">Último usado + 1</p>
                        </div>
                        <div>
                            <label className="label">Fecha Límite</label>
                            <input type="date" className="input-field" value={form.fechaLimite}
                                onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })} required />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                        <button type="submit" disabled={saving} className="btn-primary flex items-center space-x-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Guardar Configuración</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
