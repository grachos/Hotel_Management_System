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
      'SELECT id FROM reservaciones WHERE id = ? AND huesped_id = ? AND estado = ?',
      [reservacionId, huespedId, 'CheckIn']
    );
    if (!reservacion) throw new ValidationError('Reservación no activa');

    if (!data.productos || !data.productos.length) {
      throw new ValidationError('Debe incluir al menos un producto');
    }

    const result = await query(
      `INSERT INTO pedidos (reservacion_id, huesped_id, tipo_entrega, modulo, estado, subtotal, impuesto, total, notas)
       VALUES (?, ?, ?, 'Pendiente', 0, 0, ?, ?)`,
      [reservacionId, huespedId, data.tipo_entrega || 'Habitación', data.modulo, data.notas || null]
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
        [reservacionId, huespedId, item.producto_id, pedidoId, item.cantidad, precio, subtotal, data.modulo, data.tipo_entrega || 'Habitación', 1]
      );
    }

    const totals = await querySingle(
      'SELECT SUM(subtotal) as subtotal_total FROM detalle_pedidos WHERE pedido_id = ?',
      [pedidoId]
    );

    const subtotalTotal = parseFloat(totals?.subtotal_total || 0);
    const impuesto = Math.round(subtotalTotal * 0.18 * 100) / 100;
    const total = subtotalTotal + impuesto;

    await query('UPDATE pedidos SET subtotal = ?, impuesto = ?, total = ? WHERE id = ?', [subtotalTotal, impuesto, total, pedidoId]);

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
      `SELECT c.*, pr.nombre as producto_nombre
       FROM consumos c
       JOIN productos pr ON c.producto_id = pr.id
       WHERE c.reservacion_id = ?
       ORDER BY c.created_at DESC`,
      [reservacionId]
    );
  }

  async totalConsumos(reservacionId: number): Promise<number> {
    const result = await querySingle(
      'SELECT COALESCE(SUM(subtotal), 0) as total FROM consumos WHERE reservacion_id = ?',
      [reservacionId]
    );
    return parseFloat(result?.total || 0);
  }
}

export const guestService = new GuestService();
