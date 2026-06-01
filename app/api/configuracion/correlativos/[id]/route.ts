
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { auditar } from '@/lib/auditoria'
import { z } from 'zod'

// Whitelist explícita de campos editables (evita mass-assignment de columnas arbitrarias)
const correlativoUpdateSchema = z.object({
    cai: z.string().optional(),
    sucursal: z.string().optional(),
    puntoEmision: z.string().optional(),
    tipoDoc: z.string().optional(),
    rangoInicial: z.coerce.number().int().positive().optional(),
    rangoFinal: z.coerce.number().int().positive().optional(),
    siguiente: z.coerce.number().int().positive().optional(),
    fechaLimite: z.string().optional(),
    activo: z.boolean().optional(),
})

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
        const data = correlativoUpdateSchema.parse(body)

        const correlativo = await prisma.correlativo.findUnique({
            where: { id: params.id }
        })

        if (!correlativo) {
            return NextResponse.json({ error: 'Correlativo no encontrado' }, { status: 404 })
        }

        // Validar coherencia de rangos y contador para no romper la numeración SAR
        const rangoInicial = data.rangoInicial ?? correlativo.rangoInicial
        const rangoFinal = data.rangoFinal ?? correlativo.rangoFinal
        const siguiente = data.siguiente ?? correlativo.siguiente

        if (rangoFinal < rangoInicial) {
            return NextResponse.json(
                { error: 'El rango final no puede ser menor que el inicial' },
                { status: 400 }
            )
        }
        if (siguiente < rangoInicial || siguiente > rangoFinal + 1) {
            return NextResponse.json(
                { error: 'El siguiente número debe estar dentro del rango autorizado' },
                { status: 400 }
            )
        }

        // Si se está activando, desactivar otros del mismo tipo
        if (data.activo === true) {
            await prisma.correlativo.updateMany({
                where: {
                    tipo: correlativo.tipo,
                    activo: true,
                    NOT: { id: params.id }
                },
                data: { activo: false }
            })
        }

        // Construir solo con campos permitidos (nunca el body crudo)
        const dataToUpdate: Record<string, unknown> = {}
        if (data.cai !== undefined) dataToUpdate.cai = data.cai
        if (data.sucursal !== undefined) dataToUpdate.sucursal = data.sucursal
        if (data.puntoEmision !== undefined) dataToUpdate.puntoEmision = data.puntoEmision
        if (data.tipoDoc !== undefined) dataToUpdate.tipoDoc = data.tipoDoc
        if (data.rangoInicial !== undefined) dataToUpdate.rangoInicial = data.rangoInicial
        if (data.rangoFinal !== undefined) dataToUpdate.rangoFinal = data.rangoFinal
        if (data.siguiente !== undefined) dataToUpdate.siguiente = data.siguiente
        if (data.activo !== undefined) dataToUpdate.activo = data.activo
        if (data.fechaLimite) {
            // Final del día límite: válido durante todo ese día
            const f = new Date(data.fechaLimite)
            f.setUTCHours(23, 59, 59, 999)
            dataToUpdate.fechaLimite = f
        }

        const updated = await prisma.correlativo.update({
            where: { id: params.id },
            data: dataToUpdate
        })

        await auditar(session, request, {
            accion: 'ACTUALIZAR',
            entidad: 'Correlativo',
            entidadId: params.id,
            descripcion: `Modificó el correlativo ${correlativo.tipo} (${updated.sucursal}-${updated.puntoEmision}-${updated.tipoDoc})`,
            datos: { cambios: dataToUpdate },
        })

        return NextResponse.json(updated)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.errors },
                { status: 400 }
            )
        }
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
