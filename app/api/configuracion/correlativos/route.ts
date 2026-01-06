
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const correlativoSchema = z.object({
    tipo: z.enum(['FACTURA', 'ORDEN_PEDIDO']),
    cai: z.string().optional(),
    sucursal: z.string().min(1).max(10), // Usado como Prefijo para Orden de Pedido
    puntoEmision: z.string().max(3).optional().or(z.literal('')),
    tipoDoc: z.string().max(2).optional().or(z.literal('')),
    rangoInicial: z.number().int().positive(),
    rangoFinal: z.number().int().positive(),
    fechaLimite: z.string().optional().transform((str) => str ? new Date(str) : new Date('2099-12-31')),
})

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
        const correlativos = await prisma.correlativo.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(correlativos)
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener correlativos' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRADOR') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
        const json = await request.json()
        const body = correlativoSchema.parse(json)

        // Desactivar otros correlativos del mismo tipo si se marca como activo (por defecto true en el modelo)
        // Pero aquí, al crear uno nuevo, asumimos que será el activo y desactivamos los anteriores del mismo tipo
        await prisma.correlativo.updateMany({
            where: {
                tipo: body.tipo,
                activo: true
            },
            data: {
                activo: false
            }
        })

        const correlativo = await prisma.correlativo.create({
            data: {
                tipo: body.tipo,
                cai: body.cai,
                sucursal: body.sucursal,
                puntoEmision: body.puntoEmision ?? '',
                tipoDoc: body.tipoDoc ?? '',
                rangoInicial: body.rangoInicial,
                rangoFinal: body.rangoFinal,
                fechaLimite: body.fechaLimite,
                siguiente: body.rangoInicial,
                activo: true
            }
        })

        return NextResponse.json(correlativo)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Error desconocido al crear correlativo',
            details: error
        }, { status: 500 })
    }
}
