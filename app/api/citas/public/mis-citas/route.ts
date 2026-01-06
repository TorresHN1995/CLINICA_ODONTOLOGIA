import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const identificacion = searchParams.get('identificacion')

        if (!identificacion) {
            return NextResponse.json({ error: 'Identificación requerida' }, { status: 400 })
        }

        // Buscar paciente
        const paciente = await prisma.paciente.findUnique({
            where: { identificacion: identificacion }
        })

        if (!paciente) {
            return NextResponse.json({ citas: [] }) // Retornar vacío si no existe, por seguridad no decir 404
        }

        // Buscar citas futuras
        const citas = await prisma.cita.findMany({
            where: {
                pacienteId: paciente.id,
                fecha: {
                    gte: startOfDay(new Date()) // Citas de hoy en adelante
                },
                estado: {
                    not: 'CANCELADA'
                }
            },
            include: {
                odontologo: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                }
            },
            orderBy: {
                fecha: 'asc'
            }
        })

        return NextResponse.json({ citas })

    } catch (error) {
        console.error('Error buscando mis citas:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
