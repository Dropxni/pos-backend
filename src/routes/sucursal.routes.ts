import { Router } from 'express';
import * as SucursalController from '../controllers/sucursal.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Middleware de autenticación
router.use(authMiddleware);

// Endpoints
router.get('/', (req, res, next) => {
  SucursalController.getSucursales(req, res).catch(next);
});

router.get('/:id', (req, res, next) => {
  SucursalController.getSucursalById(req, res).catch(next);
});

export default router;