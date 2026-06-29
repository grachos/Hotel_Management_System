import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

export function auditLog(accion: string, tabla: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      if (res.statusCode < 400 && req.user) {
        const registroId = body?.data?.id || body?.id || req.params.id;
        query(
          `INSERT INTO audit_logs (usuario_id, accion, tabla, registro_id, direccion_ip)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.userId, accion, tabla, registroId, req.ip]
        ).catch(console.error);
      }
      return originalJson(body);
    };

    next();
  };
}
