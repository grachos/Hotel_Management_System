import { query, querySingle } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateUniqueCode } from '../utils/helpers';

export class HuespedesService {
  async listar(filtros: any = {}): Promise<any[]> {
    let sql = `SELECT h.*,
               (SELECT COUNT(*) FROM reservaciones WHERE huesped_id = h.id AND estado = 'CheckIn') as reservaciones_activas
               FROM huespedes h WHERE 1=1`;
    const params: any[] = [];

    if (filtros.search) {
      sql += ' AND (h.nombre LIKE ? OR h.apellidos LIKE ? OR h.numero_documento LIKE ?)';
      params.push(`%${filtros.search}%`, `%${filtros.search}%`, `%${filtros.search}%`);
    }

    sql += ' ORDER BY h.created_at DESC LIMIT 100';
    return query(sql, params);
  }

  async obtenerPorId(id: number): Promise<any> {
    const huesped = await querySingle(
      'SELECT h.* FROM huespedes h WHERE h.id = ?',
      [id]
    );

    if (!huesped) throw new NotFoundError('Huésped');

    const reservaciones = await query(
      `SELECT r.id, r.codigo_unico, r.fecha_entrada, r.fecha_salida, r.estado,
              ha.numero as habitacion, c.nombre as cabaña
       FROM reservaciones r
       LEFT JOIN habitaciones ha ON r.habitacion_id = ha.id
       LEFT JOIN cabañas c ON r.cabaña_id = c.id
       WHERE r.huesped_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    return { ...huesped, reservaciones };
  }

  async crear(data: any): Promise<any> {
    const result = await query(
      `INSERT INTO huespedes (nombre, apellidos, email, telefono, tipo_documento, numero_documento, direccion, ciudad, pais, fecha_nacimiento, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.nombre, data.apellidos, data.email || null, data.telefono || null,
       data.tipo_documento || 'DNI', data.numero_documento || null,
       data.direccion || null, data.ciudad || null, data.pais || null, data.fecha_nacimiento || null, data.notas || null]
    );

    return this.obtenerPorId((result as any).insertId);
  }

  async actualizar(id: number, data: any): Promise<any> {
    const huesped = await querySingle('SELECT id FROM huespedes WHERE id = ?', [id]);
    if (!huesped) throw new NotFoundError('Huésped');

    await query(
      `UPDATE huespedes SET nombre = ?, apellidos = ?, email = ?, telefono = ?,
       tipo_documento = ?, numero_documento = ?, direccion = ?, ciudad = ?,
       pais = ?, fecha_nacimiento = ?, notas = ? WHERE id = ?`,
      [data.nombre, data.apellidos, data.email || null, data.telefono || null,
       data.tipo_documento || 'DNI', data.numero_documento || null,
       data.direccion || null, data.ciudad || null, data.pais || null, data.fecha_nacimiento || null, data.notas || null, id]
    );

    return this.obtenerPorId(id);
  }

  async eliminar(id: number): Promise<void> {
    const huesped = await querySingle('SELECT id FROM huespedes WHERE id = ?', [id]);
    if (!huesped) throw new NotFoundError('Huésped');

    await query('DELETE FROM huespedes WHERE id = ?', [id]);
  }
}

export const huespedesService = new HuespedesService();
