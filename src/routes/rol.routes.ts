import { Router } from 'express';
import * as RolController from '../controllers/rol.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Protege las rutas con middleware
router.use(authMiddleware);

// Endpoints
router.get('/', (req, res, next) => {
  RolController.getRoles(req, res).catch(next);
});

router.get('/:id', (req, res, next) => {
  RolController.getRolById(req, res).catch(next);
});

export default router;