import { Router } from 'express';
import { configController } from '../controllers/config.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, configController.getAll.bind(configController));
router.put('/', authenticate, configController.update.bind(configController));
router.get('/hotel-info', configController.hotelInfo.bind(configController));

export default router;
