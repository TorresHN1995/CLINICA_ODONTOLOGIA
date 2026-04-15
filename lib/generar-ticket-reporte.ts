import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface DatosEmpresa {
  nombre: string
  rtn?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  ciudad?: string | null
}

interface DatosFinanciero {
  totalIngresos: number
  totalEgresos: number
  utilidad: number
  margenUtilidad: string
  totalFacturas: number
  totalPagos: number
  saldoPendiente: number
  facturasQty: number
  facturasEstado: Record<string, number>
  egresosQty: number
  metodosPago: Record<string, number>
}

interface DatosClinico {
  citasTotal: number
  pacientesAtendidos: number
  tasaAsistencia: number
  procedimientosRealizados: number
  expedientesCreados: number
  tratamientosCreados: number
  citasCompletadas: number
  citasNoAsistio: number
  costoTotalTratamientos: number
  costoPromedioTratamientos: string
}

interface TicketOptions {
  tipo: 'financiero' | 'clinico'
  formato: 'pdf' | 'png'
  mes: number
  año: number
  empresa: DatosEmpresa
  financiero?: DatosFinanciero
  clinico?: DatosClinico
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function crearElementoTicket(options: TicketOptions): HTMLDivElement {
  const { tipo, mes, año, empresa } = options
  const nombreMes = MESES[mes - 1]

  const container = document.createElement('div')
  container.style.cssText = `
    width: 380px; padding: 24px; background: white; font-family: 'Segoe UI', Arial, sans-serif;
    color: #1e293b; line-height: 1.4; position: absolute; left: -9999px; top: 0;
  `

  let html = `
    <div style="text-align:center; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px;">
      <h2 style="margin:0; font-size:18px; color:#0f172a;">${empresa.nombre}</h2>
      ${empresa.rtn ? `<p style="margin:2px 0; font-size:11px; color:#64748b;">RTN: ${empresa.rtn}</p>` : ''}
      ${empresa.direccion ? `<p style="margin:2px 0; font-size:11px; color:#64748b;">${empresa.direccion}${empresa.ciudad ? `, ${empresa.ciudad}` : ''}</p>` : ''}
      ${empresa.telefono ? `<p style="margin:2px 0; font-size:11px; color:#64748b;">Tel: ${empresa.telefono}</p>` : ''}
    </div>
    <div style="text-align:center; margin-bottom: 16px;">
      <h3 style="margin:0; font-size:15px; color:#3b82f6; text-transform:uppercase; letter-spacing:1px;">
        Reporte ${tipo === 'financiero' ? 'Financiero' : 'Clínico'}
      </h3>
      <p style="margin:4px 0 0; font-size:13px; color:#64748b;">${nombreMes} ${año}</p>
    </div>
  `

  if (tipo === 'financiero' && options.financiero) {
    const f = options.financiero
    html += `
      <div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:12px;">
        <h4 style="margin:0 0 8px; font-size:13px; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Resumen General</h4>
        ${lineaTicket('Total Ingresos', `L. ${f.totalIngresos.toFixed(2)}`, '#16a34a')}
        ${lineaTicket('Total Egresos', `L. ${f.totalEgresos.toFixed(2)}`, '#dc2626')}
        <div style="border-top:1px dashed #cbd5e1; margin:6px 0;"></div>
        ${lineaTicket('Utilidad', `L. ${f.utilidad.toFixed(2)}`, f.utilidad >= 0 ? '#16a34a' : '#dc2626', true)}
        ${lineaTicket('Margen', `${f.margenUtilidad}%`)}
      </div>
      <div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:12px;">
        <h4 style="margin:0 0 8px; font-size:13px; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Facturación</h4>
        ${lineaTicket('Total Facturas', `${f.facturasQty}`)}
        ${lineaTicket('Monto Facturado', `L. ${f.totalFacturas.toFixed(2)}`)}
        ${lineaTicket('Total Cobrado', `L. ${f.totalPagos.toFixed(2)}`, '#16a34a')}
        ${lineaTicket('Saldo Pendiente', `L. ${f.saldoPendiente.toFixed(2)}`, '#dc2626')}
        <div style="border-top:1px dashed #cbd5e1; margin:6px 0;"></div>
        ${Object.entries(f.facturasEstado).map(([k, v]) => lineaTicket(`  ${k.charAt(0).toUpperCase() + k.slice(1)}`, `${v}`)).join('')}
      </div>
      <div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:12px;">
        <h4 style="margin:0 0 8px; font-size:13px; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Métodos de Pago</h4>
        ${Object.entries(f.metodosPago).map(([k, v]) => lineaTicket(k.replace(/_/g, ' '), `L. ${parseFloat(v.toString()).toFixed(2)}`)).join('')}
      </div>
      <div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:12px;">
        <h4 style="margin:0 0 8px; font-size:13px; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Egresos</h4>
        ${lineaTicket('Cantidad', `${f.egresosQty}`)}
        ${lineaTicket('Total', `L. ${f.totalEgresos.toFixed(2)}`)}
        ${lineaTicket('Promedio', `L. ${(f.totalEgresos / Math.max(f.egresosQty, 1)).toFixed(2)}`)}
      </div>
    `
  }

  if (tipo === 'clinico' && options.clinico) {
    const c = options.clinico
    html += `
      <div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:12px;">
        <h4 style="margin:0 0 8px; font-size:13px; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Resumen General</h4>
        ${lineaTicket('Citas Realizadas', `${c.citasTotal}`)}
        ${lineaTicket('Pacientes Atendidos', `${c.pacientesAtendidos}`)}
        ${lineaTicket('Tasa de Asistencia', `${c.tasaAsistencia.toFixed(1)}%`)}
        ${lineaTicket('Procedimientos', `${c.procedimientosRealizados}`)}
      </div>
      <div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:12px;">
        <h4 style="margin:0 0 8px; font-size:13px; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Citas</h4>
        ${lineaTicket('Completadas', `${c.citasCompletadas}`, '#16a34a')}
        ${lineaTicket('No Asistió', `${c.citasNoAsistio}`, '#dc2626')}
        ${lineaTicket('Expedientes Creados', `${c.expedientesCreados}`)}
      </div>
      <div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:12px;">
        <h4 style="margin:0 0 8px; font-size:13px; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Tratamientos</h4>
        ${lineaTicket('Creados', `${c.tratamientosCreados}`)}
        ${lineaTicket('Costo Total', `L. ${c.costoTotalTratamientos.toFixed(2)}`)}
        ${lineaTicket('Costo Promedio', `L. ${c.costoPromedioTratamientos}`)}
      </div>
    `
  }

  // Footer
  const ahora = new Date()
  html += `
    <div style="border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 8px; text-align:center;">
      <p style="margin:0; font-size:10px; color:#94a3b8;">
        Generado: ${ahora.toLocaleDateString('es-HN')} ${ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p style="margin:2px 0 0; font-size:10px; color:#94a3b8;">Sistema de Gestión Clínica Odontológica</p>
    </div>
  `

  container.innerHTML = html
  return container
}

function lineaTicket(label: string, value: string, color?: string, bold?: boolean): string {
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:2px 0; font-size:12px;">
      <span style="color:#475569;">${label}</span>
      <span style="color:${color || '#0f172a'}; ${bold ? 'font-weight:700; font-size:14px;' : 'font-weight:600;'}">${value}</span>
    </div>
  `
}

export async function generarTicketReporte(options: TicketOptions): Promise<void> {
  const { tipo, formato, mes, año } = options
  const nombreMes = MESES[mes - 1]
  const nombreArchivo = `reporte-${tipo}-${nombreMes}-${año}`.toLowerCase()

  // Crear elemento temporal en el DOM
  const elemento = crearElementoTicket(options)
  document.body.appendChild(elemento)

  try {
    // Capturar como canvas
    const canvas = await html2canvas(elemento, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })

    if (formato === 'png') {
      // Descargar como PNG
      const link = document.createElement('a')
      link.download = `${nombreArchivo}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } else {
      // Generar PDF
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Calcular dimensiones del PDF (ancho fijo 80mm tipo ticket)
      const pdfWidth = 80
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight + 10],
      })

      pdf.addImage(imgData, 'PNG', 0, 5, pdfWidth, pdfHeight)
      pdf.save(`${nombreArchivo}.pdf`)
    }
  } finally {
    document.body.removeChild(elemento)
  }
}
