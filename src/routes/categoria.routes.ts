import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// ===== RUTAS DE CONSULTA =====

// Obtener todas las categorías (con filtros opcionales)
router.get('/', (req, res, next) => {
  CategoriaController.obtenerTodas(req, res).catch(next);
});

// Obtener estadísticas de categorías
router.get('/estadisticas', (req, res, next) => {
  CategoriaController.obtenerEstadisticas(req, res).catch(next);
});

// Obtener categorías para select (formato simplificado)
router.get('/select', (req, res, next) => {
  CategoriaController.obtenerParaSelect(req, res).catch(next);
});

// Exportar categorías a CSV
router.get('/exportar/csv', (req, res, next) => {
  CategoriaController.exportarCSV(req, res).catch(next);
});

// Validar si un código está disponible
router.get('/validar-codigo/:codigo', (req, res, next) => {
  CategoriaController.validarCodigo(req, res).catch(next);
});

// Obtener una categoría por ID (debe ir después de las rutas específicas)
router.get('/:id', (req, res, next) => {
  CategoriaController.obtenerPorId(req, res).catch(next);
});

// ===== RUTAS DE MODIFICACIÓN =====

// Crear una nueva categoría
router.post('/', (req, res, next) => {
  CategoriaController.crear(req, res).catch(next);
});

// Actualizar una categoría completa
router.put('/:id', (req, res, next) => {
  CategoriaController.actualizar(req, res).catch(next);
});

// Cambiar solo el estado de una categoría (activo/inactivo)
router.patch('/:id/estado', (req, res, next) => {
  CategoriaController.cambiarEstado(req, res).catch(next);
});

// Eliminar una categoría (soft delete)
router.delete('/:id', (req, res, next) => {
  CategoriaController.eliminar(req, res).catch(next);
});

export default router;