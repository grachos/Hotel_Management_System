import { Router } from 'express';
import authRoutes from './auth.routes';
import huespedesRoutes from './huespedes.routes';
import reservacionesRoutes from './reservaciones.routes';
import inventarioRoutes from './inventario.routes';
import pedidosRoutes from './pedidos.routes';
import dashboardRoutes from './dashboard.routes';
import habitacionesRoutes from './habitaciones.routes';
import webhookRoutes from './webhook.routes';
import guestRoutes from './guest.routes';
import opinionesRoutes from './opiniones.routes';
import configRoutes from './config.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/huespedes', huespedesRoutes);
router.use('/reservaciones', reservacionesRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/habitaciones', habitacionesRoutes);
router.use('/v1', webhookRoutes);
router.use('/guest', guestRoutes);
router.use('/opiniones', opinionesRoutes);
router.use('/config', configRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API Hotel Gestión - OK', timestamp: new Date().toISOString() });
});

export default router;
