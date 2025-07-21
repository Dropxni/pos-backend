import { Router } from 'express';
import * as UsuarioController from '../controllers/usuario.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import path from 'path';

const router = Router();

// Protege todas las rutas con middleware
router.use(authMiddleware);

// Endpoints CRUD
router.get('/', (req, res, next) => {
  UsuarioController.getUsuarios(req, res).catch(next);
});
router.get('/:id', (req, res, next) => {
  UsuarioController.getUsuarioById(req, res).catch(next);
});
router.post('/', (req, res, next) => {
  UsuarioController.postUsuario(req, res).catch(next);
});
router.put('/:id', (req, res, next) => {
  UsuarioController.putUsuario(req, res).catch(next);
});
router.patch('/:id/activar', (req, res, next) => {
  UsuarioController.patchEstadoUsuario(req, res).catch(next);
});

router.delete('/:id', (req, res, next) => {
  UsuarioController.deleteUsuario(req, res).catch(next);
});

export default router;
