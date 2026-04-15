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

export interface TicketFacturaOptions {
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

export type TamanoTicket = 'ticket' | 'carta'

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

function getSARInfo(factura: TicketFacturaOptions['factura']) {
  const corr = factura.correlativo
  const esSAR = factura.tipoDocumento === 'FACTURA' && (factura.cai || corr?.cai)
  const cai = factura.cai || corr?.cai || ''
  let rangoStr = ''
  if (corr?.rangoInicial != null && corr?.rangoFinal != null) {
    const pre = `${corr.sucursal}-${corr.puntoEmision}-${corr.tipoDoc}`
    rangoStr = `${pre}-${String(corr.rangoInicial).padStart(8, '0')} al ${pre}-${String(corr.rangoFinal).padStart(8, '0')}`
  }
  let fechaLimite = ''
  if (corr?.fechaLimite) fechaLimite = new Date(corr.fechaLimite).toLocaleDateString('es-HN')
  return { esSAR, cai, rangoStr, fechaLimite }
}

// ═══════════════════════════════════════════
// TICKET 80mm
// ═══════════════════════════════════════════
function crearTicket80mm(opts: TicketFacturaOptions): HTMLDivElement {
  const { empresa, factura, pagos, totalPagado, saldoPendiente, moneda = 'L.' } = opts
  const { esSAR, cai, rangoStr, fechaLimite } = getSARInfo(factura)

  const c = document.createElement('div')
  c.style.cssText = 'width:320px;padding:18px;background:white;font-family:"Segoe UI",Arial,sans-serif;color:#1e293b;line-height:1.35;position:absolute;left:-9999px;top:0;'

  let h = `
    <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:10px;">
      <div style="font-size:16px;font-weight:800;color:#0f172a;">${empresa.nombre}</div>
      ${empresa.rtn ? `<div style="font-size:10px;color:#475569;">RTN: ${empresa.rtn}</div>` : ''}
      ${empresa.direccion ? `<div style="font-size:10px;color:#64748b;">${empresa.direccion}${empresa.ciudad ? `, ${empresa.ciudad}` : ''}</div>` : ''}
      ${empresa.telefono ? `<div style="font-size:10px;color:#64748b;">Tel: ${empresa.telefono}</div>` : ''}
    </div>
    <div style="text-align:center;margin-bottom:8px;">
      <div style="font-size:13px;font-weight:800;letter-spacing:1px;">${esSAR ? 'FACTURA' : 'ORDEN DE PEDIDO'}</div>
      <div style="font-size:12px;font-weight:700;color:#1e40af;">${factura.numero}</div>
    </div>`

  if (esSAR) {
    h += `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:6px;margin-bottom:8px;font-size:9px;">
      <div style="font-weight:700;color:#1e40af;text-align:center;margin-bottom:3px;">DATOS FISCALES SAR</div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#475569;">CAI:</span><span style="color:#1e40af;font-weight:600;max-width:180px;text-align:right;word-break:break-all;">${cai}</span></div>
      ${rangoStr ? `<div style="display:flex;justify-content:space-between;"><span style="color:#475569;">Rango:</span><span style="color:#0f172a;font-weight:600;">${rangoStr}</span></div>` : ''}
      ${fechaLimite ? `<div style="display:flex;justify-content:space-between;"><span style="color:#475569;">Fecha Límite:</span><span style="font-weight:600;">${fechaLimite}</span></div>` : ''}
    </div>`
  }

  h += `<div style="font-size:10px;margin-bottom:8px;padding:6px;background:#f8fafc;border-radius:4px;">
    <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Fecha:</span><span>${factura.fecha}</span></div>
    <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Cliente:</span><span>${factura.paciente.nombre} ${factura.paciente.apellido}</span></div>
    <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">ID:</span><span>${factura.paciente.identificacion}</span></div>
  </div>`

  // Items
  h += `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px;">
    <tr style="border-bottom:1px solid #94a3b8;"><th style="text-align:left;padding:3px 0;color:#64748b;">Desc.</th><th style="text-align:center;color:#64748b;width:25px;">Cant</th><th style="text-align:right;color:#64748b;width:55px;">P.U.</th><th style="text-align:right;color:#64748b;width:60px;">Total</th></tr>`
  for (const it of factura.items) {
    h += `<tr style="border-bottom:1px dotted #e2e8f0;"><td style="padding:2px 0;">${it.descripcion}</td><td style="text-align:center;">${it.cantidad}</td><td style="text-align:right;">${fmt(it.precioUnitario, moneda)}</td><td style="text-align:right;font-weight:600;">${fmt(it.subtotal, moneda)}</td></tr>`
  }
  h += `</table>`

  // Totales
  h += `<div style="font-size:11px;padding:6px;background:#f8fafc;border-radius:4px;margin-bottom:8px;">`
  h += `<div style="display:flex;justify-content:space-between;"><span style="color:#475569;">Subtotal</span><span>${fmt(factura.subtotal, moneda)}</span></div>`
  if (factura.descuento > 0) h += `<div style="display:flex;justify-content:space-between;"><span style="color:#475569;">Descuento</span><span style="color:#dc2626;">- ${fmt(factura.descuento, moneda)}</span></div>`
  if (factura.impuesto > 0) h += `<div style="display:flex;justify-content:space-between;"><span style="color:#475569;">I.S.V. (15%)</span><span>${fmt(factura.impuesto, moneda)}</span></div>`
  h += `<div style="border-top:2px solid #0f172a;margin:4px 0;"></div>`
  h += `<div style="display:flex;justify-content:space-between;font-weight:800;font-size:13px;"><span>TOTAL</span><span>${fmt(factura.total, moneda)}</span></div></div>`

  if (pagos.length > 0) {
    h += `<div style="font-size:10px;padding:6px;background:#f0fdf4;border-radius:4px;margin-bottom:8px;">`
    for (const p of pagos) h += `<div style="display:flex;justify-content:space-between;padding:1px 0;"><span>${metodoLabel(p.metodoPago)}</span><span style="font-weight:700;color:#166534;">${fmt(p.monto, moneda)}</span></div>`
    h += `<div style="border-top:1px solid #86efac;margin:3px 0;"></div><div style="display:flex;justify-content:space-between;font-weight:700;"><span>Total Pagado</span><span style="color:#166534;">${fmt(totalPagado, moneda)}</span></div></div>`
  }

  if (saldoPendiente > 0) {
    h += `<div style="text-align:center;padding:6px;background:#fef2f2;border-radius:4px;margin-bottom:8px;"><div style="font-size:9px;color:#991b1b;font-weight:600;">SALDO PENDIENTE</div><div style="font-size:16px;font-weight:800;color:#dc2626;">${fmt(saldoPendiente, moneda)}</div></div>`
  } else {
    h += `<div style="text-align:center;padding:6px;background:#dcfce7;border-radius:4px;margin-bottom:8px;font-size:12px;font-weight:800;color:#166534;">✓ CANCELADO</div>`
  }

  const now = new Date()
  h += `<div style="border-top:2px dashed #cbd5e1;padding-top:6px;text-align:center;font-size:9px;color:#94a3b8;">
    <div>Impreso: ${now.toLocaleDateString('es-HN')} ${now.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}</div>
    ${esSAR ? '<div style="margin-top:2px;">La factura es beneficio de todos. Exíjala.</div>' : ''}
    <div style="margin-top:3px;font-size:10px;color:#64748b;font-weight:600;">¡Gracias por su preferencia!</div>
  </div>`

  c.innerHTML = h
  return c
}


// ═══════════════════════════════════════════
// FACTURA TAMAÑO CARTA (Letter)
// ═══════════════════════════════════════════
function crearFacturaCarta(opts: TicketFacturaOptions): HTMLDivElement {
  const { empresa, factura, pagos, totalPagado, saldoPendiente, moneda = 'L.' } = opts
  const { esSAR, cai, rangoStr, fechaLimite } = getSARInfo(factura)

  const c = document.createElement('div')
  c.style.cssText = 'width:816px;min-height:1056px;padding:48px;background:white;font-family:"Segoe UI",Arial,sans-serif;color:#1e293b;line-height:1.5;position:absolute;left:-9999px;top:0;box-sizing:border-box;'

  let h = ''

  // ── HEADER ──
  h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e40af;padding-bottom:20px;margin-bottom:24px;">
    <div>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#0f172a;">${empresa.nombre}</h1>
      ${empresa.rtn ? `<div style="font-size:13px;color:#475569;margin-top:4px;">RTN: <strong>${empresa.rtn}</strong></div>` : ''}
      ${empresa.direccion ? `<div style="font-size:12px;color:#64748b;">${empresa.direccion}${empresa.ciudad ? `, ${empresa.ciudad}` : ''}</div>` : ''}
      <div style="font-size:12px;color:#64748b;">
        ${empresa.telefono ? `Tel: ${empresa.telefono}` : ''}${empresa.telefono && empresa.email ? ' | ' : ''}${empresa.email || ''}
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:24px;font-weight:800;color:#1e40af;letter-spacing:2px;">${esSAR ? 'FACTURA' : 'ORDEN DE PEDIDO'}</div>
      <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:4px;">${factura.numero}</div>
      <div style="font-size:13px;color:#64748b;margin-top:4px;">Fecha: <strong>${factura.fecha}</strong></div>
    </div>
  </div>`

  // ── SAR BOX ──
  if (esSAR) {
    h += `<div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:8px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;margin-bottom:10px;">
        <div style="width:8px;height:8px;background:#1e40af;border-radius:50%;margin-right:8px;"></div>
        <span style="font-size:14px;font-weight:700;color:#1e40af;letter-spacing:1px;">DATOS FISCALES SAR</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
        <div><span style="color:#64748b;">C.A.I.:</span><br/><strong style="color:#1e40af;font-size:11px;word-break:break-all;">${cai}</strong></div>
        <div><span style="color:#64748b;">Fecha Límite Emisión:</span><br/><strong>${fechaLimite || 'N/A'}</strong></div>
        <div style="grid-column:1/3;"><span style="color:#64748b;">Rango Autorizado:</span><br/><strong style="font-size:11px;">${rangoStr || 'N/A'}</strong></div>
      </div>
    </div>`
  }

  // ── CLIENTE + EMITENTE ──
  h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
    <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Datos del Cliente</div>
      <div style="font-size:14px;font-weight:700;color:#0f172a;">${factura.paciente.nombre} ${factura.paciente.apellido}</div>
      <div style="font-size:12px;color:#475569;margin-top:4px;">Identidad: <strong>${factura.paciente.identificacion}</strong></div>
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Emitido por</div>
      <div style="font-size:14px;font-weight:700;color:#0f172a;">${factura.emitente ? `${factura.emitente.nombre} ${factura.emitente.apellido}` : 'Sistema'}</div>
      <div style="font-size:12px;color:#475569;margin-top:4px;">Fecha: <strong>${factura.fecha}</strong></div>
    </div>
  </div>`

  // ── TABLA DE ITEMS ──
  h += `<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#1e40af;">
        <th style="padding:10px 12px;text-align:left;color:white;font-size:12px;font-weight:600;border-radius:6px 0 0 0;">#</th>
        <th style="padding:10px 12px;text-align:left;color:white;font-size:12px;font-weight:600;">Descripción</th>
        <th style="padding:10px 12px;text-align:center;color:white;font-size:12px;font-weight:600;width:70px;">Cant.</th>
        <th style="padding:10px 12px;text-align:right;color:white;font-size:12px;font-weight:600;width:120px;">Precio Unit.</th>
        <th style="padding:10px 12px;text-align:right;color:white;font-size:12px;font-weight:600;width:120px;border-radius:0 6px 0 0;">Subtotal</th>
      </tr>
    </thead>
    <tbody>`
  factura.items.forEach((it, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc'
    h += `<tr style="background:${bg};border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 12px;font-size:12px;color:#64748b;">${i + 1}</td>
      <td style="padding:10px 12px;font-size:13px;color:#0f172a;font-weight:500;">${it.descripcion}</td>
      <td style="padding:10px 12px;text-align:center;font-size:13px;">${it.cantidad}</td>
      <td style="padding:10px 12px;text-align:right;font-size:13px;">${fmt(it.precioUnitario, moneda)}</td>
      <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:600;">${fmt(it.subtotal, moneda)}</td>
    </tr>`
  })
  h += `</tbody></table>`

  // ── TOTALES ──
  h += `<div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
    <div style="width:320px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #e2e8f0;">
        <span style="color:#64748b;">Subtotal</span><span style="font-weight:600;">${fmt(factura.subtotal, moneda)}</span>
      </div>`
  if (factura.descuento > 0) {
    h += `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #e2e8f0;">
      <span style="color:#64748b;">Descuento</span><span style="font-weight:600;color:#dc2626;">- ${fmt(factura.descuento, moneda)}</span>
    </div>`
  }
  if (factura.impuesto > 0) {
    h += `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #e2e8f0;">
      <span style="color:#64748b;">I.S.V. (15%)</span><span style="font-weight:600;">${fmt(factura.impuesto, moneda)}</span>
    </div>`
  }
  h += `<div style="display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:800;border-top:3px solid #1e40af;margin-top:4px;">
      <span>TOTAL</span><span>${fmt(factura.total, moneda)}</span>
    </div>
    </div>
  </div>`

  // ── PAGOS ──
  if (pagos.length > 0) {
    h += `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Pagos Realizados</div>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">`
    for (const p of pagos) {
      h += `<tr style="border-bottom:1px solid #dcfce7;">
        <td style="padding:6px 0;color:#334155;">${metodoLabel(p.metodoPago)}${p.referencia ? ` <span style="color:#94a3b8;font-size:11px;">(Ref: ${p.referencia})</span>` : ''}</td>
        <td style="padding:6px 0;text-align:right;font-weight:700;color:#166534;">${fmt(p.monto, moneda)}</td>
      </tr>`
    }
    h += `<tr><td style="padding:8px 0;font-weight:700;font-size:14px;border-top:2px solid #86efac;">Total Pagado</td>
      <td style="padding:8px 0;text-align:right;font-weight:800;font-size:14px;color:#166534;border-top:2px solid #86efac;">${fmt(totalPagado, moneda)}</td></tr>
    </table></div>`
  }

  // ── SALDO ──
  if (saldoPendiente > 0) {
    h += `<div style="text-align:center;padding:16px;background:#fef2f2;border:2px solid #fecaca;border-radius:8px;margin-bottom:20px;">
      <div style="font-size:12px;color:#991b1b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Saldo Pendiente</div>
      <div style="font-size:28px;font-weight:800;color:#dc2626;margin-top:4px;">${fmt(saldoPendiente, moneda)}</div>
    </div>`
  } else {
    h += `<div style="text-align:center;padding:16px;background:#dcfce7;border:2px solid #86efac;border-radius:8px;margin-bottom:20px;">
      <div style="font-size:18px;font-weight:800;color:#166534;">✓ CANCELADO EN SU TOTALIDAD</div>
    </div>`
  }

  // ── FOOTER ──
  const now = new Date()
  h += `<div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-top:auto;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:11px;color:#94a3b8;">
      Impreso: ${now.toLocaleDateString('es-HN')} ${now.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
    </div>
    <div style="text-align:center;font-size:11px;color:#64748b;">
      ${esSAR ? '<div>La factura es beneficio de todos. Exíjala.</div>' : ''}
      <div style="font-weight:600;margin-top:2px;">¡Gracias por su preferencia!</div>
    </div>
    <div style="font-size:11px;color:#94a3b8;text-align:right;">
      ${empresa.nombre}
    </div>
  </div>`

  c.innerHTML = h
  return c
}


// ═══════════════════════════════════════════
// FUNCIONES PÚBLICAS
// ═══════════════════════════════════════════

function crearElemento(opts: TicketFacturaOptions, tamano: TamanoTicket): HTMLDivElement {
  return tamano === 'carta' ? crearFacturaCarta(opts) : crearTicket80mm(opts)
}

export async function generarTicketFactura(
  opts: TicketFacturaOptions,
  formato: 'pdf' | 'png' = 'pdf',
  tamano: TamanoTicket = 'ticket'
): Promise<void> {
  const elemento = crearElemento(opts, tamano)
  document.body.appendChild(elemento)

  try {
    const canvas = await html2canvas(elemento, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })

    const nombreArchivo = `factura-${opts.factura.numero}-${tamano}`

    if (formato === 'png') {
      const link = document.createElement('a')
      link.download = `${nombreArchivo}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } else {
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      if (tamano === 'carta') {
        // Letter size: 215.9mm x 279.4mm
        const pdfWidth = 215.9
        const pdfHeight = 279.4
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
        const w = imgWidth * ratio
        const h = imgHeight * ratio

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
        pdf.addImage(imgData, 'PNG', (pdfWidth - w) / 2, 5, w, h)
        pdf.save(`${nombreArchivo}.pdf`)
      } else {
        const pdfWidth = 80
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight + 10] })
        pdf.addImage(imgData, 'PNG', 0, 5, pdfWidth, pdfHeight)
        pdf.save(`${nombreArchivo}.pdf`)
      }
    }
  } finally {
    document.body.removeChild(elemento)
  }
}

export async function imprimirTicketFactura(
  opts: TicketFacturaOptions,
  tamano: TamanoTicket = 'ticket'
): Promise<void> {
  const elemento = crearElemento(opts, tamano)
  elemento.style.position = 'relative'
  elemento.style.left = '0'

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresión. Verifique que los popups estén permitidos.')
  }

  const pageSize = tamano === 'carta'
    ? '@page { margin: 10mm; size: letter; }'
    : '@page { margin: 5mm; size: 80mm auto; }'

  printWindow.document.write(`<!DOCTYPE html><html><head>
    <title>Factura ${opts.factura.numero}</title>
    <style>
      @media print { body { margin: 0; } ${pageSize} }
      body { margin: 0; padding: 0; display: flex; justify-content: center; }
    </style>
  </head><body></body></html>`)

  printWindow.document.body.appendChild(elemento)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
  }
  setTimeout(() => {
    try { printWindow.print(); printWindow.close() } catch {}
  }, 1000)
}
