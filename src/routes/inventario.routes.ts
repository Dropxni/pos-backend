import { Router } from 'express';
import { InventarioController } from '../controllers/inventario.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { InventarioService } from '../services/inventario.service';

const router = Router();
router.use(authMiddleware);

// Registrar nuevo lote
router.post('/lotes', InventarioController.registrarLote);

// Obtener lotes por producto
router.get('/lotes/:productoId', InventarioController.obtenerLotes);

// Registrar movimiento de inventario
router.post('/movimientos', InventarioController.moverInventario);

// Obtener movimientos por producto
router.get('/movimientos/:productoId', InventarioController.obtenerMovimientos);

// Obtener stock por producto y sucursal
router.get('/stock/:producto_id/:sucursal_id', async (req, res) => {
    const { producto_id, sucursal_id } = req.params;
    try {
      const stock = await InventarioService.getStockPorProductoSucursal(
        parseInt(producto_id),
        parseInt(sucursal_id)
      );
      res.json(stock);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

// Obtener lotes por caducar
router.get('/por-caducar', async (req, res) => {
  const dias = parseInt(req.query.dias as string || '356');
  try {
    const lotes = await InventarioService.getLotesPorCaducar(dias);
    res.json(lotes);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
  });

export default router;