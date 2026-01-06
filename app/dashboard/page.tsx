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
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

async function getDashboardStats() {
  const hoy = new Date()
  const inicioMes = startOfMonth(hoy)
  const finMes = endOfMonth(hoy)
  const inicioDia = startOfDay(hoy)
  const finDia = endOfDay(hoy)

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

  // Citas de hoy
  const citasHoy = await prisma.cita.findMany({
    where: {
      fecha: {
        gte: inicioDia,
        lte: finDia
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
  const simboloMoneda = config?.simboloMoneda || 'L.'

  return {
    totalPacientes,
    pacientesNuevos,
    citasHoy,
    citasMes,
    ingresosMes: ingresosMes._sum.total || 0,
    facturasPendientes,
    simboloMoneda
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const citasCompletadas = stats.citasMes.find(c => c.estado === 'COMPLETADA')?._count || 0
  const citasCanceladas = stats.citasMes.find(c => c.estado === 'CANCELADA')?._count || 0
  const citasProgramadas = stats.citasMes.find(c => c.estado === 'PROGRAMADA')?._count || 0

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Cards de Estadísticas */}
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
              <p className="text-3xl font-bold mt-2">{stats.citasHoy.length}</p>
              <p className="text-purple-100 text-sm mt-2">
                {stats.citasHoy.filter(c => c.estado === 'COMPLETADA').length} completadas
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

      {/* Citas de Hoy */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Citas de Hoy</h2>
          <a href="/dashboard/citas" className="text-primary-600 hover:text-primary-700 font-medium">
            Ver todas →
          </a>
        </div>

        {stats.citasHoy.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay citas programadas para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.citasHoy.map((cita) => (
              <div
                key={cita.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                    <p className="font-semibold text-gray-900">
                      {cita.paciente.nombre} {cita.paciente.apellido}
                    </p>
                    <p className="text-sm text-gray-600">
                      {cita.horaInicio} - {cita.horaFin} • {cita.tipoCita}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen de Citas */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Citas - Este Mes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-700">Completadas</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{citasCompletadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-gray-700">Programadas</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{citasProgramadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-gray-700">Canceladas</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{citasCanceladas}</span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/dashboard/pacientes/nuevo"
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
            >
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">Nuevo Paciente</p>
            </a>
            <a
              href="/dashboard/citas/nueva"
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
            >
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-900">Nueva Cita</p>
            </a>
            <a
              href="/dashboard/facturacion/nueva"
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
            >
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">Nueva Factura</p>
            </a>
            <a
              href="/dashboard/reportes"
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
            >
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-900">Ver Reportes</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

