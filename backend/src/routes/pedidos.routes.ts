import { Router } from 'express';
import { pedidosController } from '../controllers/pedidos.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', pedidosController.listar.bind(pedidosController));
router.get('/activos', pedidosController.activos.bind(pedidosController));
router.get('/:id', pedidosController.obtener.bind(pedidosController));
router.post('/', authorize('pedidos.crear'), pedidosController.crear.bind(pedidosController));
router.put('/:id/estado', authorize('pedidos.editar'), pedidosController.actualizarEstado.bind(pedidosController));

export default router;
