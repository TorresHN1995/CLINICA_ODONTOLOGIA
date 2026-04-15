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

interface CorrelativoSAR {
  cai?: string | null
  sucursal?: string
  puntoEmision?: string
  tipoDoc?: string
  rangoInicial?: number
  rangoFinal?: number
  fechaLimite?: string | Date
}

interface TicketFacturaOptions {
  empresa: DatosEmpresa
  factura: {
    numero: string
    fecha: string
    tipoDocumento?: string
    cai?: string | null
    paciente: { nombre: string; apellido: string; identificacion: string }
    emitente?: { nombre: string; apellido: string } | null
    items: ItemTicket[]
    subtotal: number
    descuento: number
    impuesto: number
    total: number
    estado: string
    correlativo?: CorrelativoSAR | null
  }
  pagos: PagoTicket[]
  totalPagado: number
  saldoPendiente: number
  tipo: 'pago' | 'pendiente'
  moneda?: string
}

function fmt(val: number, m: string): string {
  return `${m} ${val.toFixed(2)}`
}

function metodoLabel(m: string): string {
  const map: Record<string, string> = {
    EFECTIVO: 'Efectivo', TARJETA_CREDITO: 'Tarjeta Crédito', TARJETA_DEBITO: 'Tarjeta Débito',
    TRANSFERENCIA: 'Transferencia', CHEQUE: 'Cheque', OTRO: 'Otro',
  }
  return map[m] || m
}

function row(label: string, value: string, color?: string, bold?: boolean): string {
  return `<div style="display:flex;justify-content:space-between;padding:1px 0;font-size:11px;">
    <span style="color:#475569;">${label}</span>
    <span style="color:${color || '#0f172a'};${bold ? 'font-weight:700;font-size:13px;' : 'font-weight:600;'}">${value}</span>
  </div>`
}

function crearTicketHTML(opts: TicketFacturaOptions): HTMLDivElement {
  const { empresa, factura, pagos, totalPagado, saldoPendiente, moneda = 'L.' } = opts
  const corr = factura.correlativo
  const esSAR = factura.tipoDocumento === 'FACTURA' && (factura.cai || corr?.cai)
  const cai = factura.cai || corr?.cai || ''

  const container = document.createElement('div')
  container.style.cssText = `
    width: 340px;padding:20px;background:white;font-family:'Segoe UI',Arial,sans-serif;
    color:#1e293b;line-height:1.35;position:absolute;left:-9999px;top:0;
  `

  // Rango autorizado
  let rangoStr = ''
  if (corr && corr.rangoInicial != null && corr.rangoFinal != null) {
    const pre = `${corr.sucursal}-${corr.puntoEmision}-${corr.tipoDoc}`
    rangoStr = `${pre}-${String(corr.rangoInicial).padStart(8, '0')} al ${pre}-${String(corr.rangoFinal).padStart(8, '0')}`
  }

  let fechaLimiteStr = ''
  if (corr?.fechaLimite) {
    const fl = new Date(corr.fechaLimite)
    fechaLimiteStr = fl.toLocaleDateString('es-HN')
  }

  let html = `
    <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:10px;">
      <h2 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">${empresa.nombre}</h2>
      ${empresa.rtn ? `<p style="margin:1px 0;font-size:10px;color:#475569;">RTN: ${empresa.rtn}</p>` : ''}
      ${empresa.direccion ? `<p style="margin:1px 0;font-size:10px;color:#64748b;">${empresa.direccion}${empresa.ciudad ? `, ${empresa.ciudad}` : ''}</p>` : ''}
      ${empresa.telefono ? `<p style="margin:1px 0;font-size:10px;color:#64748b;">Tel: ${empresa.telefono}</p>` : ''}
      ${empresa.email ? `<p style="margin:1px 0;font-size:10px;color:#64748b;">${empresa.email}</p>` : ''}
    </div>`

  // Tipo de documento
  html += `<div style="text-align:center;margin-bottom:10px;">
    <div style="font-size:14px;font-weight:800;color:#0f172a;letter-spacing:1px;">
      ${esSAR ? 'FACTURA' : 'ORDEN DE PEDIDO'}
    </div>
    <div style="font-size:13px;font-weight:700;color:#1e40af;margin-top:2px;">${factura.numero}</div>
  </div>`

  // Datos SAR
  if (esSAR) {
    html += `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px;margin-bottom:10px;font-size:10px;">
      <div style="font-weight:700;color:#1e40af;text-align:center;margin-bottom:4px;font-size:11px;">DATOS FISCALES SAR</div>
      <div style="display:flex;justify-content:space-between;padding:1px 0;">
        <span style="color:#475569;">CAI:</span>
        <span style="color:#1e40af;font-weight:600;font-size:9px;word-break:break-all;max-width:200px;text-align:right;">${cai}</span>
      </div>
      ${rangoStr ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
        <span style="color:#475569;">Rango Autorizado:</span>
        <span style="color:#0f172a;font-weight:600;font-size:9px;">${rangoStr}</span>
      </div>` : ''}
      ${fechaLimiteStr ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
        <span style="color:#475569;">Fecha Límite:</span>
        <span style="color:#0f172a;font-weight:600;">${fechaLimiteStr}</span>
      </div>` : ''}
    </div>`
  }

  // Datos factura + paciente
  html += `<div style="background:#f8fafc;border-radius:6px;padding:8px;margin-bottom:10px;font-size:11px;">
    ${row('Fecha:', factura.fecha)}
    ${row('Cliente:', `${factura.paciente.nombre} ${factura.paciente.apellido}`)}
    ${row('Identidad:', factura.paciente.identificacion)}
    ${factura.emitente ? row('Emitido por:', `${factura.emitente.nombre} ${factura.emitente.apellido}`) : ''}
  </div>`

  // Items
  html += `<div style="margin-bottom:8px;">
    <table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead>
        <tr style="border-bottom:2px solid #cbd5e1;">
          <th style="text-align:left;padding:4px 2px;color:#64748b;font-weight:700;">Descripción</th>
          <th style="text-align:center;padding:4px 2px;color:#64748b;font-weight:700;width:30px;">Cant</th>
          <th style="text-align:right;padding:4px 2px;color:#64748b;font-weight:700;width:65px;">P.Unit</th>
          <th style="text-align:right;padding:4px 2px;color:#64748b;font-weight:700;width:65px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>`
  for (const item of factura.items) {
    html += `<tr style="border-bottom:1px dotted #e2e8f0;">
      <td style="padding:3px 2px;color:#334155;">${item.descripcion}</td>
      <td style="padding:3px 2px;text-align:center;color:#334155;">${item.cantidad}</td>
      <td style="padding:3px 2px;text-align:right;color:#334155;">${fmt(item.precioUnitario, moneda)}</td>
      <td style="padding:3px 2px;text-align:right;font-weight:600;color:#0f172a;">${fmt(item.subtotal, moneda)}</td>
    </tr>`
  }
  html += `</tbody></table></div>`

  // Totales
  html += `<div style="background:#f8fafc;border-radius:6px;padding:8px;margin-bottom:8px;">`
  html += row('Subtotal', fmt(factura.subtotal, moneda))
  if (factura.descuento > 0) html += row('Descuento', `- ${fmt(factura.descuento, moneda)}`, '#dc2626')
  if (factura.impuesto > 0) html += row('I.S.V. (15%)', fmt(factura.impuesto, moneda))
  html += `<div style="border-top:2px solid #0f172a;margin:6px 0;"></div>`
  html += row('TOTAL', fmt(factura.total, moneda), '#0f172a', true)
  html += `</div>`

  // Pagos
  if (pagos.length > 0) {
    html += `<div style="background:#f0fdf4;border-radius:6px;padding:8px;margin-bottom:8px;">
      <div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;margin-bottom:4px;">Pagos</div>`
    for (const pago of pagos) {
      html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px dotted #bbf7d0;">
        <span style="color:#334155;">${metodoLabel(pago.metodoPago)}${pago.referencia ? ` (${pago.referencia})` : ''}</span>
        <span style="font-weight:700;color:#166534;">${fmt(pago.monto, moneda)}</span>
      </div>`
    }
    html += row('Total Pagado', fmt(totalPagado, moneda), '#166534', true)
    html += `</div>`
  }

  // Saldo
  if (saldoPendiente > 0) {
    html += `<div style="background:#fef2f2;border-radius:6px;padding:8px;margin-bottom:8px;text-align:center;">
      <div style="font-size:10px;color:#991b1b;font-weight:600;">SALDO PENDIENTE</div>
      <div style="font-size:18px;font-weight:800;color:#dc2626;">${fmt(saldoPendiente, moneda)}</div>
    </div>`
  } else {
    html += `<div style="background:#dcfce7;border-radius:6px;padding:8px;margin-bottom:8px;text-align:center;">
      <div style="font-size:13px;font-weight:800;color:#166534;">✓ CANCELADO</div>
    </div>`
  }

  // Footer
  const ahora = new Date()
  html += `<div style="border-top:2px dashed #cbd5e1;padding-top:8px;text-align:center;">
    <p style="margin:0;font-size:9px;color:#94a3b8;">Impreso: ${ahora.toLocaleDateString('es-HN')} ${ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}</p>
    ${esSAR ? `<p style="margin:3px 0;font-size:8px;color:#94a3b8;">La factura es beneficio de todos. Exíjala.</p>` : ''}
    <p style="margin:3px 0 0;font-size:10px;color:#64748b;font-weight:600;">¡Gracias por su preferencia!</p>
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

    const nombreArchivo = `factura-${opts.factura.numero}-${opts.tipo}`

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

export async function imprimirTicketFactura(opts: TicketFacturaOptions): Promise<void> {
  const elemento = crearTicketHTML(opts)
  // Clonar para la ventana de impresión
  const printWindow = window.open('', '_blank', 'width=400,height=700')
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresión. Verifique que los popups estén permitidos.')
  }

  printWindow.document.write(`<!DOCTYPE html><html><head><title>Factura ${opts.factura.numero}</title>
    <style>
      @media print { body { margin: 0; } @page { margin: 5mm; size: 80mm auto; } }
      body { margin: 0; padding: 0; display: flex; justify-content: center; }
    </style>
  </head><body></body></html>`)

  // Mover el contenido al print window
  elemento.style.position = 'relative'
  elemento.style.left = '0'
  printWindow.document.body.appendChild(elemento)
  printWindow.document.close()

  // Esperar a que cargue y luego imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }
  // Fallback si onload no dispara
  setTimeout(() => {
    try {
      printWindow.print()
      printWindow.close()
    } catch {}
  }, 1000)
}
