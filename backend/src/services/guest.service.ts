import { query, querySingle } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

export class GuestService {
  async obtenerPerfil(huespedId: number, reservacionId: number): Promise<any> {
    const huesped = await querySingle('SELECT * FROM huespedes WHERE id = ?', [huespedId]);
    if (!huesped) throw new NotFoundError('Huésped');

    const reservacion = await querySingle(
      `SELECT r.*, ha.numero as habitacion_numero, ha.tipo as habitacion_tipo,
              ha.amenities as habitacion_amenities,
              c.nombre as cabaña_nombre, c.amenities as cabaña_amenities
       FROM reservaciones r
       LEFT JOIN habitaciones ha ON r.habitacion_id = ha.id
       LEFT JOIN cabañas c ON r.cabaña_id = c.id
       WHERE r.id = ?`,
      [reservacionId]
    );

    const acompanantes = await query(
      'SELECT id, nombre, apellidos FROM reservacion_acompanantes WHERE reservacion_id = ?',
      [reservacionId]
    );

    return { huesped, reservacion, acompanantes };
  }

  async listarProductos(modulo?: string): Promise<any[]> {
    let sql = `SELECT p.id, p.nombre, p.descripcion, p.precio_venta, p.stock_actual,
                      c.nombre as categoria_nombre, c.modulo as modulo
               FROM productos p
               JOIN categorias c ON p.categoria_id = c.id
               WHERE p.activo = 1 AND p.stock_actual > 0`;
    const params: any[] = [];

    if (modulo) {
      sql += ' AND c.modulo = ?';
      params.push(modulo);
    }

    sql += ' ORDER BY c.nombre, p.nombre';
    return query(sql, params);
  }

  async listarPedidos(reservacionId: number): Promise<any[]> {
    const pedidos = await query(
      `SELECT p.*, u.nombre as atendido_por_nombre
       FROM pedidos p
       LEFT JOIN usuarios u ON p.atendido_por = u.id
       WHERE p.reservacion_id = ?
       ORDER BY p.created_at DESC`,
      [reservacionId]
    );

    for (const pedido of pedidos as any[]) {
      pedido.detalles = await query(
        `SELECT d.*, pr.nombre as producto_nombre, pr.unidad
         FROM detalle_pedidos d
         JOIN productos pr ON d.producto_id = pr.id
         WHERE d.pedido_id = ?`,
        [pedido.id]
      );
    }

    return pedidos;
  }

  async crearPedido(huespedId: number, reservacionId: number, data: any): Promise<any> {
    const reservacion = await querySingle(
      'SELECT id, incluye_comidas FROM reservaciones WHERE id = ? AND huesped_id = ? AND estado = ?',
      [reservacionId, huespedId, 'CheckIn']
    );
    if (!reservacion) throw new ValidationError('Reservación no activa');
    const incluyeComidas = reservacion.incluye_comidas === 1;

    if (!data.productos || !data.productos.length) {
      throw new ValidationError('Debe incluir al menos un producto');
    }

    const configRow = await querySingle("SELECT valor FROM configuracion WHERE clave = 'delivery.recargo'");
    const recargoConfig = parseFloat(configRow?.valor || '0');
    const isDelivery = data.tipo_entrega === 'Habitación' || data.tipo_entrega === 'Cabaña';
    const recargoDelivery = isDelivery ? recargoConfig : 0;

    const result = await query(
      `INSERT INTO pedidos (reservacion_id, huesped_id, tipo_entrega, recargo_delivery, modulo, estado, subtotal, impuesto, total, notas)
       VALUES (?, ?, ?, ?, ?, 'Pendiente', 0, 0, 0, ?)`,
      [reservacionId, huespedId, data.tipo_entrega || 'Local', recargoDelivery, data.modulo, data.notas || null]
    );

    const pedidoId = (result as any).insertId;

    for (const item of data.productos) {
      const producto = await querySingle('SELECT * FROM productos WHERE id = ? AND activo = 1', [item.producto_id]);
      if (!producto) throw new NotFoundError(`Producto ${item.producto_id}`);
      if (parseFloat(producto.stock_actual) < item.cantidad) {
        throw new ValidationError(`Stock insuficiente para ${producto.nombre}`);
      }

      const precio = parseFloat(item.precio_unitario || producto.precio_venta);
      const subtotal = item.cantidad * precio;
      const precioConsumo = incluyeComidas ? 0 : precio;
      const subtotalConsumo = item.cantidad * precioConsumo;

      await query(
        `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, item.producto_id, item.cantidad, precio, subtotal]
      );

      const stockAnterior = parseFloat(producto.stock_actual);
      const stockNuevo = stockAnterior - item.cantidad;
      await query('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, item.producto_id]);
      await query(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_id, referencia_tipo, created_by)
         VALUES (?, 'Venta', ?, ?, ?, ?, 'Pedido', ?)`,
        [item.producto_id, item.cantidad, stockAnterior, stockNuevo, pedidoId, 1]
      );

      await query(
        `INSERT INTO consumos (reservacion_id, huesped_id, producto_id, pedido_id, cantidad, precio_unitario, subtotal, modulo, tipo_entrega, registrado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reservacionId, huespedId, item.producto_id, pedidoId, item.cantidad, precioConsumo, subtotalConsumo, data.modulo, data.tipo_entrega || 'Habitación', 1]
      );
    }

    const totals = await querySingle(
      'SELECT SUM(subtotal) as subtotal_total FROM detalle_pedidos WHERE pedido_id = ?',
      [pedidoId]
    );

    const subtotalTotal = parseFloat(totals?.subtotal_total || 0);
    const impuesto = Math.round(subtotalTotal * 0.18 * 100) / 100;
    const total = subtotalTotal + impuesto + recargoDelivery;

    await query('UPDATE pedidos SET subtotal = ?, impuesto = ?, total = ?, recargo_delivery = ? WHERE id = ?', [subtotalTotal, impuesto, total, recargoDelivery, pedidoId]);

    return querySingle(
      `SELECT p.*, u.nombre as atendido_por_nombre
       FROM pedidos p
       LEFT JOIN usuarios u ON p.atendido_por = u.id
       WHERE p.id = ?`,
      [pedidoId]
    );
  }

  async listarConsumos(reservacionId: number): Promise<any[]> {
    return query(
      `SELECT c.*, pr.nombre as producto_nombre, NULL as es_delivery
       FROM consumos c
       JOIN productos pr ON c.producto_id = pr.id
       WHERE c.reservacion_id = ?
       UNION ALL
       SELECT NULL as id, NULL as reservacion_id, NULL as huesped_id, NULL as producto_id, p.id as pedido_id, 1 as cantidad, p.recargo_delivery as precio_unitario, p.recargo_delivery as subtotal, p.modulo, p.tipo_entrega, NULL as registrado_por, p.created_at, 'Cargo por Delivery' as producto_nombre, 1 as es_delivery
       FROM pedidos p
       WHERE p.reservacion_id = ? AND p.estado != 'Cancelado' AND p.recargo_delivery > 0
       ORDER BY created_at DESC`,
      [reservacionId, reservacionId]
    );
  }

  async configPublica(): Promise<Record<string, string>> {
    const rows = await query(
      "SELECT clave, valor FROM configuracion WHERE clave IN ('delivery.recargo', 'hotel.moneda_codigo')"
    );
    const result: Record<string, string> = {};
    for (const row of rows as any[]) {
      result[row.clave] = row.valor;
    }
    return result;
  }

  async totalConsumos(reservacionId: number): Promise<number> {
    const [result, deliveryResult] = await Promise.all([
      querySingle('SELECT COALESCE(SUM(subtotal), 0) as total FROM consumos WHERE reservacion_id = ?', [reservacionId]),
      querySingle('SELECT COALESCE(SUM(recargo_delivery), 0) as total FROM pedidos WHERE reservacion_id = ? AND estado != \'Cancelado\'', [reservacionId]),
    ]);
    return parseFloat(result?.total || 0) + parseFloat(deliveryResult?.total || 0);
  }
}

export const guestService = new GuestService();
