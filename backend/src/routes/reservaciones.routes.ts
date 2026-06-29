import { Router } from 'express';
import { reservacionesController } from '../controllers/reservaciones.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', reservacionesController.listar.bind(reservacionesController));
router.get('/:id', reservacionesController.obtener.bind(reservacionesController));
router.get('/:id/consumos', reservacionesController.consumos.bind(reservacionesController));
router.get('/:id/factura', reservacionesController.factura.bind(reservacionesController));
router.get('/:id/qr', reservacionesController.generarQR.bind(reservacionesController));
router.get('/:id/acompanantes', reservacionesController.listarAcompanantes.bind(reservacionesController));
router.post('/', authorize('reservaciones.crear'), reservacionesController.crear.bind(reservacionesController));
router.post('/:id/checkin', authorize('reservaciones.checkin'), reservacionesController.checkIn.bind(reservacionesController));
router.post('/:id/checkout', authorize('reservaciones.checkout'), reservacionesController.checkOut.bind(reservacionesController));
router.put('/:id', authorize('reservaciones.editar'), reservacionesController.actualizar.bind(reservacionesController));
router.post('/:id/cancelar', authorize('reservaciones.cancelar'), reservacionesController.cancelar.bind(reservacionesController));
router.post('/:id/acompanantes', authorize('reservaciones.editar'), reservacionesController.agregarAcompanante.bind(reservacionesController));
router.delete('/:id/acompanantes/:acompananteId', authorize('reservaciones.editar'), reservacionesController.eliminarAcompanante.bind(reservacionesController));

export default router;
