import { query, querySingle } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

export class InventarioService {
  async listarProductos(filtros: any = {}): Promise<any[]> {
    let sql = `SELECT p.*, c.nombre as categoria_nombre, c.modulo as categoria_modulo,
               prov.nombre as proveedor_nombre
               FROM productos p
               JOIN categorias c ON p.categoria_id = c.id
               LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
               WHERE p.activo = 1`;
    const params: any[] = [];

    if (filtros.categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(filtros.categoria_id);
    }

    if (filtros.modulo) {
      sql += ' AND (c.modulo = ? OR c.modulo = \'Todos\')';
      params.push(filtros.modulo);
    }

    if (filtros.search) {
      sql += ' AND (p.nombre LIKE ? OR p.sku LIKE ?)';
      params.push(`%${filtros.search}%`, `%${filtros.search}%`);
    }

    if (filtros.stock_bajo) {
      sql += ' AND p.stock_actual <= p.stock_minimo';
    }

    sql += ' ORDER BY c.nombre, p.nombre';
    return query(sql, params);
  }

  async obtenerProducto(id: number): Promise<any> {
    const producto = await querySingle(
      `SELECT p.*, c.nombre as categoria_nombre, c.modulo as categoria_modulo,
              prov.nombre as proveedor_nombre
       FROM productos p
       JOIN categorias c ON p.categoria_id = c.id
       LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
       WHERE p.id = ?`,
      [id]
    );

    if (!producto) throw new NotFoundError('Producto');
    return producto;
  }

  async crearProducto(data: any): Promise<any> {
    const result = await query(
      `INSERT INTO productos (categoria_id, proveedor_id, nombre, descripcion, sku, unidad,
        stock_actual, stock_minimo, precio_compra, precio_venta, imagen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.categoria_id, data.proveedor_id || null, data.nombre, data.descripcion || null,
       data.sku || null, data.unidad || 'Unidad', data.stock_actual || 0, data.stock_minimo || 5,
       data.precio_compra || 0, data.precio_venta || 0, data.imagen || null]
    );

    if (data.stock_actual > 0) {
      await query(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, created_by)
         VALUES (?, 'Entrada', ?, 0, ?, ?)`,
        [(result as any).insertId, data.stock_actual, data.stock_actual, data.created_by || null]
      );
    }

    return this.obtenerProducto((result as any).insertId);
  }

  async actualizarProducto(id: number, data: any): Promise<any> {
    const producto = await querySingle('SELECT id FROM productos WHERE id = ?', [id]);
    if (!producto) throw new NotFoundError('Producto');

    await query(
      `UPDATE productos SET categoria_id = ?, proveedor_id = ?, nombre = ?, descripcion = ?,
       sku = ?, unidad = ?, stock_actual = ?, stock_minimo = ?, precio_compra = ?,
       precio_venta = ?, imagen = ? WHERE id = ?`,
      [data.categoria_id, data.proveedor_id || null, data.nombre, data.descripcion || null,
       data.sku || null, data.unidad, data.stock_actual, data.stock_minimo,
       data.precio_compra, data.precio_venta, data.imagen || null, id]
    );

    return this.obtenerProducto(id);
  }

  async ajustarStock(id: number, cantidad: number, tipo: string, observacion: string, userId: number): Promise<any> {
    const producto = await querySingle('SELECT * FROM productos WHERE id = ?', [id]);
    if (!producto) throw new NotFoundError('Producto');

    const stockAnterior = parseFloat(producto.stock_actual);
    let stockNuevo: number;

    if (tipo === 'Salida' || tipo === 'Venta') {
      stockNuevo = stockAnterior - Math.abs(cantidad);
      if (stockNuevo < 0) {
        throw new ValidationError('Stock insuficiente');
      }
    } else {
      stockNuevo = stockAnterior + Math.abs(cantidad);
    }

    await query('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, id]);
    await query(
      `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, observacion, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, tipo, Math.abs(cantidad), stockAnterior, stockNuevo, observacion, userId]
    );

    if (stockNuevo <= producto.stock_minimo) {
      await query(
        `INSERT INTO alertas (tipo, titulo, mensaje, usuario_id)
         VALUES ('Stock', 'Stock bajo: ${producto.nombre.replace(/'/g, "''")}',
         'El producto ${producto.nombre.replace(/'/g, "''")} tiene solo ${stockNuevo} unidades en stock (mínimo: ${producto.stock_minimo})',
         ?)`,
        [userId]
      );
    }

    return this.obtenerProducto(id);
  }

  async listarMovimientos(productoId?: number): Promise<any[]> {
    let sql = `SELECT m.*, p.nombre as producto_nombre, u.nombre as usuario_nombre
               FROM movimientos_inventario m
               JOIN productos p ON m.producto_id = p.id
               JOIN usuarios u ON m.created_by = u.id`;
    const params: any[] = [];

    if (productoId) {
      sql += ' WHERE m.producto_id = ?';
      params.push(productoId);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT 200';
    return query(sql, params);
  }

  async listarCategorias(): Promise<any[]> {
    return query('SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre');
  }

  async listarProveedores(): Promise<any[]> {
    return query('SELECT * FROM proveedores WHERE activo = 1 ORDER BY nombre');
  }

  async productosStockBajo(): Promise<any[]> {
    return query(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM productos p
       JOIN categorias c ON p.categoria_id = c.id
       WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
       ORDER BY (p.stock_actual / p.stock_minimo) ASC`
    );
  }
}

export const inventarioService = new InventarioService();
