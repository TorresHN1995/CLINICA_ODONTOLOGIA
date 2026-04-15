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

    // Exportar todos los datos
    const [
      usuarios,
      pacientes,
      citas,
      expedientes,
      tratamientos,
      facturas,
      pagos,
      ingresos,
      egresos,
      inventario,
      documentos,
    ] = await Promise.all([
      prisma.usuario.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          nombre: true,
          apellido: true,
          telefono: true,
          rol: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.paciente.findMany(),
      prisma.cita.findMany(),
      prisma.expediente.findMany(),
      prisma.tratamiento.findMany(),
      prisma.factura.findMany({ include: { items: true } }),
      prisma.pago.findMany(),
      prisma.ingreso.findMany(),
      prisma.egreso.findMany(),
      prisma.inventario.findMany(),
      prisma.documento.findMany(),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      summary: {
        usuarios: usuarios.length,
        pacientes: pacientes.length,
        citas: citas.length,
        expedientes: expedientes.length,
        tratamientos: tratamientos.length,
        facturas: facturas.length,
        pagos: pagos.length,
        ingresos: ingresos.length,
        egresos: egresos.length,
        inventario: inventario.length,
        documentos: documentos.length,
      },
      data: {
        usuarios,
        pacientes,
        citas,
        expedientes,
        tratamientos,
        facturas,
        pagos,
        ingresos,
        egresos,
        inventario,
        documentos,
      },
    }

    // Crear archivo JSON
    const filename = `clinica-backup-${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error al exportar base de datos:', error)
    return NextResponse.json(
      { error: 'Error al exportar base de datos' },
      { status: 500 }
    )
  }
}
