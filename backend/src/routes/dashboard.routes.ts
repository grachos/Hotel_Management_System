import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/resumen', dashboardController.resumen.bind(dashboardController));
router.get('/ventas', dashboardController.ventasPorDia.bind(dashboardController));
router.get('/alertas', dashboardController.alertasRecientes.bind(dashboardController));
router.put('/alertas/:id/leer', dashboardController.marcarAlerta.bind(dashboardController));

export default router;
