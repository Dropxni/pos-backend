import { Router, RequestHandler } from 'express';
import { registrarVenta, obtenerVentas, obtenerVentaPorId } from '../controllers/ventas.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Envolver cada handler en try/catch
const registrarVentaHandler: RequestHandler = async (req, res, next) => {
  try {
    await registrarVenta(req, res);
  } catch (err) {
    next(err);
  }
};

const obtenerVentaPorIdHandler: RequestHandler = async (req, res, next) => {
  try {
    await obtenerVentaPorId(req, res);
  } catch (err) {
    next(err);
  }
};

const listarVentasHandler: RequestHandler = async (req, res, next) => {
  try {
    await obtenerVentas(req, res);
  } catch (err) {
    next(err);
  }
};

// Rutas
router.post('/', registrarVentaHandler);
router.get('/:id', obtenerVentaPorIdHandler);
router.get('/', listarVentasHandler);

export default router;