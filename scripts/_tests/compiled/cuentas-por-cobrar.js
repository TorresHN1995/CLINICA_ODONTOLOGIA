"use strict";
/**
 * Utilidades para Cuentas por Cobrar (cobranza / antigüedad de saldos).
 *
 * El saldo de una factura = total - (suma de pagos). Solo se consideran las
 * facturas con estado PENDIENTE o PAGADA_PARCIAL (las ANULADAS y PAGADAS no
 * generan cuenta por cobrar). Como las facturas no tienen fecha de vencimiento,
 * la antigüedad se mide desde la fecha de emisión.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UMBRAL_MORA_DEFAULT = exports.ETIQUETAS_BUCKET = void 0;
exports.diasTranscurridos = diasTranscurridos;
exports.clasificarBucket = clasificarBucket;
exports.construirCuenta = construirCuenta;
exports.agruparPorBucket = agruparPorBucket;
exports.ETIQUETAS_BUCKET = {
    corriente: '0-30 días',
    dias31_60: '31-60 días',
    dias61_90: '61-90 días',
    mas90: '+90 días',
};
// Umbral por defecto (en días) a partir del cual una cuenta se considera en mora.
exports.UMBRAL_MORA_DEFAULT = 30;
// Número de días enteros transcurridos entre dos fechas (>= 0).
function diasTranscurridos(desde, hasta = new Date()) {
    const ms = hasta.getTime() - desde.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
function clasificarBucket(dias) {
    if (dias <= 30)
        return 'corriente';
    if (dias <= 60)
        return 'dias31_60';
    if (dias <= 90)
        return 'dias61_90';
    return 'mas90';
}
/**
 * Construye una cuenta por cobrar a partir de una factura, o null si no aplica
 * (anulada, pagada por completo, o saldo no positivo).
 */
function construirCuenta(factura, umbralMora = exports.UMBRAL_MORA_DEFAULT, ahora = new Date()) {
    if (factura.estado === 'ANULADA' || factura.estado === 'PAGADA')
        return null;
    const total = Number(factura.total);
    const pagado = factura.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    const saldo = Math.round((total - pagado) * 100) / 100;
    if (saldo <= 0)
        return null;
    const diasVencido = diasTranscurridos(new Date(factura.fecha), ahora);
    return {
        facturaId: factura.id,
        numero: factura.numero,
        fecha: new Date(factura.fecha).toISOString(),
        tipoDocumento: factura.tipoDocumento,
        pacienteId: factura.paciente.id,
        pacienteNombre: `${factura.paciente.nombre} ${factura.paciente.apellido}`,
        identificacion: factura.paciente.identificacion,
        total,
        pagado,
        saldo,
        diasVencido,
        bucket: clasificarBucket(diasVencido),
        enMora: diasVencido > umbralMora,
    };
}
/** Suma los saldos por bucket de antigüedad. */
function agruparPorBucket(cuentas) {
    const acc = {
        corriente: 0,
        dias31_60: 0,
        dias61_90: 0,
        mas90: 0,
    };
    for (const c of cuentas) {
        acc[c.bucket] = Math.round((acc[c.bucket] + c.saldo) * 100) / 100;
    }
    return acc;
}
