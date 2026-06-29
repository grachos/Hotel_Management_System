import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { GuestJwtPayload } from '../types';
import { UnauthorizedError } from '../utils/errors';

declare global {
  namespace Express {
    interface Request {
      guest?: GuestJwtPayload;
    }
  }
}

export function guestAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acceso requerido');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    if (decoded.tipo !== 'huesped') {
      throw new UnauthorizedError('Token inválido para huésped');
    }

    req.guest = {
      huespedId: decoded.huespedId,
      reservacionId: decoded.reservacionId,
      codigo: decoded.codigo,
      roleName: 'Huesped',
      tipo: 'huesped',
    };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Token inválido o expirado');
  }
}
