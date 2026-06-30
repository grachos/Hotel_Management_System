import { Request, Response, NextFunction } from 'express';
import { reportsService } from '../services/reports.service';

export class ReportsController {
  async kpiSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.kpiSummary();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async salesTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const dias = parseInt(req.query.dias as string) || 30;
      const data = await reportsService.salesTrend(dias);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async topProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const limite = parseInt(req.query.limite as string) || 10;
      const data = await reportsService.topProductos(limite);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async guestDemographics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.guestDemographics();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}

export const reportsController = new ReportsController();
