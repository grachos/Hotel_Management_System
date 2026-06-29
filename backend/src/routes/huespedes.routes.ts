import { Router } from 'express';
import { huespedesController } from '../controllers/huespedes.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', huespedesController.listar.bind(huespedesController));
router.get('/:id', huespedesController.obtener.bind(huespedesController));
router.post('/', authorize('huespedes.crear'), huespedesController.crear.bind(huespedesController));
router.put('/:id', authorize('huespedes.editar'), huespedesController.actualizar.bind(huespedesController));
router.delete('/:id', authorize('huespedes.eliminar'), huespedesController.eliminar.bind(huespedesController));

export default router;
