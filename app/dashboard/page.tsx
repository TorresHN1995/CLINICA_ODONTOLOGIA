import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { moduloPorKey, tienePermiso } from '@/lib/modulos'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

/** Agenda del día: es la operación diaria y la ve cualquier usuario del sistema. */
async function getCitasHoy() {
  const hoy = new Date()

  return prisma.cita.findMany({
    where: {
      fecha: {
        gte: startOfDay(hoy),
        lte: endOfDay(hoy)
      }
    },
    include: {
      paciente: true,
      odontologo: true
    },
    orderBy: {
      horaInicio: 'asc'
    }
  })
}

/**
 * Indicadores del negocio (pacientes, ingresos, resumen del mes). Solo se
 * consultan si el usuario tiene el permiso «estadisticas»: así los datos de
 * facturación ni siquiera se leen para quien no debe verlos.
 */
async function getEstadisticas() {
  const hoy = new Date()
  const inicioMes = startOfMonth(hoy)
  const finMes = endOfMonth(hoy)

  // Total de pacientes activos
  const totalPacientes = await prisma.paciente.count({
    where: { activo: true }
  })

  // Pacientes nuevos este mes
  const pacientesNuevos = await prisma.paciente.count({
    where: {
      activo: true,
      createdAt: {
        gte: inicioMes,
        lte: finMes
      }
    }
  })

  // Estadísticas de citas del mes
  const citasMes = await prisma.cita.groupBy({
    by: ['estado'],
    where: {
      fecha: {
        gte: inicioMes,
        lte: finMes
      }
    },
    _count: true
  })

  // Ingresos del mes
  const ingresosMes = await prisma.factura.aggregate({
    where: {
      fecha: {
        gte: inicioMes,
        lte: finMes
      },
      estado: {
        in: ['PAGADA', 'PAGADA_PARCIAL']
      }
    },
    _sum: {
      total: true
    }
  })

  // Facturas pendientes
  const facturasPendientes = await prisma.factura.count({
    where: {
      estado: {
        in: ['PENDIENTE', 'PAGADA_PARCIAL']
      }
    }
  })

  // Configuración de empresa
  const config = await prisma.configuracionEmpresa.findFirst({
    where: { activo: true }
  })

  return {
    totalPacientes,
    pacientesNuevos,
    citasMes,
    ingresosMes: ingresosMes._sum.total || 0,
    facturasPendientes,
    simboloMoneda: config?.simboloMoneda || 'L.'
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { sinAcceso?: string }
}) {
  const session = await getServerSession(authOptions)
  const rol = session?.user?.role || ''
  const permisos = session?.user?.permisos
  const puedeVerEstadisticas = tienePermiso('estadisticas', rol, permisos)

  const citasHoy = await getCitasHoy()
  const stats = puedeVerEstadisticas ? await getEstadisticas() : null

  // middleware.ts redirige aquí con ?sinAcceso=<modulo> cuando alguien abre por
  // URL un módulo que no tiene habilitado.
  const moduloBloqueado = searchParams?.sinAcceso
    ? moduloPorKey(searchParams.sinAcceso)
    : null

  const citasCompletadas = stats?.citasMes.find(c => c.estado === 'COMPLETADA')?._count || 0
  const citasCanceladas = stats?.citasMes.find(c => c.estado === 'CANCELADA')?._count || 0
  const citasProgramadas = stats?.citasMes.find(c => c.estado === 'PROGRAMADA')?._count || 0

  // Los accesos directos apuntan a otros módulos: se muestran solo los que este
  // usuario puede abrir, si no llevarían a la pantalla de "sin acceso".
  const accesosRapidos = [
    { modulo: 'pacientes', href: '/dashboard/pacientes/nuevo', label: 'Nuevo Paciente', Icon: Users, color: 'blue' },
    { modulo: 'citas', href: '/dashboard/citas/nueva', label: 'Nueva Cita', Icon: Calendar, color: 'purple' },
    { modulo: 'facturacion', href: '/dashboard/facturacion/nueva', label: 'Nueva Factura', Icon: DollarSign, color: 'green' },
    { modulo: 'reportes', href: '/dashboard/reportes', label: 'Ver Reportes', Icon: TrendingUp, color: 'orange' },
  ].filter((accion) => tienePermiso(accion.modulo, rol, permisos))

  const clasesAccion: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }

  return (
    <div className="space-y-6">
      {searchParams?.sinAcceso && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-foreground">
            No tienes acceso al módulo{' '}
            <strong>{moduloBloqueado?.label || searchParams.sinAcceso}</strong>. Pide a un
            administrador que te lo habilite en Usuarios &rarr; Permisos de acceso.
          </p>
        </div>
      )}

      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Cards de Estadísticas — solo para quien tenga el permiso «estadisticas» */}
      {stats && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pacientes */}
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Pacientes</p>
              <p className="text-3xl font-bold mt-2">{stats.totalPacientes}</p>
              <p className="text-blue-100 text-sm mt-2">
                +{stats.pacientesNuevos} este mes
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Citas Hoy */}
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Citas Hoy</p>
              <p className="text-3xl font-bold mt-2">{citasHoy.length}</p>
              <p className="text-purple-100 text-sm mt-2">
                {citasHoy.filter(c => c.estado === 'COMPLETADA').length} completadas
              </p>
            </div>
            <Calendar className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        {/* Ingresos del Mes */}
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Ingresos del Mes</p>
              <p className="text-3xl font-bold mt-2">
                {stats.simboloMoneda} {Number(stats.ingresosMes).toLocaleString()}
              </p>
              <p className="text-green-100 text-sm mt-2">
                {stats.facturasPendientes} facturas pendientes
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        {/* Citas del Mes */}
        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Citas del Mes</p>
              <p className="text-3xl font-bold mt-2">{citasCompletadas + citasProgramadas}</p>
              <p className="text-orange-100 text-sm mt-2">
                {citasCanceladas} canceladas
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>
      )}

      {/* Citas de Hoy */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Citas de Hoy</h2>
          <a href="/dashboard/citas" className="text-primary-600 hover:text-primary-700 font-medium">
            Ver todas →
          </a>
        </div>

        {citasHoy.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay citas programadas para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {citasHoy.map((cita) => (
              <div
                key={cita.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg hover:opacity-80 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cita.estado === 'COMPLETADA' ? 'bg-green-100' :
                    cita.estado === 'EN_CURSO' ? 'bg-blue-100' :
                      cita.estado === 'CANCELADA' ? 'bg-red-100' :
                        'bg-yellow-100'
                    }`}>
                    {cita.estado === 'COMPLETADA' ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                      cita.estado === 'EN_CURSO' ? <Clock className="w-6 h-6 text-blue-600" /> :
                        cita.estado === 'CANCELADA' ? <XCircle className="w-6 h-6 text-red-600" /> :
                          <AlertCircle className="w-6 h-6 text-yellow-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {cita.paciente.nombre} {cita.paciente.apellido}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cita.horaInicio} - {cita.horaFin} • {cita.tipoCita}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    Dr. {cita.odontologo.nombre} {cita.odontologo.apellido}
                  </p>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${cita.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                    cita.estado === 'EN_CURSO' ? 'bg-blue-100 text-blue-800' :
                      cita.estado === 'CANCELADA' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {cita.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gráficas y Resumen */}
      <div className={`grid grid-cols-1 gap-6 ${stats ? 'lg:grid-cols-2' : ''}`}>
        {/* Resumen de Citas — parte de las estadísticas */}
        {stats && (
        <div className="card">
          <h3 className="text-lg font-bold text-foreground mb-4">Resumen de Citas - Este Mes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-foreground">Completadas</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{citasCompletadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-foreground">Programadas</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{citasProgramadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-foreground">Canceladas</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{citasCanceladas}</span>
            </div>
          </div>
        </div>
        )}

        {/* Acciones Rápidas */}
        <div className="card">
          <h3 className="text-lg font-bold text-foreground mb-4">Acciones Rápidas</h3>
          {accesosRapidos.length === 0 ? (
            <p className="text-muted-foreground">No tienes módulos con acciones directas.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {accesosRapidos.map(({ href, label, Icon, color }) => (
                <a
                  key={href}
                  href={href}
                  className={`rounded-lg p-4 text-center transition-colors hover:opacity-80 ${clasesAccion[color]}`}
                >
                  <Icon className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm font-medium">{label}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

