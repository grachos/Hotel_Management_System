import { query, querySingle } from '../config/database';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';

export class OpinionesService {
  async listar(filtros: any = {}): Promise<any[]> {
    let sql = `SELECT o.*, CONCAT(h.nombre, ' ', h.apellidos) as huesped_nombre
               FROM opiniones o
               JOIN huespedes h ON o.huesped_id = h.id
               WHERE 1=1`;
    const params: any[] = [];

    if (filtros.rating) {
      sql += ' AND o.rating = ?';
      params.push(Number(filtros.rating));
    }

    sql += ' ORDER BY o.created_at DESC LIMIT 100';
    return query(sql, params);
  }

  async obtenerPorId(id: number): Promise<any> {
    const opinion = await querySingle(
      `SELECT o.*, CONCAT(h.nombre, ' ', h.apellidos) as huesped_nombre,
              r.codigo_unico as reservacion_codigo
       FROM opiniones o
       JOIN huespedes h ON o.huesped_id = h.id
       JOIN reservaciones r ON o.reservacion_id = r.id
       WHERE o.id = ?`,
      [id]
    );
    if (!opinion) throw new NotFoundError('Opinión');
    return opinion;
  }

  async crear(data: any): Promise<any> {
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new ValidationError('La calificación debe estar entre 1 y 5');
    }

    const reservacion = await querySingle('SELECT id, estado FROM reservaciones WHERE id = ?', [data.reservacion_id]);
    if (!reservacion) throw new NotFoundError('Reservación');
    if (reservacion.estado !== 'CheckIn' && reservacion.estado !== 'CheckOut') {
      throw new ValidationError('Solo se pueden dejar opiniones en reservaciones activas o finalizadas');
    }

    const existente = await querySingle('SELECT id FROM opiniones WHERE reservacion_id = ?', [data.reservacion_id]);
    if (existente) throw new ConflictError('Ya existe una opinión para esta reservación');

    const result = await query(
      `INSERT INTO opiniones (huesped_id, reservacion_id, rating, comentario)
       VALUES (?, ?, ?, ?)`,
      [data.huesped_id, data.reservacion_id, data.rating, data.comentario || null]
    );

    return this.obtenerPorId((result as any).insertId);
  }

  async actualizar(id: number, data: any): Promise<any> {
    const opinion = await querySingle('SELECT * FROM opiniones WHERE id = ?', [id]);
    if (!opinion) throw new NotFoundError('Opinión');

    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new ValidationError('La calificación debe estar entre 1 y 5');
    }

    await query(
      'UPDATE opiniones SET rating = ?, comentario = ? WHERE id = ?',
      [data.rating ?? opinion.rating, data.comentario ?? opinion.comentario, id]
    );

    return this.obtenerPorId(id);
  }

  async eliminar(id: number): Promise<void> {
    const opinion = await querySingle('SELECT id FROM opiniones WHERE id = ?', [id]);
    if (!opinion) throw new NotFoundError('Opinión');
    await query('DELETE FROM opiniones WHERE id = ?', [id]);
  }
}

export const opinionesService = new OpinionesService();
