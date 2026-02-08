'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { toast } from 'react-hot-toast'

interface Configuracion {
    nombre: string
    moneda: string
    simboloMoneda: string
    formatoFecha: string
    logo?: string
}

interface ConfiguracionContextType {
    configuracion: Configuracion | null
    loading: boolean
    formatearMoneda: (monto: number | string) => string
}

const ConfiguracionContext = createContext<ConfiguracionContextType>({
    configuracion: null,
    loading: true,
    formatearMoneda: () => '',
})

export function useConfiguracion() {
    return useContext(ConfiguracionContext)
}

export function ConfiguracionProvider({ children }: { children: ReactNode }) {
    const [configuracion, setConfiguracion] = useState<Configuracion | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchConfiguracion = async () => {
            try {
                const response = await fetch('/api/configuracion/empresa')
                if (response.ok) {
                    const data = await response.json()
                    if (data) {
                        setConfiguracion(data)
                    }
                }
            } catch (error) {
                console.error('Error al cargar configuración:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchConfiguracion()
    }, [])

    const formatearMoneda = (monto: number | string) => {
        const numero = typeof monto === 'string' ? parseFloat(monto) : monto
        const simbolo = configuracion?.simboloMoneda || 'L.'

        // We can use Intl.NumberFormat if we want to respect locales properly, 
        // but for now, let's stick to the requested symbol format.
        // Assuming the user wants "[Symbol][Amount]" e.g. "L.1,234.56" or "$1,234.56"
        return `${simbolo} ${numero.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <ConfiguracionContext.Provider value={{ configuracion, loading, formatearMoneda }}>
            {children}
        </ConfiguracionContext.Provider>
    )
}
