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
    const result = await query(
      `INSERT INTO pedidos (reservacion_id, huesped_id, mesa, tipo_entrega, modulo, estado, subtotal, impuesto, total, notas, atendido_por)
       VALUES (?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?, ?, ?)`,
      [data.reservacion_id || null, data.huesped_id || null, data.mesa || null,
       data.tipo_entrega || 'Local', data.modulo,
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

        const subtotal = item.cantidad * parseFloat(item.precio_unitario || producto.precio_venta);
        await query(
          `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [pedidoId, item.producto_id, item.cantidad,
           item.precio_unitario || producto.precio_venta, subtotal, item.notas || null]
        );

        const stockAnterior = parseFloat(producto.stock_actual);
        const stockNuevo = stockAnterior - item.cantidad;

        await query('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, item.producto_id]);
        await query(
          `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_id, referencia_tipo, created_by)
           VALUES (?, 'Venta', ?, ?, ?, ?, 'Pedido', ?)`,
          [item.producto_id, item.cantidad, stockAnterior, stockNuevo, pedidoId, userId]
        );

        if (data.huesped_id || data.reservacion_id) {
          await query(
            `INSERT INTO consumos (reservacion_id, huesped_id, producto_id, pedido_id, cantidad, precio_unitario, subtotal, modulo, tipo_entrega, registrado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.reservacion_id || null, data.huesped_id || null, item.producto_id, pedidoId,
             item.cantidad, item.precio_unitario || producto.precio_venta, subtotal,
             data.modulo, data.tipo_entrega || 'Local', userId]
          );
        }
      }

      const totals = await querySingle(
        `SELECT SUM(subtotal) as subtotal_total FROM detalle_pedidos WHERE pedido_id = ?`,
        [pedidoId]
      );

      const subtotal = parseFloat(totals?.subtotal_total || 0);
      const impuesto = subtotal * 0.18;
      const total = subtotal + impuesto;

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
}

export const pedidosService = new PedidosService();
