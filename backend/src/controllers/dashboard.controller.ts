import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

export class DashboardController {
  async resumen(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        ventasHoy,
        ventasMes,
        ocupacion,
        pedidosPendientes,
        stockBajo,
        topProductos,
        ventasModulo,
        huespedesActivos,
      ] = await Promise.all([
        query(`
          SELECT COALESCE(SUM(total), 0) as total
          FROM pedidos
          WHERE DATE(created_at) = CURDATE() AND estado NOT IN ('Cancelado')
        `),
        query(`
          SELECT COALESCE(SUM(total), 0) as total
          FROM pedidos
          WHERE MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
            AND estado NOT IN ('Cancelado')
        `),
        query(`
          SELECT
            (SELECT COUNT(*) FROM habitaciones WHERE estado = 'Ocupada') as habitaciones_ocupadas,
            (SELECT COUNT(*) FROM habitaciones WHERE estado != 'Mantenimiento') as habitaciones_totales,
            (SELECT COUNT(*) FROM cabañas WHERE estado = 'Ocupada') as cabañas_ocupadas,
            (SELECT COUNT(*) FROM cabañas WHERE estado != 'Mantenimiento') as cabañas_totales
        `),
        query(`
          SELECT COUNT(*) as total FROM pedidos WHERE estado IN ('Pendiente', 'Preparando')
        `),
        query(`
          SELECT COUNT(*) as total FROM productos
          WHERE activo = 1 AND stock_actual <= stock_minimo
        `),
        query(`
          SELECT p.nombre, SUM(dp.cantidad) as total_vendido, SUM(dp.subtotal) as total_ingresos
          FROM detalle_pedidos dp
          JOIN productos p ON dp.producto_id = p.id
          JOIN pedidos pe ON dp.pedido_id = pe.id
          WHERE MONTH(pe.created_at) = MONTH(CURDATE())
            AND YEAR(pe.created_at) = YEAR(CURDATE())
            AND pe.estado NOT IN ('Cancelado')
          GROUP BY p.id, p.nombre
          ORDER BY total_vendido DESC
          LIMIT 10
        `),
        query(`
          SELECT modulo, COUNT(*) as total_pedidos, SUM(total) as total_ventas
          FROM pedidos
          WHERE MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
            AND estado NOT IN ('Cancelado')
          GROUP BY modulo
        `),
        query(`
          SELECT COUNT(*) as total FROM reservaciones WHERE estado = 'CheckIn'
        `),
      ]);

      res.json({
        success: true,
        data: {
          ventasHoy: (ventasHoy as any[])[0]?.total || 0,
          ventasMes: (ventasMes as any[])[0]?.total || 0,
          ocupacion: (ocupacion as any[])[0] || {},
          pedidosPendientes: (pedidosPendientes as any[])[0]?.total || 0,
          stockBajo: (stockBajo as any[])[0]?.total || 0,
          topProductos: topProductos,
          ventasModulo: ventasModulo,
          huespedesActivos: (huespedesActivos as any[])[0]?.total || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async ventasPorDia(req: Request, res: Response, next: NextFunction) {
    try {
      const dias = parseInt(req.query.dias as string) || 30;
      const ventas = await query(`
        SELECT DATE(created_at) as fecha, SUM(total) as total, COUNT(*) as pedidos
        FROM pedidos
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          AND estado NOT IN ('Cancelado')
        GROUP BY DATE(created_at)
        ORDER BY fecha ASC
      `, [dias]);

      res.json({ success: true, data: ventas });
    } catch (error) {
      next(error);
    }
  }

  async alertasRecientes(req: Request, res: Response, next: NextFunction) {
    try {
      const alertas = await query(`
        SELECT a.*, u.nombre as usuario_nombre
        FROM alertas a
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 20
      `);

      res.json({ success: true, data: alertas });
    } catch (error) {
      next(error);
    }
  }

  async marcarAlerta(req: Request, res: Response, next: NextFunction) {
    try {
      await query('UPDATE alertas SET leida = 1 WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: 'Alerta marcada como leída' });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
