import { Request, Response, NextFunction } from 'express';
import { querySingle } from '../config/database';

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'X-API-Key header requerido' });
  }

  try {
    const config = await querySingle(
      'SELECT valor FROM configuracion WHERE clave = ?',
      ['api.external.key']
    );

    if (!config || config.valor !== apiKey) {
      return res.status(403).json({ success: false, error: 'API Key inválida' });
    }

    next();
  } catch (error) {
    next(error);
  }
}
