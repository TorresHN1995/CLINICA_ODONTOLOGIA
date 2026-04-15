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

interface ItemTicket {
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface PagoTicket {
  monto: number
  metodoPago: string
  referencia?: string | null
  fecha: string
}

interface TicketFacturaOptions {
  empresa: DatosEmpresa
  factura: {
    numero: string
    fecha: string
    paciente: { nombre: string; apellido: string; identificacion: string }
    items: ItemTicket[]
    subtotal: number
    descuento: number
    impuesto: number
    total: number
    estado: string
  }
  pagos: PagoTicket[]
  totalPagado: number
  saldoPendiente: number
  tipo: 'pago' | 'pendiente'
  moneda?: string
}

function formatMoney(val: number, moneda: string): string {
  return `${moneda} ${val.toFixed(2)}`
}

function metodoLabel(m: string): string {
  const map: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TARJETA_CREDITO: 'Tarjeta Crédito',
    TARJETA_DEBITO: 'Tarjeta Débito',
    TRANSFERENCIA: 'Transferencia',
    CHEQUE: 'Cheque',
    OTRO: 'Otro',
  }
  return map[m] || m
}

function ln(label: string, value: string, color?: string, bold?: boolean): string {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;font-size:11px;">
    <span style="color:#475569;">${label}</span>
    <span style="color:${color || '#0f172a'};${bold ? 'font-weight:700;font-size:13px;' : 'font-weight:600;'}">${value}</span>
  </div>`
}

function crearTicketHTML(opts: TicketFacturaOptions): HTMLDivElement {
  const { empresa, factura, pagos, totalPagado, saldoPendiente, tipo, moneda = 'L.' } = opts
  const esPago = tipo === 'pago'

  const container = document.createElement('div')
  container.style.cssText = `
    width: 320px; padding: 20px; background: white; font-family: 'Segoe UI', Arial, sans-serif;
    color: #1e293b; line-height: 1.4; position: absolute; left: -9999px; top: 0;
  `

  let html = `
    <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:12px;">
      <h2 style="margin:0;font-size:16px;color:#0f172a;font-weight:800;">${empresa.nombre}</h2>
      ${empresa.rtn ? `<p style="margin:2px 0;font-size:10px;color:#64748b;">RTN: ${empresa.rtn}</p>` : ''}
      ${empresa.direccion ? `<p style="margin:2px 0;font-size:10px;color:#64748b;">${empresa.direccion}${empresa.ciudad ? `, ${empresa.ciudad}` : ''}</p>` : ''}
      ${empresa.telefono ? `<p style="margin:2px 0;font-size:10px;color:#64748b;">Tel: ${empresa.telefono}</p>` : ''}
    </div>

    <div style="text-align:center;margin-bottom:12px;">
      <div style="display:inline-block;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.5px;
        ${esPago
          ? 'background:#dcfce7;color:#166534;'
          : 'background:#fef3c7;color:#92400e;'
        }">
        ${esPago ? '✓ COMPROBANTE DE PAGO' : '⏳ CUENTA PENDIENTE'}
      </div>
    </div>

    <div style="background:#f8fafc;border-radius:6px;padding:10px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
        <span style="color:#64748b;">Factura:</span>
        <span style="font-weight:700;color:#0f172a;">${factura.numero}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
        <span style="color:#64748b;">Fecha:</span>
        <span style="color:#0f172a;">${factura.fecha}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;">
        <span style="color:#64748b;">Paciente:</span>
        <span style="color:#0f172a;">${factura.paciente.nombre} ${factura.paciente.apellido}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px;">
        <span style="color:#64748b;">ID:</span>
        <span style="color:#64748b;">${factura.paciente.identificacion}</span>
      </div>
    </div>
  `

  // Items
  html += `<div style="margin-bottom:10px;">
    <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;border-bottom:1px dashed #cbd5e1;padding-bottom:4px;">Detalle</div>`

  for (const item of factura.items) {
    html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px dotted #e2e8f0;">
      <div style="flex:1;color:#334155;">${item.descripcion} <span style="color:#94a3b8;">x${item.cantidad}</span></div>
      <div style="font-weight:600;color:#0f172a;margin-left:8px;">${formatMoney(item.subtotal, moneda)}</div>
    </div>`
  }
  html += `</div>`

  // Totales
  html += `<div style="background:#f8fafc;border-radius:6px;padding:10px;margin-bottom:10px;">`
  html += ln('Subtotal', formatMoney(factura.subtotal, moneda))
  if (factura.descuento > 0) {
    html += ln('Descuento', `- ${formatMoney(factura.descuento, moneda)}`, '#dc2626')
  }
  if (factura.impuesto > 0) {
    html += ln('I.S.V.', formatMoney(factura.impuesto, moneda))
  }
  html += `<div style="border-top:2px solid #cbd5e1;margin:6px 0;"></div>`
  html += ln('TOTAL', formatMoney(factura.total, moneda), '#0f172a', true)
  html += `</div>`

  // Pagos
  if (pagos.length > 0) {
    html += `<div style="background:#f0fdf4;border-radius:6px;padding:10px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Pagos Realizados</div>`
    for (const pago of pagos) {
      html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px dotted #bbf7d0;">
        <div style="color:#334155;">${metodoLabel(pago.metodoPago)}${pago.referencia ? ` <span style="color:#94a3b8;font-size:10px;">(${pago.referencia})</span>` : ''}</div>
        <div style="font-weight:700;color:#166534;">${formatMoney(pago.monto, moneda)}</div>
      </div>`
    }
    html += `<div style="border-top:1px solid #86efac;margin:6px 0;"></div>`
    html += ln('Total Pagado', formatMoney(totalPagado, moneda), '#166534', true)
    html += `</div>`
  }

  // Saldo
  if (saldoPendiente > 0) {
    html += `<div style="background:#fef2f2;border-radius:6px;padding:10px;margin-bottom:10px;text-align:center;">
      <div style="font-size:10px;color:#991b1b;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Saldo Pendiente</div>
      <div style="font-size:20px;font-weight:800;color:#dc2626;">${formatMoney(saldoPendiente, moneda)}</div>
    </div>`
  } else {
    html += `<div style="background:#dcfce7;border-radius:6px;padding:10px;margin-bottom:10px;text-align:center;">
      <div style="font-size:14px;font-weight:800;color:#166534;">✓ PAGADO EN SU TOTALIDAD</div>
    </div>`
  }

  // Footer
  const ahora = new Date()
  html += `<div style="border-top:2px dashed #cbd5e1;padding-top:8px;margin-top:6px;text-align:center;">
    <p style="margin:0;font-size:9px;color:#94a3b8;">Impreso: ${ahora.toLocaleDateString('es-HN')} ${ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}</p>
    <p style="margin:4px 0 0;font-size:10px;color:#64748b;font-weight:600;">¡Gracias por su preferencia!</p>
    <p style="margin:2px 0 0;font-size:9px;color:#94a3b8;">${empresa.nombre}</p>
  </div>`

  container.innerHTML = html
  return container
}

export async function generarTicketFactura(opts: TicketFacturaOptions, formato: 'pdf' | 'png' = 'pdf'): Promise<void> {
  const elemento = crearTicketHTML(opts)
  document.body.appendChild(elemento)

  try {
    const canvas = await html2canvas(elemento, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })

    const nombreArchivo = `ticket-${opts.factura.numero}-${opts.tipo}`

    if (formato === 'png') {
      const link = document.createElement('a')
      link.download = `${nombreArchivo}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } else {
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height
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
