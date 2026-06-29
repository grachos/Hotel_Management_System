import { Request, Response, NextFunction } from 'express';
import { reservacionesService } from '../services/reservaciones.service';
import { config } from '../config';

export class ReservacionesController {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const reservaciones = await reservacionesService.listar(req.query);
      res.json({ success: true, data: reservaciones });
    } catch (error) {
      next(error);
    }
  }

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const reservacion = await reservacionesService.obtenerPorId(Number(req.params.id));
      res.json({ success: true, data: reservacion });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, created_by: req.user?.userId };
      const reservacion = await reservacionesService.crear(data);
      res.status(201).json({ success: true, data: reservacion });
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const reservacion = await reservacionesService.checkIn(Number(req.params.id), req.user!.userId);
      res.json({ success: true, data: reservacion });
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const reservacion = await reservacionesService.checkOut(Number(req.params.id), req.user!.userId);
      res.json({ success: true, data: reservacion });
    } catch (error) {
      next(error);
    }
  }

  async cancelar(req: Request, res: Response, next: NextFunction) {
    try {
      const reservacion = await reservacionesService.cancelar(Number(req.params.id));
      res.json({ success: true, data: reservacion });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const reservacion = await reservacionesService.actualizar(Number(req.params.id), req.body);
      res.json({ success: true, data: reservacion });
    } catch (error) {
      next(error);
    }
  }

  async generarQR(req: Request, res: Response, next: NextFunction) {
    try {
      const qr = await reservacionesService.generarQR(Number(req.params.id), config.frontendUrl);
      res.json({ success: true, qr });
    } catch (error) {
      next(error);
    }
  }

  async consumos(req: Request, res: Response, next: NextFunction) {
    try {
      const consumos = await reservacionesService.obtenerConsumos(Number(req.params.id));
      res.json({ success: true, data: consumos });
    } catch (error) {
      next(error);
    }
  }

  async factura(req: Request, res: Response, next: NextFunction) {
    try {
      const factura = await reservacionesService.obtenerFactura(Number(req.params.id));
      res.json({ success: true, data: factura });
    } catch (error) {
      next(error);
    }
  }

  async listarAcompanantes(req: Request, res: Response, next: NextFunction) {
    try {
      const acompanantes = await reservacionesService.listarAcompanantes(Number(req.params.id));
      res.json({ success: true, data: acompanantes });
    } catch (error) {
      next(error);
    }
  }

  async agregarAcompanante(req: Request, res: Response, next: NextFunction) {
    try {
      const acompanantes = await reservacionesService.agregarAcompanante(Number(req.params.id), req.body);
      res.status(201).json({ success: true, data: acompanantes });
    } catch (error) {
      next(error);
    }
  }

  async eliminarAcompanante(req: Request, res: Response, next: NextFunction) {
    try {
      const acompanantes = await reservacionesService.eliminarAcompanante(
        Number(req.params.id), Number(req.params.acompananteId)
      );
      res.json({ success: true, data: acompanantes });
    } catch (error) {
      next(error);
    }
  }
}

export const reservacionesController = new ReservacionesController();
