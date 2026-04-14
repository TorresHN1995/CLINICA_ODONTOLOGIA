import nodemailer from 'nodemailer'

// Configurar transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    if (!process.env.EMAIL_SERVER_USER) {
      console.log('Email no configurado. Email que se enviaría:', { to, subject })
      return { success: false, message: 'Email no configurado' }
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error('Error enviando email:', error)
    return { success: false, error }
  }
}

// Plantillas de email
export const emailTemplates = {
  recordatorioCita: (paciente: string, fecha: string, hora: string, odontologo: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🦷 Recordatorio de Cita</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${paciente}</strong>,</p>
          <p>Te recordamos que tienes una cita programada:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Fecha:</strong> ${fecha}</p>
            <p><strong>🕐 Hora:</strong> ${hora}</p>
            <p><strong>👨‍⚕️ Odontólogo:</strong> ${odontologo}</p>
          </div>
          <p>Por favor, llega 10 minutos antes de tu cita.</p>
          <p>Si necesitas cancelar o reprogramar, contáctanos lo antes posible.</p>
        </div>
        <div class="footer">
          <p>Este es un mensaje automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  confirmacionCita: (paciente: string, fecha: string, hora: string, odontologo: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Cita Confirmada</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${paciente}</strong>,</p>
          <div class="success">
            <p><strong>¡Tu cita ha sido confirmada exitosamente!</strong></p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Fecha:</strong> ${fecha}</p>
            <p><strong>🕐 Hora:</strong> ${hora}</p>
            <p><strong>👨‍⚕️ Odontólogo:</strong> ${odontologo}</p>
          </div>
          <p>Te esperamos. ¡Gracias por confiar en nosotros!</p>
        </div>
      </div>
    </body>
    </html>
  `,

  facturaEnviada: (paciente: string, numeroFactura: string, total: string, linkPDF: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧾 Factura Generada</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${paciente}</strong>,</p>
          <p>Se ha generado tu factura:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Número de Factura:</strong> ${numeroFactura}</p>
            <p><strong>Total:</strong> ${total}</p>
          </div>
          <a href="${linkPDF}" class="button">Descargar Factura PDF</a>
          <p>Gracias por tu preferencia.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  bajoStock: (producto: string, stockActual: number, stockMinimo: number) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Alerta de Inventario</h1>
        </div>
        <div class="content">
          <div class="alert">
            <p><strong>Stock Bajo Detectado</strong></p>
          </div>
          <p>El siguiente producto está por debajo del stock mínimo:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Producto:</strong> ${producto}</p>
            <p><strong>Stock Actual:</strong> ${stockActual}</p>
            <p><strong>Stock Mínimo:</strong> ${stockMinimo}</p>
          </div>
          <p>Por favor, realiza un pedido lo antes posible.</p>
        </div>
      </div>
    </body>
    </html>
  `,
}
