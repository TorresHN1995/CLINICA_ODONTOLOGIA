
import { useQuery } from '@tanstack/react-query'

interface ConfiguracionEmpresa {
    id: number
    nombre: string
    rtn: string | null
    telefono: string | null
    email: string | null
    direccion: string | null
    ciudad: string | null
    pais: string
    moneda: string
    simboloMoneda: string
    formatoFecha: string
    logo: string | null
}

export function useConfiguracion() {
    return useQuery<ConfiguracionEmpresa>({
        queryKey: ['configuracion-empresa'],
        queryFn: async () => {
            const res = await fetch('/api/configuracion/empresa')
            if (!res.ok) throw new Error('Error al cargar configuración')
            return res.json()
        },
        staleTime: 1000 * 60 * 60, // 1 hora
    })
}
