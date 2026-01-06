
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
        let config = await prisma.configuracionEmpresa.findFirst()

        if (!config) {
            // Crear configuración por defecto si no existe
            config = await prisma.configuracionEmpresa.create({
                data: {
                    nombre: 'Mi Clínica Dental',
                    moneda: 'HNL',
                    simboloMoneda: 'L.',
                    pais: 'Honduras'
                }
            })
        }

        return NextResponse.json(config)
    } catch (error) {
        console.error('Error al obtener configuración:', error)
        return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRADOR') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
        const body = await request.json()

        let config = await prisma.configuracionEmpresa.findFirst()

        if (config) {
            config = await prisma.configuracionEmpresa.update({
                where: { id: config.id },
                data: body
            })
        } else {
            config = await prisma.configuracionEmpresa.create({
                data: body
            })
        }

        return NextResponse.json(config)
    } catch (error) {
        console.error('Error al actualizar configuración:', error)
        return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
    }
}
