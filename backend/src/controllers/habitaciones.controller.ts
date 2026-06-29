import { Request, Response, NextFunction } from 'express';
import { query, querySingle } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class HabitacionesController {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, tipo } = req.query;
      let sql = 'SELECT * FROM habitaciones WHERE activo = 1';
      const params: any[] = [];
      if (estado) {
        const estados = Array.isArray(estado) ? estado : [estado];
        sql += ` AND estado IN (${estados.map(() => '?').join(',')})`;
        params.push(...estados);
      }
      if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
      sql += ' ORDER BY numero';
      const habitaciones = await query(sql, params);
      res.json({ success: true, data: habitaciones });
    } catch (error) { next(error); }
  }

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const hab = await querySingle('SELECT * FROM habitaciones WHERE id = ?', [req.params.id]);
      if (!hab) throw new NotFoundError('Habitación');
      res.json({ success: true, data: hab });
    } catch (error) { next(error); }
  }

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await query(
        `INSERT INTO habitaciones (numero, piso, tipo, capacidad, precio_noche, estado, descripcion, amenities)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.body.numero, req.body.piso, req.body.tipo, req.body.capacidad,
         req.body.precio_noche, req.body.estado || 'Disponible',
         req.body.descripcion || null, req.body.amenities || null]
      );
      const hab = await querySingle('SELECT * FROM habitaciones WHERE id = ?', [(r as any).insertId]);
      res.status(201).json({ success: true, data: hab });
    } catch (error) { next(error); }
  }

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const exist = await querySingle('SELECT id FROM habitaciones WHERE id = ?', [req.params.id]);
      if (!exist) throw new NotFoundError('Habitación');
      await query(
        `UPDATE habitaciones SET numero=?, piso=?, tipo=?, capacidad=?, precio_noche=?, estado=?, descripcion=?, amenities=?
         WHERE id=?`,
        [req.body.numero, req.body.piso, req.body.tipo, req.body.capacidad,
         req.body.precio_noche, req.body.estado, req.body.descripcion || null,
         req.body.amenities || null, req.params.id]
      );
      const hab = await querySingle('SELECT * FROM habitaciones WHERE id = ?', [req.params.id]);
      res.json({ success: true, data: hab });
    } catch (error) { next(error); }
  }

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const exist = await querySingle('SELECT id FROM habitaciones WHERE id = ?', [req.params.id]);
      if (!exist) throw new NotFoundError('Habitación');
      await query('UPDATE habitaciones SET activo = 0 WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: 'Habitación eliminada' });
    } catch (error) { next(error); }
  }

  async listarCabanias(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado } = req.query;
      let sql = 'SELECT * FROM cabañas WHERE activo = 1';
      const params: any[] = [];
      if (estado) {
        const estados = Array.isArray(estado) ? estado : [estado];
        sql += ` AND estado IN (${estados.map(() => '?').join(',')})`;
        params.push(...estados);
      }
      sql += ' ORDER BY nombre';
      const data = await query(sql, params);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async obtenerCabanias(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await querySingle('SELECT * FROM cabañas WHERE id = ?', [req.params.id]);
      if (!item) throw new NotFoundError('Cabaña');
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  }

  async crearCabanias(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await query(
        `INSERT INTO cabañas (nombre, capacidad, precio_noche, estado, descripcion, amenities)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.body.nombre, req.body.capacidad, req.body.precio_noche,
         req.body.estado || 'Disponible', req.body.descripcion || null, req.body.amenities || null]
      );
      const item = await querySingle('SELECT * FROM cabañas WHERE id = ?', [(r as any).insertId]);
      res.status(201).json({ success: true, data: item });
    } catch (error) { next(error); }
  }

  async actualizarCabanias(req: Request, res: Response, next: NextFunction) {
    try {
      const exist = await querySingle('SELECT id FROM cabañas WHERE id = ?', [req.params.id]);
      if (!exist) throw new NotFoundError('Cabaña');
      await query(
        `UPDATE cabañas SET nombre=?, capacidad=?, precio_noche=?, estado=?, descripcion=?, amenities=? WHERE id=?`,
        [req.body.nombre, req.body.capacidad, req.body.precio_noche, req.body.estado,
         req.body.descripcion || null, req.body.amenities || null, req.params.id]
      );
      const item = await querySingle('SELECT * FROM cabañas WHERE id = ?', [req.params.id]);
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  }

  async eliminarCabanias(req: Request, res: Response, next: NextFunction) {
    try {
      const exist = await querySingle('SELECT id FROM cabañas WHERE id = ?', [req.params.id]);
      if (!exist) throw new NotFoundError('Cabaña');
      await query('UPDATE cabañas SET activo = 0 WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: 'Cabaña eliminada' });
    } catch (error) { next(error); }
  }
}

export const habitacionesController = new HabitacionesController();
