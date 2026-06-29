import { Request, Response, NextFunction } from 'express';
import { huespedesService } from '../services/huespedes.service';

export class HuespedesController {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const huespedes = await huespedesService.listar(req.query);
      res.json({ success: true, data: huespedes });
    } catch (error) {
      next(error);
    }
  }

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const huesped = await huespedesService.obtenerPorId(Number(req.params.id));
      res.json({ success: true, data: huesped });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const huesped = await huespedesService.crear(req.body);
      res.status(201).json({ success: true, data: huesped });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const huesped = await huespedesService.actualizar(Number(req.params.id), req.body);
      res.json({ success: true, data: huesped });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      await huespedesService.eliminar(Number(req.params.id));
      res.json({ success: true, message: 'Huésped eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}

export const huespedesController = new HuespedesController();
