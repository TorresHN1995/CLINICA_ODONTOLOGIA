import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Obtener configuración de empresa (accesible para cualquier usuario autenticado)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let configuracion = await prisma.configuracionEmpresa.findFirst({
      where: { activo: true }
    });

    if (!configuracion) {
      // Crear configuración por defecto si no existe
      configuracion = await prisma.configuracionEmpresa.create({
        data: {
          nombre: 'Mi Clínica Dental',
          moneda: 'HNL',
          simboloMoneda: 'L.',
          pais: 'Honduras',
        }
      });
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

// POST - Crear configuración de empresa
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Solo administradores pueden configurar la empresa' }, { status: 403 });
    }

    const body = await request.json();
    const {
      nombre,
      rtn,
      telefono,
      email,
      direccion,
      ciudad,
      pais = 'Honduras',
      moneda = 'HNL',
      simboloMoneda = 'L.',
      formatoFecha = 'DD/MM/YYYY',
      logo
    } = body;

    // Validaciones
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre de la empresa es requerido' }, { status: 400 });
    }

    // Desactivar configuraciones anteriores
    await prisma.configuracionEmpresa.updateMany({
      where: { activo: true },
      data: { activo: false }
    });

    const nuevaConfiguracion = await prisma.configuracionEmpresa.create({
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

    return NextResponse.json(nuevaConfiguracion, { status: 201 });
  } catch (error) {
    console.error('Error al crear configuración de empresa:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
