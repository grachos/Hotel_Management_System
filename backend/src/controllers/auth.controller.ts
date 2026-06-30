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
      res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (error) {
      next(error);
    }
  }

  async listarUsuarios(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await authService.listarUsuarios();
      res.json({ success: true, data: usuarios });
    } catch (error) { next(error); }
  }

  async crearUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const usuario = await authService.crearUsuario(req.body);
      res.status(201).json({ success: true, data: usuario });
    } catch (error) { next(error); }
  }

  async actualizarUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const usuario = await authService.actualizarUsuario(Number(req.params.id), req.body);
      res.json({ success: true, data: usuario });
    } catch (error) { next(error); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const usuario = await authService.updateProfile(req.user!.userId, req.body);
      res.json({ success: true, data: usuario });
    } catch (error) { next(error); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) { res.status(400).json({ success: false, error: 'Email requerido' }); return; }
      await authService.forgotPassword(email);
      res.json({ success: true, message: 'Si el email existe, recibirás un enlace de recuperación' });
    } catch (error) { next(error); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      if (!token || !password) { res.status(400).json({ success: false, error: 'Token y contraseña requeridos' }); return; }
      await authService.resetPassword(token, password);
      res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) { next(error); }
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
