import { Router } from 'express';
import { opinionesController } from '../controllers/opiniones.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { guestAuthenticate } from '../middlewares/guestAuth';

const router = Router();

router.get('/', authenticate, opinionesController.listar.bind(opinionesController));
router.get('/:id', authenticate, opinionesController.obtener.bind(opinionesController));
router.post('/', guestAuthenticate, opinionesController.crear.bind(opinionesController));
router.put('/:id', authenticate, opinionesController.actualizar.bind(opinionesController));
router.delete('/:id', authenticate, authorize('admin'), opinionesController.eliminar.bind(opinionesController));

export default router;
