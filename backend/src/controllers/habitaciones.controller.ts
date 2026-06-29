import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

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
    } catch (error) {
      next(error);
    }
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
      const cabañas = await query(sql, params);
      res.json({ success: true, data: cabañas });
    } catch (error) {
      next(error);
    }
  }
}

export const habitacionesController = new HabitacionesController();
