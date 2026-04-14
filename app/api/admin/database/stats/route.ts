import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener estadísticas de la base de datos
    const [
      usuariosCount,
      pacientesCount,
      citasCount,
      expedientesCount,
      tratamientosCount,
      facturasCount,
      pagosCount,
      ingresosCount,
      egresosCount,
      inventarioCount,
      productosCount,
      facturasEstados,
      totalIngresos,
      totalEgresos,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.paciente.count(),
      prisma.cita.count(),
      prisma.expediente.count(),
      prisma.tratamiento.count(),
      prisma.factura.count(),
      prisma.pago.count(),
      prisma.ingreso.count(),
      prisma.egreso.count(),
      prisma.inventario.count(),
      prisma.productoServicio.count(),
      prisma.factura.groupBy({
        by: ['estado'],
        _count: true,
        _sum: { total: true },
      }),
      prisma.ingreso.aggregate({
        _sum: { monto: true },
      }),
      prisma.egreso.aggregate({
        _sum: { monto: true },
      }),
    ])

    const stats = {
      usuarios: usuariosCount,
      pacientes: pacientesCount,
      citas: citasCount,
      expedientes: expedientesCount,
      tratamientos: tratamientosCount,
      facturas: facturasCount,
      pagos: pagosCount,
      ingresos: ingresosCount,
      egresos: egresosCount,
      inventario: inventarioCount,
      productos: productosCount,
      facturasEstados: facturasEstados.map(f => ({
        estado: f.estado,
        cantidad: f._count,
        total: f._sum.total || 0,
      })),
      totalIngresos: totalIngresos._sum.monto || 0,
      totalEgresos: totalEgresos._sum.monto || 0,
      saldoNeto: (totalIngresos._sum.monto || 0) - (totalEgresos._sum.monto || 0),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
