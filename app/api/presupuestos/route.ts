import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditar } from '@/lib/auditoria'
import { z } from 'zod'

const itemSchema = z.object({
  descripcion: z.string().min(1).max(500),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().positive(), // inclusivo de ISV
  tasaIsv: z.number().min(0).max(100).default(15),
  productoId: z.string().optional(),
})

const presupuestoSchema = z.object({
  pacienteId: z.string().min(1),
  items: z.array(itemSchema).min(1, 'Debe incluir al menos un item'),
  descuento: z.number().min(0).default(0),
  validoHasta: z.string().optional(),
  observaciones: z.string().max(5000).optional(),
})

// Redondeo a 2 decimales
const r2 = (n: number) => Math.round(n * 100) / 100

// GET - Listar presupuestos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get('pacienteId')
    const estado = searchParams.get('estado')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50') || 50), 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (pacienteId) where.pacienteId = pacienteId
    if (estado) where.estado = estado

    const [presupuestos, total] = await Promise.all([
      prisma.presupuesto.findMany({
        where,
        include: {
          paciente: { select: { nombre: true, apellido: true, identificacion: true } },
          _count: { select: { items: true } },
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.presupuesto.count({ where }),
    ])

    return NextResponse.json({
      presupuestos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error al obtener presupuestos:', error)
    return NextResponse.json({ error: 'Error al obtener presupuestos' }, { status: 500 })
  }
}

// POST - Crear presupuesto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = presupuestoSchema.parse(body)

    const paciente = await prisma.paciente.findUnique({
      where: { id: data.pacienteId },
      select: { activo: true },
    })
    if (!paciente || !paciente.activo) {
      return NextResponse.json({ error: 'El paciente no existe o está inactivo' }, { status: 400 })
    }

    // Calcular totales (precios inclusivos de ISV). El impuesto se DERIVA de las tasas.
    let subtotal = 0 // base neta
    let impuesto = 0 // ISV
    let totalBruto = 0 // inclusivo
    const itemsData = data.items.map((item) => {
      const lineaInclusiva = item.cantidad * item.precioUnitario
      const base = item.tasaIsv > 0 ? lineaInclusiva / (1 + item.tasaIsv / 100) : lineaInclusiva
      subtotal += base
      impuesto += lineaInclusiva - base
      totalBruto += lineaInclusiva
      return {
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: r2(lineaInclusiva),
        tasaIsv: item.tasaIsv,
        productoId: item.productoId || null,
      }
    })

    if (data.descuento > totalBruto) {
      return NextResponse.json(
        { error: 'El descuento no puede ser mayor que el total del presupuesto' },
        { status: 400 }
      )
    }

    const total = r2(totalBruto - data.descuento)

    const presupuesto = await prisma.$transaction(async (tx) => {
      // Generar número PRE-00001
      const ultimo = await tx.presupuesto.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { numero: true },
      })
      let siguiente = 1
      if (ultimo?.numero) {
        const m = ultimo.numero.match(/PRE-(\d+)/)
        if (m) siguiente = parseInt(m[1]) + 1
      }
      const numero = `PRE-${String(siguiente).padStart(5, '0')}`

      return tx.presupuesto.create({
        data: {
          numero,
          pacienteId: data.pacienteId,
          creadoPor: session.user.id,
          creadoPorNombre: session.user.name || null,
          validoHasta: data.validoHasta ? new Date(data.validoHasta) : null,
          subtotal: r2(subtotal),
          descuento: data.descuento,
          impuesto: r2(impuesto),
          total,
          observaciones: data.observaciones || null,
          items: { create: itemsData },
        },
        include: { items: true, paciente: true },
      })
    }, { isolationLevel: 'Serializable' })

    await auditar(session, request, {
      accion: 'CREAR',
      entidad: 'Presupuesto',
      entidadId: presupuesto.id,
      descripcion: `Creó el presupuesto ${presupuesto.numero} por ${total.toFixed(2)}`,
      datos: { numero: presupuesto.numero, total, pacienteId: data.pacienteId },
    })

    return NextResponse.json(presupuesto, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error al crear presupuesto:', error)
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 })
  }
}
