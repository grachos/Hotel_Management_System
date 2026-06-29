import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async guestLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ success: false, error: 'Token de reservación requerido' });
        return;
      }
      const result = await authService.guestLogin(token);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const usuario = await authService.getProfile(req.user!.userId);
      res.json({ success: true, usuario });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.json({ success: false, valid: false });
        return;
      }
      const token = authHeader.split(' ')[1];
      const payload = await authService.verifyToken(token);
      res.json({ success: true, valid: true, payload });
    } catch (error) {
      res.json({ success: false, valid: false });
    }
  }
}

export const authController = new AuthController();
