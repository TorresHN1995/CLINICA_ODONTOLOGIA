import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const identificacion = searchParams.get('identificacion')

        if (!identificacion) {
            return NextResponse.json({ error: 'Identificación requerida' }, { status: 400 })
        }

        // Buscar paciente exacto por identificación
        const paciente = await prisma.paciente.findUnique({
            where: { identificacion: identificacion },
            select: {
                id: true,
                identificacion: true,
                nombre: true,
                apellido: true,
                telefono: true,
                email: true,
                fechaNacimiento: true
            }
        })

        if (!paciente) {
            return NextResponse.json({ found: false }, { status: 404 })
        }

        return NextResponse.json({
            found: true,
            paciente
        })

    } catch (error) {
        console.error('Error buscando paciente:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
