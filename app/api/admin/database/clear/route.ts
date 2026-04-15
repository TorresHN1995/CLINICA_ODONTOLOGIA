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
    const { confirmacion } = body

    if (confirmacion !== 'LIMPIAR_BASE_DE_DATOS') {
      return NextResponse.json(
        { error: 'Confirmación inválida' },
        { status: 400 }
      )
    }

    // Limpiar datos operativos en orden (respetando relaciones)
    // NO se eliminan: configuracionEmpresa, correlativos, productosServicios
    const deletedData = {
      documentos: await prisma.documento.deleteMany({}),
      imagenes: await prisma.imagenClinica.deleteMany({}),
      pagos: await prisma.pago.deleteMany({}),
      ingresos: await prisma.ingreso.deleteMany({}),
      egresos: await prisma.egreso.deleteMany({}),
      flujoCaja: await prisma.flujoCaja.deleteMany({}),
      itemFactura: await prisma.itemFactura.deleteMany({}),
      facturas: await prisma.factura.deleteMany({}),
      procedimientos: await prisma.procedimiento.deleteMany({}),
      etapasTratamiento: await prisma.etapaTratamiento.deleteMany({}),
      tratamientos: await prisma.tratamiento.deleteMany({}),
      expedientes: await prisma.expediente.deleteMany({}),
      citas: await prisma.cita.deleteMany({}),
      pacientes: await prisma.paciente.deleteMany({}),
      movimientosInventario: await prisma.movimientoInventario.deleteMany({}),
      inventario: await prisma.inventario.deleteMany({}),
      estadisticas: await prisma.estadisticaOdontologo.deleteMany({}),
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada exitosamente',
      deletedRecords: deletedData,
    })
  } catch (error) {
    console.error('Error al limpiar base de datos:', error)
    return NextResponse.json(
      { error: 'Error al limpiar base de datos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
