import { Router } from 'express';
import { inventarioController } from '../controllers/inventario.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/productos', inventarioController.listarProductos.bind(inventarioController));
router.get('/productos/stock-bajo', inventarioController.stockBajo.bind(inventarioController));
router.get('/productos/:id', inventarioController.obtenerProducto.bind(inventarioController));
router.post('/productos', authorize('inventario.editar'), inventarioController.crearProducto.bind(inventarioController));
router.put('/productos/:id', authorize('inventario.editar'), inventarioController.actualizarProducto.bind(inventarioController));
router.post('/productos/:id/ajustar-stock', authorize('inventario.editar'), inventarioController.ajustarStock.bind(inventarioController));
router.get('/movimientos', authorize('inventario.movimientos'), inventarioController.listarMovimientos.bind(inventarioController));
router.get('/categorias', inventarioController.listarCategorias.bind(inventarioController));
router.get('/proveedores', inventarioController.listarProveedores.bind(inventarioController));

export default router;
