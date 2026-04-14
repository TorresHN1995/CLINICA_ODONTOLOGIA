import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { confirmDelete } = body

    if (!confirmDelete) {
      return NextResponse.json(
        { error: 'Confirmación requerida' },
        { status: 400 }
      )
    }

    // Contar registros antes de limpiar
    const countBefore = {
      pacientes: await prisma.paciente.count(),
      citas: await prisma.cita.count(),
      expedientes: await prisma.expediente.count(),
      tratamientos: await prisma.tratamiento.count(),
      facturas: await prisma.factura.count(),
      pagos: await prisma.pago.count(),
      ingresos: await prisma.ingreso.count(),
      egresos: await prisma.egreso.count(),
      inventario: await prisma.inventario.count(),
      movimientos: await prisma.movimientoInventario.count(),
    }

    // Limpiar datos (mantener usuarios y productos)
    await Promise.all([
      prisma.pago.deleteMany(),
      prisma.ingreso.deleteMany(),
      prisma.itemFactura.deleteMany(),
      prisma.factura.deleteMany(),
      prisma.procedimiento.deleteMany(),
      prisma.expediente.deleteMany(),
      prisma.cita.deleteMany(),
      prisma.etapaTratamiento.deleteMany(),
      prisma.tratamiento.deleteMany(),
      prisma.movimientoInventario.deleteMany(),
      prisma.documento.deleteMany(),
      prisma.paciente.deleteMany(),
      prisma.egreso.deleteMany(),
      prisma.flujoCaja.deleteMany(),
      prisma.estadisticaOdontologo.deleteMany(),
    ])

    // Contar registros después de limpiar
    const countAfter = {
      pacientes: await prisma.paciente.count(),
      citas: await prisma.cita.count(),
      expedientes: await prisma.expediente.count(),
      tratamientos: await prisma.tratamiento.count(),
      facturas: await prisma.factura.count(),
      pagos: await prisma.pago.count(),
      ingresos: await prisma.ingreso.count(),
      egresos: await prisma.egreso.count(),
      inventario: await prisma.inventario.count(),
      movimientos: await prisma.movimientoInventario.count(),
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada exitosamente',
      deletedRecords: {
        pacientes: countBefore.pacientes - countAfter.pacientes,
        citas: countBefore.citas - countAfter.citas,
        expedientes: countBefore.expedientes - countAfter.expedientes,
        tratamientos: countBefore.tratamientos - countAfter.tratamientos,
        facturas: countBefore.facturas - countAfter.facturas,
        pagos: countBefore.pagos - countAfter.pagos,
        ingresos: countBefore.ingresos - countAfter.ingresos,
        egresos: countBefore.egresos - countAfter.egresos,
        movimientos: countBefore.movimientos - countAfter.movimientos,
      },
      totalDeleted: Object.values(countBefore).reduce((a, b) => a + b, 0) - 
                    Object.values(countAfter).reduce((a, b) => a + b, 0),
    })
  } catch (error) {
    console.error('Error al limpiar base de datos:', error)
    return NextResponse.json(
      { error: 'Error al limpiar base de datos' },
      { status: 500 }
    )
  }
}
