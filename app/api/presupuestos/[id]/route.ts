import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditar } from '@/lib/auditoria'
import { z } from 'zod'

// GET - Obtener presupuesto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        paciente: { select: { id: true, nombre: true, apellido: true, identificacion: true, telefono: true } },
      },
    })

    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(presupuesto)
  } catch (error) {
    console.error('Error al obtener presupuesto:', error)
    return NextResponse.json({ error: 'Error al obtener presupuesto' }, { status: 500 })
  }
}

const updateSchema = z.object({
  estado: z.enum(['PROPUESTO', 'APROBADO', 'RECHAZADO', 'FACTURADO', 'VENCIDO']).optional(),
  facturaId: z.string().optional(),
  observaciones: z.string().max(5000).optional(),
})

// PUT - Cambiar estado / vincular factura
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
    const data = updateSchema.parse(body)

    const actual = await prisma.presupuesto.findUnique({
      where: { id: params.id },
      select: { estado: true, numero: true },
    })
    if (!actual) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }
    if (actual.estado === 'FACTURADO' && data.estado && data.estado !== 'FACTURADO') {
      return NextResponse.json(
        { error: 'Un presupuesto ya facturado no se puede modificar' },
        { status: 400 }
      )
    }

    const dataUpdate: any = {}
    if (data.estado) dataUpdate.estado = data.estado
    if (data.facturaId !== undefined) dataUpdate.facturaId = data.facturaId
    if (data.observaciones !== undefined) dataUpdate.observaciones = data.observaciones || null

    const presupuesto = await prisma.presupuesto.update({
      where: { id: params.id },
      data: dataUpdate,
      include: { items: true, paciente: true },
    })

    if (data.estado && data.estado !== actual.estado) {
      const verbo: Record<string, string> = {
        APROBADO: 'Aprobó',
        RECHAZADO: 'Rechazó',
        FACTURADO: 'Facturó',
        VENCIDO: 'Marcó como vencido',
        PROPUESTO: 'Reabrió',
      }
      await auditar(session, request, {
        accion: data.estado === 'FACTURADO' ? 'ACTUALIZAR' : 'ACTUALIZAR',
        entidad: 'Presupuesto',
        entidadId: presupuesto.id,
        descripcion: `${verbo[data.estado] || 'Actualizó'} el presupuesto ${presupuesto.numero}`,
        datos: { estadoAnterior: actual.estado, estadoNuevo: data.estado, facturaId: data.facturaId },
      })
    }

    return NextResponse.json(presupuesto)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error al actualizar presupuesto:', error)
    return NextResponse.json({ error: 'Error al actualizar presupuesto' }, { status: 500 })
  }
}

// DELETE - Eliminar presupuesto (no permitido si ya fue facturado)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const actual = await prisma.presupuesto.findUnique({
      where: { id: params.id },
      select: { estado: true, numero: true },
    })
    if (!actual) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }
    if (actual.estado === 'FACTURADO') {
      return NextResponse.json(
        { error: 'No se puede eliminar un presupuesto ya facturado' },
        { status: 400 }
      )
    }

    await prisma.presupuesto.delete({ where: { id: params.id } })

    await auditar(session, request, {
      accion: 'ELIMINAR',
      entidad: 'Presupuesto',
      entidadId: params.id,
      descripcion: `Eliminó el presupuesto ${actual.numero}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error)
    return NextResponse.json({ error: 'Error al eliminar presupuesto' }, { status: 500 })
  }
}
