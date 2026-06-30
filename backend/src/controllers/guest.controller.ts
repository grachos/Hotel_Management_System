import { Request, Response, NextFunction } from 'express';
import { guestService } from '../services/guest.service';

export class GuestController {
  async perfil(req: Request, res: Response, next: NextFunction) {
    try {
      const { huespedId, reservacionId } = req.guest!;
      const data = await guestService.obtenerPerfil(huespedId, reservacionId);
      res.json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  async productos(req: Request, res: Response, next: NextFunction) {
    try {
      const { modulo } = req.query;
      const productos = await guestService.listarProductos(modulo as string | undefined);
      res.json({ success: true, data: productos });
    } catch (error) {
      next(error);
    }
  }

  async pedidos(req: Request, res: Response, next: NextFunction) {
    try {
      const { reservacionId } = req.guest!;
      const pedidos = await guestService.listarPedidos(reservacionId);
      res.json({ success: true, data: pedidos });
    } catch (error) {
      next(error);
    }
  }

  async crearPedido(req: Request, res: Response, next: NextFunction) {
    try {
      const { huespedId, reservacionId } = req.guest!;
      const pedido = await guestService.crearPedido(huespedId, reservacionId, req.body);
      res.status(201).json({ success: true, data: pedido });
    } catch (error) {
      next(error);
    }
  }

  async consumos(req: Request, res: Response, next: NextFunction) {
    try {
      const { reservacionId } = req.guest!;
      const consumos = await guestService.listarConsumos(reservacionId);
      const total = await guestService.totalConsumos(reservacionId);
      res.json({ success: true, data: consumos, total });
    } catch (error) {
      next(error);
    }
  }

  async config(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await guestService.configPublica();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const guestController = new GuestController();
