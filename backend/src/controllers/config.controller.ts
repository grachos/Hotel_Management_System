import { Request, Response, NextFunction } from 'express';
import { configService } from '../services/config.service';

export class ConfigController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await configService.getAll();
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { entries } = req.body;
      await configService.updateMany(entries);
      res.json({ success: true, message: 'Configuración actualizada' });
    } catch (error) {
      next(error);
    }
  }

  async hotelInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const info = await configService.getHotelInfo();
      res.json({ success: true, data: info });
    } catch (error) {
      next(error);
    }
  }
}

export const configController = new ConfigController();
