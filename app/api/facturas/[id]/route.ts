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
        correlativo: {
          select: {
            cai: true,
            sucursal: true,
            puntoEmision: true,
            tipoDoc: true,
            rangoInicial: true,
            rangoFinal: true,
            fechaLimite: true,
          },
        },
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

    // Obtener factura actual con items y pagos para recalcular totales / revertir caja
    const facturaActual = await prisma.factura.findUnique({
      where: { id: params.id },
      include: { items: true, pagos: true },
    })

    if (!facturaActual) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    let dataUpdate: any = {}

    if (validated.estado) {
      dataUpdate.estado = validated.estado

      // Si se anula la factura, anular el ingreso asociado y revertir el efectivo cobrado
      if (validated.estado === 'ANULADA') {
        if (facturaActual.estado === 'ANULADA') {
          return NextResponse.json(
            { error: 'La factura ya está anulada' },
            { status: 400 }
          )
        }
        try {
          const ingreso = await prisma.ingreso.findUnique({
            where: { facturaId: params.id },
          })
          if (ingreso) {
            await prisma.ingreso.delete({ where: { id: ingreso.id } })
          }
          // Revertir SOLO el efectivo realmente cobrado (suma de pagos), no el total.
          // Cada pago entró a caja como INGRESO; al anular se registra un EGRESO equivalente.
          const totalCobrado = facturaActual.pagos.reduce(
            (sum, p) => sum + Number(p.monto),
            0
          )
          if (totalCobrado > 0) {
            await registrarFlujoCaja(
              'EGRESO',
              `Anulación factura ${facturaActual.numero} (reverso de pagos)`,
              totalCobrado,
              params.id
            )
          }
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
      // El impuesto SIEMPRE se deriva de las tasas de los items (base neta * tasa),
      // nunca se confía en el valor enviado por el cliente.
      const impuesto = facturaActual.items.reduce(
        (sum, item) => sum + Number(item.subtotal) * (Number(item.tasaIsv ?? 15) / 100),
        0
      )
      const descuento = validated.descuento ?? Number(facturaActual.descuento)

      if (descuento > subtotal + impuesto) {
        return NextResponse.json(
          { error: 'El descuento no puede ser mayor que el total de la factura' },
          { status: 400 }
        )
      }

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


