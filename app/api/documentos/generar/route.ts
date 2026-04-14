import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, pacienteId, contenido } = body

    // Validar tipo de documento
    const tiposValidos = ['RECETA', 'CONSENTIMIENTO', 'ORDEN_LABORATORIO']
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      )
    }

    // Obtener información del paciente
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
    })

    if (!paciente) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    // Obtener configuración de la empresa
    const config = await prisma.configuracionEmpresa.findFirst({
      where: { activo: true },
    })

    // Generar HTML del documento según el tipo
    let html = ''
    const fecha = new Date().toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    if (tipo === 'RECETA') {
      html = generarReceta(paciente, contenido, config, fecha, session.user)
    } else if (tipo === 'CONSENTIMIENTO') {
      html = generarConsentimiento(paciente, contenido, config, fecha)
    } else if (tipo === 'ORDEN_LABORATORIO') {
      html = generarOrdenLaboratorio(paciente, contenido, config, fecha, session.user)
    }

    return NextResponse.json({ html, success: true })
  } catch (error) {
    console.error('Error generando documento:', error)
    return NextResponse.json(
      { error: 'Error al generar documento' },
      { status: 500 }
    )
  }
}

function generarReceta(paciente: any, contenido: any, config: any, fecha: string, usuario: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { margin: 2cm; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
        .info { font-size: 12px; color: #666; }
        .paciente { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .medicamentos { margin: 30px 0; }
        .medicamento { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .firma { margin-top: 60px; text-align: center; }
        .linea-firma { border-top: 2px solid #333; width: 300px; margin: 0 auto; padding-top: 10px; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🦷 ${config?.nombre || 'Clínica Odontológica'}</div>
        <div class="info">
          ${config?.direccion || ''}<br>
          Tel: ${config?.telefono || ''} | Email: ${config?.email || ''}<br>
          RTN: ${config?.rtn || ''}
        </div>
      </div>

      <h2 style="color: #3B82F6; text-align: center;">RECETA MÉDICA</h2>

      <div class="paciente">
        <p><strong>Paciente:</strong> ${paciente.nombre} ${paciente.apellido}</p>
        <p><strong>Identificación:</strong> ${paciente.identificacion}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
      </div>

      <div class="medicamentos">
        <h3>Rp/</h3>
        ${contenido.medicamentos.map((med: any) => `
          <div class="medicamento">
            <p><strong>${med.nombre}</strong></p>
            <p><strong>Dosis:</strong> ${med.dosis}</p>
            <p><strong>Frecuencia:</strong> ${med.frecuencia}</p>
            <p><strong>Duración:</strong> ${med.duracion}</p>
            ${med.indicaciones ? `<p><strong>Indicaciones:</strong> ${med.indicaciones}</p>` : ''}
          </div>
        `).join('')}
      </div>

      ${contenido.observaciones ? `
        <div style="margin: 20px 0;">
          <p><strong>Observaciones:</strong></p>
          <p>${contenido.observaciones}</p>
        </div>
      ` : ''}

      <div class="firma">
        <div class="linea-firma">
          <p><strong>Dr. ${usuario.name}</strong></p>
          <p>Odontólogo</p>
        </div>
      </div>

      <div class="footer">
        <p>Este documento es válido únicamente con firma y sello del profesional</p>
      </div>
    </body>
    </html>
  `
}

function generarConsentimiento(paciente: any, contenido: any, config: any, fecha: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { margin: 2cm; }
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 15px; margin-bottom: 25px; }
        .logo { font-size: 20px; font-weight: bold; color: #3B82F6; }
        .content { text-align: justify; }
        .firma-section { margin-top: 50px; display: flex; justify-content: space-around; }
        .firma-box { text-align: center; }
        .linea { border-top: 2px solid #333; width: 200px; margin: 40px auto 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🦷 ${config?.nombre || 'Clínica Odontológica'}</div>
        <p style="font-size: 12px; color: #666;">${config?.direccion || ''}</p>
      </div>

      <h2 style="text-align: center; color: #3B82F6;">CONSENTIMIENTO INFORMADO</h2>
      <h3 style="text-align: center;">${contenido.procedimiento}</h3>

      <div class="content">
        <p><strong>Yo, ${paciente.nombre} ${paciente.apellido}</strong>, identificado(a) con número <strong>${paciente.identificacion}</strong>, declaro que:</p>

        <ol style="margin: 20px 0;">
          <li>He sido informado(a) sobre el procedimiento: <strong>${contenido.procedimiento}</strong></li>
          <li>Comprendo los riesgos y beneficios del tratamiento propuesto</li>
          <li>He tenido la oportunidad de hacer preguntas y todas han sido respondidas satisfactoriamente</li>
          <li>Autorizo al Dr./Dra. a realizar el procedimiento mencionado</li>
        </ol>

        ${contenido.riesgos ? `
          <p><strong>Riesgos explicados:</strong></p>
          <p>${contenido.riesgos}</p>
        ` : ''}

        ${contenido.alternativas ? `
          <p><strong>Alternativas de tratamiento:</strong></p>
          <p>${contenido.alternativas}</p>
        ` : ''}

        ${contenido.observaciones ? `
          <p><strong>Observaciones adicionales:</strong></p>
          <p>${contenido.observaciones}</p>
        ` : ''}

        <p style="margin-top: 30px;">Fecha: ${fecha}</p>
      </div>

      <div class="firma-section">
        <div class="firma-box">
          <div class="linea"></div>
          <p><strong>Firma del Paciente</strong></p>
          <p>${paciente.nombre} ${paciente.apellido}</p>
        </div>
        <div class="firma-box">
          <div class="linea"></div>
          <p><strong>Firma del Odontólogo</strong></p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generarOrdenLaboratorio(paciente: any, contenido: any, config: any, fecha: string, usuario: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { margin: 2cm; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #8B5CF6; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #8B5CF6; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .trabajo { background: white; border: 2px solid #8B5CF6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🦷 ${config?.nombre || 'Clínica Odontológica'}</div>
        <p style="font-size: 12px; color: #666;">
          ${config?.direccion || ''} | Tel: ${config?.telefono || ''}
        </p>
      </div>

      <h2 style="color: #8B5CF6; text-align: center;">ORDEN DE LABORATORIO</h2>

      <div class="info-box">
        <p><strong>Paciente:</strong> ${paciente.nombre} ${paciente.apellido}</p>
        <p><strong>Identificación:</strong> ${paciente.identificacion}</p>
        <p><strong>Fecha de Orden:</strong> ${fecha}</p>
        <p><strong>Fecha de Entrega:</strong> ${contenido.fechaEntrega || 'A coordinar'}</p>
      </div>

      <div class="trabajo">
        <h3>Trabajo Solicitado</h3>
        <p><strong>Tipo:</strong> ${contenido.tipoTrabajo}</p>
        <p><strong>Descripción:</strong></p>
        <p>${contenido.descripcion}</p>

        ${contenido.especificaciones ? `
          <p><strong>Especificaciones:</strong></p>
          <ul>
            ${contenido.especificaciones.map((esp: string) => `<li>${esp}</li>`).join('')}
          </ul>
        ` : ''}

        ${contenido.color ? `<p><strong>Color:</strong> ${contenido.color}</p>` : ''}
        ${contenido.material ? `<p><strong>Material:</strong> ${contenido.material}</p>` : ''}
      </div>

      ${contenido.observaciones ? `
        <div style="margin: 20px 0;">
          <p><strong>Observaciones:</strong></p>
          <p>${contenido.observaciones}</p>
        </div>
      ` : ''}

      <div style="margin-top: 50px; text-align: center;">
        <div style="border-top: 2px solid #333; width: 300px; margin: 0 auto; padding-top: 10px;">
          <p><strong>Dr. ${usuario.name}</strong></p>
          <p>Odontólogo</p>
        </div>
      </div>
    </body>
    </html>
  `
}
