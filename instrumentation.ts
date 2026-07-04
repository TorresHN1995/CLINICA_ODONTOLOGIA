// Se ejecuta una sola vez al arrancar el servidor (Next.js instrumentation hook).
// Fija la zona horaria del proceso a Honduras (America/Tegucigalpa) para que todas
// las fechas del lado servidor (facturas, cierre de caja, reportes, "hoy", cálculos
// de día) se calculen y muestren en hora local y no en UTC.
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.env.TZ = process.env.TZ || 'America/Tegucigalpa'
  }
}
