import { Router, RequestHandler } from 'express';
import { ProveedorController } from '../controllers/proveedor.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

// Proteger todas las rutas
router.use(authMiddleware);

// Crear proveedor
const crear: RequestHandler = async (req, res, next) => {
  try {
    await ProveedorController.crear(req, res);
  } catch (err) {
    next(err);
  }
};

// Obtener todos
const obtenerTodos: RequestHandler = async (req, res, next) => {
  try {
    await ProveedorController.obtenerTodos(req, res);
  } catch (err) {
    next(err);
  }
};

// Obtener por ID
const obtenerPorId: RequestHandler = async (req, res, next) => {
  try {
    await ProveedorController.obtenerPorId(req, res);
  } catch (err) {
    next(err);
  }
};

// Actualizar
const actualizar: RequestHandler = async (req, res, next) => {
  try {
    await ProveedorController.actualizar(req, res);
  } catch (err) {
    next(err);
  }
};

// Eliminar
const eliminar: RequestHandler = async (req, res, next) => {
  try {
    await ProveedorController.eliminar(req, res);
  } catch (err) {
    next(err);
  }
};

// Rutas
router.post('/', crear);
router.get('/', obtenerTodos);
router.get('/:id', obtenerPorId);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;
