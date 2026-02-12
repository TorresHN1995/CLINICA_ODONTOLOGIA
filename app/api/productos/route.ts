import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productoSchema = z.object({
  codigo: z.string().min(1, 'Código requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['PRODUCTO', 'SERVICIO']),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  isv: z.number().min(0).max(100).default(15),
})

// GET - Listar productos/servicios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tipo = searchParams.get('tipo')
    const activo = searchParams.get('activo')

    const where: any = {}
    if (activo !== 'todos') where.activo = true
    if (tipo && tipo !== 'TODOS') where.tipo = tipo
    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nombre: { contains: search } },
        { descripcion: { contains: search } },
      ]
    }

    const productos = await prisma.productoServicio.findMany({
      where,
      orderBy: [{ nombre: 'asc' }],
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// POST - Crear producto/servicio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = productoSchema.parse(body)

    const existente = await prisma.productoServicio.findUnique({ where: { codigo: validated.codigo } })
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un producto con ese código' }, { status: 400 })
    }

    const producto = await prisma.productoServicio.create({ data: validated })
    return NextResponse.json(producto, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error al crear producto:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
