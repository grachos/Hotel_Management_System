import { Request, Response, NextFunction } from 'express';
import { opinionesService } from '../services/opiniones.service';

export class OpinionesController {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const opiniones = await opinionesService.listar(req.query);
      res.json({ success: true, data: opiniones });
    } catch (error) {
      next(error);
    }
  }

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const opinion = await opinionesService.obtenerPorId(Number(req.params.id));
      res.json({ success: true, data: opinion });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const opinion = await opinionesService.crear(req.body);
      res.status(201).json({ success: true, data: opinion });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const opinion = await opinionesService.actualizar(Number(req.params.id), req.body);
      res.json({ success: true, data: opinion });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      await opinionesService.eliminar(Number(req.params.id));
      res.json({ success: true, message: 'Opinión eliminada' });
    } catch (error) {
      next(error);
    }
  }
}

export const opinionesController = new OpinionesController();
