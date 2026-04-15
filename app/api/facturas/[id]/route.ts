import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarFlujoCaja } from '@/lib/flujo-caja'
import { z } from 'zod'

// GET - Obtener factura por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const factura = await prisma.factura.findUnique({
      where: { id: params.id },
      include: {
        paciente: {
          select: { nombre: true, apellido: true, identificacion: true },
        },
        emitente: { select: { nombre: true, apellido: true } },
        items: true,
        pagos: true,
      },
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    return NextResponse.json(factura)
  } catch (error) {
    console.error('Error al obtener factura:', error)
    return NextResponse.json(
      { error: 'Error al obtener factura' },
      { status: 500 }
    )
  }
}

const updateFacturaSchema = z.object({
  estado: z
    .enum(['PENDIENTE', 'PAGADA_PARCIAL', 'PAGADA', 'ANULADA'])
    .optional(),
  observaciones: z.string().optional(),
  descuento: z.number().min(0).optional(),
  impuesto: z.number().min(0).optional(),
})

// PUT - Actualizar factura (parcial)
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
    const validated = updateFacturaSchema.parse(body)

    // Obtener factura actual con items para recalcular totales si es necesario
    const facturaActual = await prisma.factura.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!facturaActual) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    let dataUpdate: any = {}

    if (validated.estado) {
      dataUpdate.estado = validated.estado

      // Si se anula la factura, anular el ingreso asociado y registrar contra-asiento
      if (validated.estado === 'ANULADA') {
        try {
          const ingreso = await prisma.ingreso.findUnique({
            where: { facturaId: params.id },
          })
          if (ingreso) {
            await prisma.ingreso.delete({ where: { id: ingreso.id } })
          }
          // Registrar contra-asiento en flujo de caja
          await registrarFlujoCaja(
            'AJUSTE',
            `Anulación factura ${facturaActual.numero}`,
            Number(facturaActual.total),
            params.id
          )
        } catch (e) {
          console.error('Error al anular ingreso/flujo:', e)
        }
      }
    }
    if (validated.observaciones !== undefined) {
      dataUpdate.observaciones = validated.observaciones || null
    }

    if (validated.descuento !== undefined || validated.impuesto !== undefined) {
      const subtotal = facturaActual.items.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
      )
      const descuento = validated.descuento ?? Number(facturaActual.descuento)
      const impuesto = validated.impuesto ?? Number(facturaActual.impuesto)
      const total = subtotal - descuento + impuesto

      dataUpdate = {
        ...dataUpdate,
        subtotal,
        descuento,
        impuesto,
        total,
      }
    }

    const factura = await prisma.factura.update({
      where: { id: params.id },
      data: dataUpdate,
      include: {
        paciente: { select: { nombre: true, apellido: true, identificacion: true } },
        emitente: { select: { nombre: true, apellido: true } },
        items: true,
        pagos: true,
      },
    })

    return NextResponse.json(factura)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar factura:', error)
    return NextResponse.json(
      { error: 'Error al actualizar factura' },
      { status: 500 }
    )
  }
}


