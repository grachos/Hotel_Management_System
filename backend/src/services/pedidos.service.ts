import { query, querySingle } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

export class PedidosService {
  async listar(filtros: any = {}): Promise<any[]> {
    let sql = `SELECT p.*,
               CONCAT(h.nombre, ' ', h.apellidos) as huesped_nombre,
               u.nombre as atendido_por_nombre,
               ha.numero as habitacion_numero
               FROM pedidos p
               LEFT JOIN huespedes h ON p.huesped_id = h.id
               LEFT JOIN usuarios u ON p.atendido_por = u.id
               LEFT JOIN reservaciones r ON p.reservacion_id = r.id
               LEFT JOIN habitaciones ha ON r.habitacion_id = ha.id
               WHERE 1=1`;
    const params: any[] = [];

    if (filtros.estado) {
      sql += ' AND p.estado = ?';
      params.push(filtros.estado);
    }

    if (filtros.modulo) {
      sql += ' AND p.modulo = ?';
      params.push(filtros.modulo);
    }

    if (filtros.reservacion_id) {
      sql += ' AND p.reservacion_id = ?';
      params.push(filtros.reservacion_id);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT 100';
    return query(sql, params);
  }

  async obtenerPorId(id: number): Promise<any> {
    const pedido = await querySingle(
      `SELECT p.*,
              CONCAT(h.nombre, ' ', h.apellidos) as huesped_nombre,
              u.nombre as atendido_por_nombre,
              r.codigo_unico as reservacion_codigo
       FROM pedidos p
       LEFT JOIN huespedes h ON p.huesped_id = h.id
       LEFT JOIN usuarios u ON p.atendido_por = u.id
       LEFT JOIN reservaciones r ON p.reservacion_id = r.id
       WHERE p.id = ?`,
      [id]
    );

    if (!pedido) throw new NotFoundError('Pedido');

    const detalles = await query(
      `SELECT d.*, p.nombre as producto_nombre, p.unidad
       FROM detalle_pedidos d
       JOIN productos p ON d.producto_id = p.id
       WHERE d.pedido_id = ?`,
      [id]
    );

    return { ...pedido, detalles };
  }

  async crear(data: any, userId: number): Promise<any> {
    let reservacionId = data.reservacion_id || null;
    let huespedId = data.huesped_id || null;

    // Read delivery recargo from config (overrides frontend value)
    const configRow = await querySingle("SELECT valor FROM configuracion WHERE clave = 'delivery.recargo'");
    const recargoConfig = parseFloat(configRow?.valor || '0');
    const isDelivery = data.tipo_entrega === 'Habitación' || data.tipo_entrega === 'Cabaña';
    const recargoDelivery = isDelivery ? recargoConfig : 0;

    // If delivery to Habitación or Cabaña, resolve the occupied room/cabin to find the guest
    if (!reservacionId && isDelivery && data.alojamiento_id) {
      const columna = data.tipo_entrega === 'Habitación' ? 'habitacion_id' : 'cabaña_id';
      const ocupada = data.tipo_entrega === 'Habitación' ? 'Ocupada' : 'Ocupada';
      const reservacion = await querySingle(
        `SELECT r.id, r.huesped_id, r.incluye_comidas
         FROM reservaciones r
         JOIN ${data.tipo_entrega === 'Habitación' ? 'habitaciones' : 'cabañas'} a ON r.${columna} = a.id
         WHERE a.id = ? AND r.estado = 'CheckIn'`,
        [data.alojamiento_id]
      );
      if (!reservacion) throw new ValidationError('No hay un huésped activo en ese alojamiento');
      reservacionId = reservacion.id;
      huespedId = reservacion.huesped_id;
      data._incluye_comidas = reservacion.incluye_comidas === 1;
    }

    const result = await query(
      `INSERT INTO pedidos (reservacion_id, huesped_id, mesa, tipo_entrega, recargo_delivery, modulo, estado, subtotal, impuesto, total, notas, atendido_por)
       VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?, ?, ?)`,
      [reservacionId, huespedId, data.mesa || null,
       data.tipo_entrega || 'Local', recargoDelivery, data.modulo,
       data.subtotal || 0, data.impuesto || 0, data.total || 0,
       data.notas || null, userId]
    );

    const pedidoId = (result as any).insertId;

    if (data.productos && data.productos.length > 0) {
      for (const item of data.productos) {
        const producto = await querySingle('SELECT * FROM productos WHERE id = ?', [item.producto_id]);
        if (!producto) throw new NotFoundError(`Producto ${item.producto_id}`);
        if (parseFloat(producto.stock_actual) < item.cantidad) {
          throw new ValidationError(`Stock insuficiente para ${producto.nombre}`);
        }

        const precioUnitario = parseFloat(item.precio_unitario || producto.precio_venta);
        const subtotal = item.cantidad * precioUnitario;

        // If the reservation includes meals, charge 0 to the guest (free)
        // but still deduct inventory
        const precioConsumo = data._incluye_comidas ? 0 : precioUnitario;
        const subtotalConsumo = item.cantidad * precioConsumo;

        await query(
          `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [pedidoId, item.producto_id, item.cantidad,
           precioUnitario, subtotal, item.notas || null]
        );

        const stockAnterior = parseFloat(producto.stock_actual);
        const stockNuevo = stockAnterior - item.cantidad;

        await query('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, item.producto_id]);
        await query(
          `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_id, referencia_tipo, created_by)
           VALUES (?, 'Venta', ?, ?, ?, ?, 'Pedido', ?)`,
          [item.producto_id, item.cantidad, stockAnterior, stockNuevo, pedidoId, userId]
        );

        // Register consumption only if linked to a reservation/guest
        if (reservacionId || huespedId) {
          await query(
            `INSERT INTO consumos (reservacion_id, huesped_id, producto_id, pedido_id, cantidad, precio_unitario, subtotal, modulo, tipo_entrega, registrado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [reservacionId, huespedId, item.producto_id, pedidoId,
             item.cantidad, precioConsumo, subtotalConsumo,
             data.modulo, data.tipo_entrega || 'Local', userId]
          );
        }
      }

      const totals = await querySingle(
        `SELECT SUM(subtotal) as subtotal_total FROM detalle_pedidos WHERE pedido_id = ?`,
        [pedidoId]
      );

      const subtotal = parseFloat(totals?.subtotal_total || 0);
      const impuesto = Math.round(subtotal * 0.18 * 100) / 100;
      const total = subtotal + impuesto + recargoDelivery;

      await query(
        'UPDATE pedidos SET subtotal = ?, impuesto = ?, total = ? WHERE id = ?',
        [subtotal, impuesto, total, pedidoId]
      );
    }

    return this.obtenerPorId(pedidoId);
  }

  async actualizarEstado(id: number, estado: string): Promise<any> {
    const validStates = ['Pendiente', 'Preparando', 'Completado', 'Entregado', 'Cancelado', 'Facturado'];
    if (!validStates.includes(estado)) {
      throw new ValidationError('Estado no válido');
    }

    const pedido = await querySingle('SELECT id FROM pedidos WHERE id = ?', [id]);
    if (!pedido) throw new NotFoundError('Pedido');

    await query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);

    if (estado === 'Cancelado') {
      const detalles = await query('SELECT * FROM detalle_pedidos WHERE pedido_id = ?', [id]);
      for (const detalle of detalles as any[]) {
        await query(
          'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
          [detalle.cantidad, detalle.producto_id]
        );
        await query(
          `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_id, referencia_tipo, created_by)
           VALUES (?, 'Devolución', ?, 0, 0, ?, 'Pedido', ?)`,
          [detalle.producto_id, detalle.cantidad, id, 1]
        );
      }
    }

    return this.obtenerPorId(id);
  }

  async obtenerPedidosActivos(modulo?: string): Promise<any[]> {
    let sql = `SELECT p.*,
               CONCAT(h.nombre, ' ', h.apellidos) as huesped_nombre,
               u.nombre as atendido_por_nombre
               FROM pedidos p
               LEFT JOIN huespedes h ON p.huesped_id = h.id
               LEFT JOIN usuarios u ON p.atendido_por = u.id
               WHERE p.estado IN ('Pendiente', 'Preparando')`;
    const params: any[] = [];

    if (modulo) {
      sql += ' AND p.modulo = ?';
      params.push(modulo);
    }

    sql += ' ORDER BY p.created_at ASC';
    return query(sql, params);
  }

  async listarOcupados(): Promise<any> {
    const habitaciones = await query(
      `SELECT a.id as alojamiento_id, a.numero, a.tipo, 'Habitación' as tipo_alojamiento,
              CONCAT(h.nombre, ' ', h.apellidos) as huesped_nombre, h.id as huesped_id,
              r.id as reservacion_id
       FROM habitaciones a
       JOIN reservaciones r ON r.habitacion_id = a.id AND r.estado = 'CheckIn'
       JOIN huespedes h ON r.huesped_id = h.id
       WHERE a.activo = 1 AND a.estado = 'Ocupada'
       ORDER BY a.numero`
    );
    const cabañas = await query(
      `SELECT a.id as alojamiento_id, a.nombre, NULL as tipo, 'Cabaña' as tipo_alojamiento,
              CONCAT(h.nombre, ' ', h.apellidos) as huesped_nombre, h.id as huesped_id,
              r.id as reservacion_id
       FROM cabañas a
       JOIN reservaciones r ON r.cabaña_id = a.id AND r.estado = 'CheckIn'
       JOIN huespedes h ON r.huesped_id = h.id
       WHERE a.activo = 1 AND a.estado = 'Ocupada'
       ORDER BY a.nombre`
    );
    return [...habitaciones, ...cabañas];
  }
}

export const pedidosService = new PedidosService();
