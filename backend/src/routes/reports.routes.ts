import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/kpi-summary', authenticate, reportsController.kpiSummary.bind(reportsController));
router.get('/sales-trend', authenticate, reportsController.salesTrend.bind(reportsController));
router.get('/top-productos', authenticate, reportsController.topProductos.bind(reportsController));
router.get('/guest-demographics', authenticate, reportsController.guestDemographics.bind(reportsController));

export default router;
