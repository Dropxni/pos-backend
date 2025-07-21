import { Router, Request, Response, RequestHandler } from 'express';
import { ProductoController } from '../controllers/producto.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { InventarioController } from '../controllers/inventario.controller';

const router: Router = Router();

// Protege todas las rutas
router.use(authMiddleware);

// CRUD de productos
const crear: RequestHandler = async (req, res, next) => {
  try {
    await ProductoController.crear(req, res);
  } catch (error) {
    next(error);
  }
};

const obtenerTodos: RequestHandler = async (req, res, next) => {
  try {
    await ProductoController.obtenerTodos(req, res);
  } catch (error) {
    next(error);
  }
};

const obtenerPorId: RequestHandler = async (req, res, next) => {
  try {
    await ProductoController.obtenerPorId(req, res);
  } catch (error) {
    next(error);
  }
};

const actualizar: RequestHandler = async (req, res, next) => {
  try {
    await ProductoController.actualizar(req, res);
  } catch (error) {
    next(error);
  }
};

const eliminar: RequestHandler = async (req, res, next) => {
  try {
    await ProductoController.eliminar(req, res);
  } catch (error) {
    next(error);
  }
};

router.get('/codigo/:codigo_barras', async (req, res, next) => {
  try {
    await ProductoController.buscarPorCodigoBarras(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/stock/:producto_id/:sucursal_id', InventarioController.getStockPorProductoSucursal);

router.post('/', crear);
router.get('/', obtenerTodos);
router.get('/:id', obtenerPorId);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;
