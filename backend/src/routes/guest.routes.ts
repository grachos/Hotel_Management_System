import { Router } from 'express';
import { guestController } from '../controllers/guest.controller';
import { guestAuthenticate } from '../middlewares/guestAuth';

const router = Router();

router.use(guestAuthenticate);

router.get('/perfil', guestController.perfil.bind(guestController));
router.get('/productos', guestController.productos.bind(guestController));
router.get('/pedidos', guestController.pedidos.bind(guestController));
router.post('/pedidos', guestController.crearPedido.bind(guestController));
router.get('/consumos', guestController.consumos.bind(guestController));
router.get('/config', guestController.config.bind(guestController));

export default router;
