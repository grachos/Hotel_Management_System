import { Request, Response, NextFunction } from 'express';
import { pedidosService } from '../services/pedidos.service';

export class PedidosController {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const pedidos = await pedidosService.listar(req.query);
      res.json({ success: true, data: pedidos });
    } catch (error) {
      next(error);
    }
  }

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const pedido = await pedidosService.obtenerPorId(Number(req.params.id));
      res.json({ success: true, data: pedido });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const pedido = await pedidosService.crear(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: pedido });
    } catch (error) {
      next(error);
    }
  }

  async actualizarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado } = req.body;
      const pedido = await pedidosService.actualizarEstado(Number(req.params.id), estado);
      res.json({ success: true, data: pedido });
    } catch (error) {
      next(error);
    }
  }

  async activos(req: Request, res: Response, next: NextFunction) {
    try {
      const modulo = req.query.modulo as string | undefined;
      const pedidos = await pedidosService.obtenerPedidosActivos(modulo);
      res.json({ success: true, data: pedidos });
    } catch (error) {
      next(error);
    }
  }

  async ocupados(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await pedidosService.listarOcupados();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const pedidosController = new PedidosController();
