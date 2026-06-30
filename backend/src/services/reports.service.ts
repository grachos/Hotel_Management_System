import { query, querySingle } from '../config/database';

export class ReportsService {
  async kpiSummary() {
    const today = await querySingle(`
      SELECT COALESCE(SUM(total), 0) as ventas_hoy,
             COUNT(*) as pedidos_hoy
      FROM pedidos WHERE DATE(created_at) = CURDATE() AND estado NOT IN ('Cancelado','Facturado')
    `);

    const mes = await querySingle(`
      SELECT COALESCE(SUM(total), 0) as ventas_mes,
             COUNT(*) as pedidos_mes
      FROM pedidos WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE()) AND estado NOT IN ('Cancelado','Facturado')
    `);

    const mesAnterior = await querySingle(`
      SELECT COALESCE(SUM(total), 0) as ventas
      FROM pedidos WHERE MONTH(created_at)=MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(created_at)=YEAR(CURDATE()) AND estado NOT IN ('Cancelado','Facturado')
    `);

    const [habitaciones, cabañas, ocupadas] = await Promise.all([
      querySingle("SELECT COUNT(*) as total FROM habitaciones WHERE activo=1 AND estado!='Mantenimiento'"),
      querySingle("SELECT COUNT(*) as total FROM cabañas WHERE activo=1 AND estado!='Mantenimiento'"),
      querySingle("SELECT COUNT(*) as total FROM (SELECT id FROM habitaciones WHERE estado='Ocupada' UNION ALL SELECT id FROM cabañas WHERE estado='Ocupada') o"),
    ]);

    const totalAlojamientos = (habitaciones?.total || 0) + (cabañas?.total || 0);
    const ocupadasCount = ocupadas?.total || 0;
    const ocupacionPct = totalAlojamientos > 0 ? Math.round((ocupadasCount / totalAlojamientos) * 100) : 0;

    const revpar = totalAlojamientos > 0 ? (parseFloat(mes?.ventas_mes || 0) / totalAlojamientos / 30) : 0;

    const adr = await querySingle(`
      SELECT COALESCE(AVG(precio_noche), 0) as adr
      FROM (
        SELECT ha.precio_noche FROM reservaciones r JOIN habitaciones ha ON r.habitacion_id = ha.id WHERE r.estado IN ('CheckIn','CheckOut')
        UNION ALL
        SELECT c.precio_noche FROM reservaciones r JOIN cabañas c ON r.cabaña_id = c.id WHERE r.estado IN ('CheckIn','CheckOut')
      ) precios
    `);

    const reservas = await querySingle(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN estado='Cancelada' THEN 1 ELSE 0 END) as canceladas,
             AVG(CASE WHEN tipo!='Pasadia' AND estado IN ('CheckIn','CheckOut') THEN DATEDIFF(fecha_salida, fecha_entrada) ELSE NULL END) as estancia_promedio
      FROM reservaciones
    `);

    const ticketPromedio = await querySingle(`
      SELECT AVG(total) as promedio FROM pedidos WHERE estado NOT IN ('Cancelado','Facturado')
    `);

    const satisfaccion = await querySingle(`
      SELECT COALESCE(AVG(rating), 0) as rating_promedio, COUNT(*) as total_opiniones
      FROM opiniones WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())
    `);

    const ventasModulo = await query(`
      SELECT modulo, COUNT(*) as pedidos, COALESCE(SUM(total), 0) as total
      FROM pedidos WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE()) AND estado NOT IN ('Cancelado','Facturado')
      GROUP BY modulo ORDER BY total DESC
    `);

    return {
      ventasHoy: parseFloat(today?.ventas_hoy || 0),
      pedidosHoy: today?.pedidos_hoy || 0,
      ventasMes: parseFloat(mes?.ventas_mes || 0),
      pedidosMes: mes?.pedidos_mes || 0,
      ventasMesAnterior: parseFloat(mesAnterior?.ventas || 0),
      ocupacion: { ocupadas: ocupadasCount, total: totalAlojamientos, porcentaje: ocupacionPct },
      revpar: Math.round(revpar * 100) / 100,
      adr: Math.round(parseFloat(adr?.adr || 0) * 100) / 100,
      tasaCancelacion: reservas?.total > 0 ? Math.round((parseFloat(reservas?.canceladas || 0) / parseFloat(reservas?.total || 0)) * 10000) / 100 : 0,
      estanciaPromedio: Math.round(parseFloat(reservas?.estancia_promedio || 0) * 10) / 10,
      ticketPromedio: Math.round(parseFloat(ticketPromedio?.promedio || 0) * 100) / 100,
      satisfaccion: { rating: Math.round(parseFloat(satisfaccion?.rating_promedio || 0) * 10) / 10, total: satisfaccion?.total_opiniones || 0 },
      ventasModulo,
      fecha: new Date().toISOString(),
    };
  }

  async salesTrend(dias: number = 30) {
    const actual = await query(`
      SELECT DATE(created_at) as fecha, COALESCE(SUM(total), 0) as total, COUNT(*) as pedidos
      FROM pedidos WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND estado NOT IN ('Cancelado','Facturado')
      GROUP BY DATE(created_at) ORDER BY fecha ASC
    `, [dias]);

    const anterior = await query(`
      SELECT DATE(created_at) as fecha, COALESCE(SUM(total), 0) as total
      FROM pedidos WHERE created_at >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL ? DAY), INTERVAL ? DAY) AND created_at < DATE_SUB(CURDATE(), INTERVAL ? DAY) AND estado NOT IN ('Cancelado','Facturado')
      GROUP BY DATE(created_at) ORDER BY fecha ASC
    `, [dias, dias, dias]);

    return { actual, anterior };
  }

  async topProductos(limite: number = 10) {
    return query(`
      SELECT p.id, p.nombre, p.unidad, p.precio_venta,
             COALESCE(SUM(dp.cantidad), 0) as total_vendido,
             COALESCE(SUM(dp.subtotal), 0) as total_ingresos
      FROM detalle_pedidos dp
      JOIN productos p ON dp.producto_id = p.id
      JOIN pedidos pe ON dp.pedido_id = pe.id
      WHERE MONTH(pe.created_at) = MONTH(CURDATE()) AND YEAR(pe.created_at) = YEAR(CURDATE()) AND pe.estado NOT IN ('Cancelado','Facturado')
      GROUP BY p.id, p.nombre, p.unidad, p.precio_venta
      ORDER BY total_vendido DESC LIMIT ?
    `, [limite]);
  }

  async guestDemographics() {
    const origen = await query(`
      SELECT COALESCE(ciudad, 'Sin registro') as ciudad, COUNT(*) as total
      FROM huespedes GROUP BY ciudad ORDER BY total DESC LIMIT 10
    `);

    const tendencia = await query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as mes, COUNT(*) as nuevos
      FROM huespedes WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY mes ASC
    `);

    return { origen, tendencia };
  }
}

export const reportsService = new ReportsService();
