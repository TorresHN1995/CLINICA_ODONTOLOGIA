import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT - Actualizar configuración de empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si el usuario es admin
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true }
    });

    if (usuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Solo administradores pueden actualizar la configuración' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const {
      nombre,
      rtn,
      telefono,
      email,
      direccion,
      ciudad,
      pais,
      moneda,
      simboloMoneda,
      formatoFecha,
      logo
    } = body;

    // Validaciones
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre de la empresa es requerido' }, { status: 400 });
    }

    // Verificar que la configuración existe
    const configuracionExistente = await prisma.configuracionEmpresa.findUnique({
      where: { id }
    });

    if (!configuracionExistente) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
    }

    const configuracionActualizada = await prisma.configuracionEmpresa.update({
      where: { id },
      data: {
        nombre,
        rtn,
        telefono,
        email,
        direccion,
        ciudad,
        pais,
        moneda,
        simboloMoneda,
        formatoFecha,
        logo
      }
    });

    return NextResponse.json(configuracionActualizada);
  } catch (error) {
    console.error('Error al actualizar configuración de empresa:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener configuración específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si el usuario es admin
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true }
    });

    if (usuario?.rol !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Solo administradores pueden ver la configuración' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const configuracion = await prisma.configuracionEmpresa.findUnique({
      where: { id }
    });

    if (!configuracion) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
    }

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error('Error al obtener configuración de empresa:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
