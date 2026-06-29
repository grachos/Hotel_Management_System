import { Router } from 'express';
import { habitacionesController } from '../controllers/habitaciones.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', habitacionesController.listar.bind(habitacionesController));
router.get('/cabanias', habitacionesController.listarCabanias.bind(habitacionesController));

export default router;
