import { Request, Response, NextFunction } from 'express';
import { inventarioService } from '../services/inventario.service';

export class InventarioController {
  async listarProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await inventarioService.listarProductos(req.query);
      res.json({ success: true, data: productos });
    } catch (error) {
      next(error);
    }
  }

  async obtenerProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await inventarioService.obtenerProducto(Number(req.params.id));
      res.json({ success: true, data: producto });
    } catch (error) {
      next(error);
    }
  }

  async crearProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await inventarioService.crearProducto({ ...req.body, created_by: req.user?.userId });
      res.status(201).json({ success: true, data: producto });
    } catch (error) {
      next(error);
    }
  }

  async actualizarProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await inventarioService.actualizarProducto(Number(req.params.id), req.body);
      res.json({ success: true, data: producto });
    } catch (error) {
      next(error);
    }
  }

  async ajustarStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { cantidad, tipo, observacion } = req.body;
      const producto = await inventarioService.ajustarStock(
        Number(req.params.id), cantidad, tipo, observacion, req.user!.userId
      );
      res.json({ success: true, data: producto });
    } catch (error) {
      next(error);
    }
  }

  async listarMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = req.query.producto_id ? Number(req.query.producto_id) : undefined;
      const movimientos = await inventarioService.listarMovimientos(productoId);
      res.json({ success: true, data: movimientos });
    } catch (error) {
      next(error);
    }
  }

  async listarCategorias(req: Request, res: Response, next: NextFunction) {
    try {
      const categorias = await inventarioService.listarCategorias();
      res.json({ success: true, data: categorias });
    } catch (error) {
      next(error);
    }
  }

  async listarProveedores(req: Request, res: Response, next: NextFunction) {
    try {
      const proveedores = await inventarioService.listarProveedores();
      res.json({ success: true, data: proveedores });
    } catch (error) {
      next(error);
    }
  }

  async stockBajo(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await inventarioService.productosStockBajo();
      res.json({ success: true, data: productos });
    } catch (error) {
      next(error);
    }
  }
}

export const inventarioController = new InventarioController();
