import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { inicioDiaLocal, finDiaLocal } from '@/lib/fecha'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - Listado de auditoría (solo ADMINISTRADOR)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entidad = searchParams.get('entidad')
    const accion = searchParams.get('accion')
    const usuarioId = searchParams.get('usuarioId')
    const search = searchParams.get('search')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50') || 50), 200)
    const skip = (page - 1) * limit

    const where: Prisma.AuditoriaWhereInput = {}
    if (entidad) where.entidad = entidad
    if (accion) where.accion = accion as Prisma.AuditoriaWhereInput['accion']
    if (usuarioId) where.usuarioId = usuarioId
    if (search) where.descripcion = { contains: search }
    if (fechaInicio || fechaFin) {
      where.fecha = {}
      if (fechaInicio) where.fecha.gte = inicioDiaLocal(fechaInicio)
      if (fechaFin) where.fecha.lte = finDiaLocal(fechaFin)
    }

    const [registros, total, entidades] = await Promise.all([
      prisma.auditoria.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditoria.count({ where }),
      // Lista de entidades distintas para poblar el filtro del UI
      prisma.auditoria.findMany({
        distinct: ['entidad'],
        select: { entidad: true },
        orderBy: { entidad: 'asc' },
      }),
    ])

    return NextResponse.json({
      registros,
      entidades: entidades.map((e) => e.entidad),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al obtener auditoría:', error)
    return NextResponse.json({ error: 'Error al obtener auditoría' }, { status: 500 })
  }
}
