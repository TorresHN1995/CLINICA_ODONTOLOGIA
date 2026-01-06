import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const categorias = [
  'MATERIAL_DENTAL',
  'INSTRUMENTAL',
  'MEDICAMENTO',
  'CONSUMIBLE',
  'EQUIPAMIENTO',
  'OTRO',
] as const

const inventarioSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  categoria: z.enum(categorias),
  unidadMedida: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  stockMinimo: z.number().int().min(0).default(10),
  precioCompra: z.number().min(0),
  precioVenta: z.number().min(0).optional(),
  proveedor: z.string().optional(),
})

// GET - Listar inventario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoria = searchParams.get('categoria')
    const incluirInactivos = searchParams.get('incluirInactivos') === 'true'

    const where: any = {}
    if (!incluirInactivos) where.activo = true
    if (categoria) where.categoria = categoria
    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nombre: { contains: search } },
        { proveedor: { contains: search } },
      ]
    }

    const items = await prisma.inventario.findMany({
      where,
      orderBy: [{ nombre: 'asc' }],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error al obtener inventario:', error)
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    )
  }
}

// POST - Crear ítem de inventario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = inventarioSchema.parse(body)

    // Verificar código único
    const existente = await prisma.inventario.findUnique({ where: { codigo: validated.codigo } })
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un material con ese código' }, { status: 400 })
    }

    const item = await prisma.inventario.create({
      data: {
        codigo: validated.codigo,
        nombre: validated.nombre,
        descripcion: validated.descripcion || null,
        categoria: validated.categoria,
        unidadMedida: validated.unidadMedida,
        stock: validated.stock,
        stockMinimo: validated.stockMinimo,
        precioCompra: validated.precioCompra,
        precioVenta: validated.precioVenta ?? null,
        proveedor: validated.proveedor || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear material:', error)
    return NextResponse.json(
      { error: 'Error al crear material' },
      { status: 500 }
    )
  }
}


