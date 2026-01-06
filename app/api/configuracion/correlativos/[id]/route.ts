
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRADOR') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const correlativo = await prisma.correlativo.findUnique({
            where: { id: params.id }
        })

        if (!correlativo) {
            return NextResponse.json({ error: 'Correlativo no encontrado' }, { status: 404 })
        }

        // Si se está activando, desactivar otros
        if (body.activo === true) {
            await prisma.correlativo.updateMany({
                where: {
                    tipo: correlativo.tipo,
                    activo: true,
                    NOT: { id: params.id }
                },
                data: { activo: false }
            })
        }

        // Parsear fecha si viene
        const dataToUpdate: any = { ...body }
        if (body.fechaLimite) {
            dataToUpdate.fechaLimite = new Date(body.fechaLimite)
        }
        // Asegurar tipos numéricos
        if (body.rangoInicial) dataToUpdate.rangoInicial = Number(body.rangoInicial)
        if (body.rangoFinal) dataToUpdate.rangoFinal = Number(body.rangoFinal)
        if (body.siguiente) dataToUpdate.siguiente = Number(body.siguiente)

        const updated = await prisma.correlativo.update({
            where: { id: params.id },
            data: dataToUpdate
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al actualizar correlativo' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRADOR') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
        // Validar si tiene facturas asociadas
        const count = await prisma.factura.count({
            where: { correlativoId: params.id }
        })

        if (count > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar porque tiene facturas asociadas' },
                { status: 400 }
            )
        }

        await prisma.correlativo.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar correlativo' }, { status: 500 })
    }
}
