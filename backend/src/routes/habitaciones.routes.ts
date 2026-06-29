import { Router } from 'express';
import { habitacionesController } from '../controllers/habitaciones.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/cabanias', habitacionesController.listarCabanias.bind(habitacionesController));
router.get('/cabanias/:id', habitacionesController.obtenerCabanias.bind(habitacionesController));
router.post('/cabanias', habitacionesController.crearCabanias.bind(habitacionesController));
router.put('/cabanias/:id', habitacionesController.actualizarCabanias.bind(habitacionesController));
router.delete('/cabanias/:id', habitacionesController.eliminarCabanias.bind(habitacionesController));

router.get('/', habitacionesController.listar.bind(habitacionesController));
router.get('/:id', habitacionesController.obtener.bind(habitacionesController));
router.post('/', habitacionesController.crear.bind(habitacionesController));
router.put('/:id', habitacionesController.actualizar.bind(habitacionesController));
router.delete('/:id', habitacionesController.eliminar.bind(habitacionesController));

export default router;
