import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const egresoUpdateSchema = z.object({
  concepto: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  monto: z.number().positive().optional(),
  categoria: z.enum([
    'MATERIALES_DENTALES', 'INSTRUMENTAL', 'MEDICAMENTOS', 'EQUIPAMIENTO',
    'SERVICIOS_PUBLICOS', 'ALQUILER', 'SALARIOS', 'SEGUROS',
    'MANTENIMIENTO', 'MARKETING', 'CAPACITACION', 'OTROS_GASTOS'
  ]).optional(),
  metodoPago: z.enum([
    'EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO',
    'TRANSFERENCIA', 'CHEQUE', 'OTRO'
  ]).optional(),
  fecha: z.string().optional(),
  estado: z.enum(['PENDIENTE', 'APROBADO', 'PAGADO', 'RECHAZADO']).optional(),
  proveedor: z.string().optional(),
  numeroFactura: z.string().optional(),
  observaciones: z.string().optional(),
})

// PUT - Actualizar egreso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = egresoUpdateSchema.parse(body)

    const egreso = await prisma.egreso.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        fecha: validatedData.fecha ? new Date(validatedData.fecha) : undefined,
      },
      include: {
        registrador: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    })

    return NextResponse.json(egreso)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar egreso:', error)
    return NextResponse.json(
      { error: 'Error al actualizar egreso' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar egreso
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.egreso.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Egreso eliminado' })
  } catch (error) {
    console.error('Error al eliminar egreso:', error)
    return NextResponse.json(
      { error: 'Error al eliminar egreso' },
      { status: 500 }
    )
  }
}
