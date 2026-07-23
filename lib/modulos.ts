// Catálogo de módulos del sistema y permisos por usuario.
//
// Este archivo lo importa también el middleware (edge runtime), así que solo
// puede contener datos y funciones puras: nada de Prisma, Node ni React.

export interface Modulo {
  /** Identificador que se guarda en `usuarios.permisos`. */
  key: string
  label: string
  /**
   * Ruta base del módulo dentro del dashboard. `null` para los permisos que no
   * son una pantalla propia sino una parte de otra (p. ej. las estadísticas del
   * dashboard): esos no participan en el bloqueo por URL.
   */
  href: string | null
  descripcion: string
  grupo: GrupoModulo
}

export type GrupoModulo = 'Clínica' | 'Comercial y facturación' | 'Operación' | 'Administración'

export const GRUPOS: GrupoModulo[] = [
  'Clínica',
  'Comercial y facturación',
  'Operación',
  'Administración',
]

/** El inicio del dashboard siempre es accesible: es la pantalla a la que se cae al entrar. */
export const RUTA_INICIO = '/dashboard'

export const MODULOS: Modulo[] = [
  // Clínica
  { key: 'pacientes', label: 'Pacientes', href: '/dashboard/pacientes', grupo: 'Clínica', descripcion: 'Fichas, datos de contacto e historial del paciente' },
  { key: 'odontologos', label: 'Odontólogos', href: '/dashboard/odontologos', grupo: 'Clínica', descripcion: 'Profesionales, especialidades y desempeño' },
  { key: 'citas', label: 'Agenda y Citas', href: '/dashboard/citas', grupo: 'Clínica', descripcion: 'Calendario de citas y cambios de estado' },
  { key: 'expedientes', label: 'Expedientes', href: '/dashboard/expedientes', grupo: 'Clínica', descripcion: 'Odontograma, diagnóstico y notas de evolución' },
  { key: 'tratamientos', label: 'Tratamientos', href: '/dashboard/tratamientos', grupo: 'Clínica', descripcion: 'Planes de tratamiento y sus etapas' },

  // Comercial y facturación
  { key: 'presupuestos', label: 'Cotizaciones', href: '/dashboard/presupuestos', grupo: 'Comercial y facturación', descripcion: 'Presupuestos para el paciente' },
  { key: 'documentos', label: 'Documentos', href: '/dashboard/documentos', grupo: 'Comercial y facturación', descripcion: 'Consentimientos y documentos impresos' },
  { key: 'facturacion', label: 'Facturación', href: '/dashboard/facturacion', grupo: 'Comercial y facturación', descripcion: 'Emisión de facturas y notas de crédito' },
  { key: 'cuentas-por-cobrar', label: 'Cuentas por Cobrar', href: '/dashboard/cuentas-por-cobrar', grupo: 'Comercial y facturación', descripcion: 'Saldos pendientes y cobros' },
  { key: 'productos', label: 'Productos/Servicios', href: '/dashboard/productos', grupo: 'Comercial y facturación', descripcion: 'Catálogo de servicios y precios' },

  // Operación
  { key: 'estadisticas', label: 'Estadísticas del dashboard', href: null, grupo: 'Operación', descripcion: 'Indicadores y resumen del mes en la pantalla de inicio' },
  { key: 'inventario', label: 'Inventario', href: '/dashboard/inventario', grupo: 'Operación', descripcion: 'Existencias de insumos y materiales' },
  { key: 'compras', label: 'Compras', href: '/dashboard/compras', grupo: 'Operación', descripcion: 'Ingreso de compras a proveedores' },
  { key: 'contabilidad', label: 'Contabilidad', href: '/dashboard/contabilidad', grupo: 'Operación', descripcion: 'Ingresos, egresos y flujo de caja' },
  { key: 'cierre-caja', label: 'Cierre de Caja', href: '/dashboard/cierre-caja', grupo: 'Operación', descripcion: 'Arqueo y cierre diario' },
  { key: 'reportes', label: 'Reportes', href: '/dashboard/reportes', grupo: 'Operación', descripcion: 'Reportes clínicos y financieros' },

  // Administración
  { key: 'usuarios', label: 'Usuarios', href: '/dashboard/usuarios', grupo: 'Administración', descripcion: 'Altas de usuarios y permisos de acceso' },
  { key: 'auditoria', label: 'Auditoría', href: '/dashboard/auditoria', grupo: 'Administración', descripcion: 'Bitácora de acciones del sistema' },
  { key: 'admin', label: 'Administración', href: '/dashboard/admin', grupo: 'Administración', descripcion: 'Respaldos y mantenimiento de la base de datos' },
  { key: 'configuracion', label: 'Configuración', href: '/dashboard/configuracion', grupo: 'Administración', descripcion: 'Datos de la empresa, SAR y formatos' },
]

export const TODAS_LAS_KEYS = MODULOS.map((m) => m.key)

/** Accesos que trae marcados por defecto cada rol al crear el usuario. */
export const PRESETS_POR_ROL: Record<string, string[]> = {
  ADMINISTRADOR: TODAS_LAS_KEYS,
  ODONTOLOGO: ['pacientes', 'citas', 'expedientes', 'tratamientos', 'presupuestos', 'documentos'],
  ASISTENTE: ['pacientes', 'citas', 'expedientes', 'tratamientos', 'inventario'],
  RECEPCION: [
    'pacientes',
    'citas',
    'expedientes',
    'presupuestos',
    'documentos',
    'facturacion',
    'cuentas-por-cobrar',
    'cierre-caja',
  ],
}

export function moduloPorKey(key: string): Modulo | undefined {
  return MODULOS.find((m) => m.key === key)
}

/** Deja solo las keys que existen en el catálogo, sin repetir y en orden del menú. */
export function normalizarPermisos(keys: unknown): string[] {
  if (!Array.isArray(keys)) return []
  const set = new Set(keys.filter((k): k is string => typeof k === 'string'))
  return TODAS_LAS_KEYS.filter((k) => set.has(k))
}

/** Lee la columna `usuarios.permisos` (JSON). Devuelve null si el usuario nunca tuvo permisos guardados. */
export function parsePermisos(valor: string | null | undefined): string[] | null {
  if (!valor) return null
  try {
    const parsed = JSON.parse(valor)
    if (!Array.isArray(parsed)) return null
    return normalizarPermisos(parsed)
  } catch {
    return null
  }
}

/**
 * Permisos efectivos de un usuario.
 *
 * - El ADMINISTRADOR siempre tiene todo: así nadie se deja fuera del módulo de
 *   usuarios y se queda sin poder corregirlo.
 * - Si el usuario no tiene permisos guardados (cuentas creadas antes de esta
 *   función), se usa el preset de su rol para no cambiarle el acceso de golpe.
 */
export function permisosEfectivos(rol: string, permisos: string[] | null | undefined): string[] {
  if (rol === 'ADMINISTRADOR') return TODAS_LAS_KEYS
  if (permisos === null || permisos === undefined) return PRESETS_POR_ROL[rol] || []
  return normalizarPermisos(permisos)
}

/** Módulo al que pertenece una ruta del dashboard, o null si es el inicio u otra cosa. */
export function moduloDeRuta(pathname: string): Modulo | null {
  // Se recorre de href más largo a más corto para que /dashboard/configuracion/facturacion
  // resuelva a «configuracion» y no a un módulo con prefijo más corto.
  const candidatos = MODULOS.filter((m) => m.href).sort(
    (a, b) => (b.href as string).length - (a.href as string).length
  )
  return (
    candidatos.find((m) => pathname === m.href || pathname.startsWith(m.href + '/')) || null
  )
}

/** ¿Este usuario tiene habilitado un módulo concreto? */
export function tienePermiso(key: string, rol: string, permisos: string[] | null | undefined): boolean {
  return permisosEfectivos(rol, permisos).includes(key)
}

/** ¿Puede este usuario abrir esta ruta del dashboard? */
export function puedeAcceder(pathname: string, rol: string, permisos: string[] | null | undefined): boolean {
  if (pathname === RUTA_INICIO) return true
  const modulo = moduloDeRuta(pathname)
  if (!modulo) return true // rutas sueltas del dashboard no catalogadas
  return permisosEfectivos(rol, permisos).includes(modulo.key)
}
