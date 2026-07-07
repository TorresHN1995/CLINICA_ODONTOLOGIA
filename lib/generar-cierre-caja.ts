// Impresión del Cierre de Caja (arqueo diario). Genera un documento tamaño carta
// y lo manda a la ventana de impresión del navegador. Mismo enfoque que el ticket
// de factura (lib/generar-ticket-factura.ts).

interface DatosEmpresa {
  nombre: string
  rtn?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  ciudad?: string | null
}

export interface CierreCajaPrintOptions {
  empresa: DatosEmpresa
  fecha: string // 'yyyy-MM-dd' del día del cierre
  moneda?: string
  cerradoPor?: string | null
  registrado: boolean // true si ya está guardado; false si es vista previa
  totalIngresos: number
  totalEfectivo: number
  totalEgresos: number
  egresosEfectivo: number
  desglosePorMetodo: Record<string, number>
  fondoInicial: number
  efectivoEsperado: number
  efectivoContado: number
  diferencia: number
  observaciones?: string | null
}

const ETIQUETA_METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_CREDITO: 'Tarjeta Crédito',
  TARJETA_DEBITO: 'Tarjeta Débito',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  OTRO: 'Otro',
}

// 'yyyy-MM-dd' -> 'dd/MM/yyyy' sin construir Date (evita cualquier desfase de zona).
function fechaLarga(str: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str)
  if (!m) return str
  return `${m[3]}/${m[2]}/${m[1]}`
}

function crearCierre(opts: CierreCajaPrintOptions): HTMLDivElement {
  const {
    empresa, fecha, moneda = 'L.', cerradoPor, registrado,
    totalIngresos, totalEfectivo, totalEgresos, egresosEfectivo,
    desglosePorMetodo, fondoInicial, efectivoEsperado, efectivoContado,
    diferencia, observaciones,
  } = opts

  const m = (n: number) => `${moneda} ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const estadoDif = diferencia === 0 ? 'Cuadra exacto' : diferencia > 0 ? 'Sobrante' : 'Faltante'
  const colorDif = diferencia === 0 ? '#166534' : '#dc2626'

  const c = document.createElement('div')
  c.style.cssText = 'width:720px;padding:24px 28px;background:white;font-family:"Segoe UI",Arial,sans-serif;color:#1e293b;line-height:1.3;position:absolute;left:-9999px;top:0;box-sizing:border-box;'

  const filas = Object.entries(desglosePorMetodo)
    .map(([metodo, monto]) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:5px 8px;font-size:12px;color:#334155;">${ETIQUETA_METODO[metodo] || metodo}</td>
        <td style="padding:5px 8px;text-align:right;font-size:12px;font-weight:600;">${m(Number(monto))}</td>
      </tr>`)
    .join('')

  const tarjeta = (label: string, val: number, color: string) => `
    <div style="border:1px solid #e2e8f0;border-left:4px solid ${color};border-radius:6px;padding:8px 10px;">
      <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">${label}</div>
      <div style="font-size:16px;font-weight:800;color:#0f172a;margin-top:2px;">${m(val)}</div>
    </div>`

  const now = new Date()

  c.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e40af;padding-bottom:10px;margin-bottom:14px;">
      <div>
        <h1 style="margin:0;font-size:19px;font-weight:800;color:#0f172a;">${empresa.nombre}</h1>
        ${empresa.rtn ? `<div style="font-size:11px;color:#475569;margin-top:2px;">RTN: <strong>${empresa.rtn}</strong></div>` : ''}
        ${empresa.direccion ? `<div style="font-size:10px;color:#64748b;">${empresa.direccion}${empresa.ciudad ? `, ${empresa.ciudad}` : ''}</div>` : ''}
        <div style="font-size:10px;color:#64748b;">${empresa.telefono ? `Tel: ${empresa.telefono}` : ''}${empresa.telefono && empresa.email ? ' | ' : ''}${empresa.email || ''}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:17px;font-weight:800;color:#1e40af;letter-spacing:1px;">CIERRE DE CAJA</div>
        <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">${fechaLarga(fecha)}</div>
        <div style="font-size:10px;color:${registrado ? '#166534' : '#b45309'};margin-top:2px;font-weight:600;">${registrado ? 'REGISTRADO' : 'VISTA PREVIA (no registrado)'}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      ${tarjeta('Ingresos del día', totalIngresos, '#10b981')}
      ${tarjeta('Cobros en efectivo', totalEfectivo, '#3b82f6')}
      ${tarjeta('Egresos del día', totalEgresos, '#ef4444')}
      ${tarjeta('Egresos en efectivo', egresosEfectivo, '#a855f7')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div>
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">Cobros por método de pago</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
          <tbody>
            ${filas}
            <tr style="background:#f8fafc;">
              <td style="padding:6px 8px;font-size:12px;font-weight:800;">Total cobrado</td>
              <td style="padding:6px 8px;text-align:right;font-size:12px;font-weight:800;">${m(totalIngresos)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">Cuadre de efectivo</div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;padding:3px 0;"><span style="color:#64748b;">Fondo inicial</span><span>${m(fondoInicial)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;"><span style="color:#64748b;">+ Cobros en efectivo</span><span>${m(totalEfectivo)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;"><span style="color:#64748b;">− Egresos en efectivo</span><span>${m(egresosEfectivo)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #cbd5e1;margin-top:3px;font-weight:800;"><span>Efectivo esperado</span><span>${m(efectivoEsperado)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;"><span style="color:#64748b;">Efectivo contado</span><span>${m(efectivoContado)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 10px;margin-top:6px;border-radius:6px;background:${diferencia === 0 ? '#dcfce7' : '#fef2f2'};font-weight:800;color:${colorDif};"><span>${estadoDif}</span><span>${m(diferencia)}</span></div>
        </div>
      </div>
    </div>

    ${observaciones ? `<div style="border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;margin-bottom:14px;font-size:11px;"><span style="color:#64748b;font-weight:700;">Observaciones: </span>${observaciones}</div>` : ''}

    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;">
      <div style="font-size:10px;color:#94a3b8;">
        Impreso: ${now.toLocaleDateString('es-HN')} ${now.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div style="text-align:center;">
        <div style="border-top:1px solid #94a3b8;width:220px;margin:0 auto;padding-top:4px;font-size:11px;color:#475569;">${cerradoPor || 'Responsable de caja'}</div>
      </div>
    </div>
  `
  return c
}

export function imprimirCierreCaja(opts: CierreCajaPrintOptions): void {
  const elemento = crearCierre(opts)
  elemento.style.position = 'relative'
  elemento.style.left = '0'

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresión. Verifique que los popups estén permitidos.')
  }

  printWindow.document.write(`<!DOCTYPE html><html><head>
    <title>Cierre de caja ${fechaLarga(opts.fecha)}</title>
    <style>
      @media print { body { margin: 0; } @page { margin: 12mm; size: letter; } }
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
