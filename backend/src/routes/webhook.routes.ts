import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { apiKeyAuth } from '../middlewares/apiKey';

const router = Router();

router.get('/health', webhookController.health.bind(webhookController));
router.post('/reservaciones', apiKeyAuth, webhookController.crearReservacion.bind(webhookController));

export default router;
