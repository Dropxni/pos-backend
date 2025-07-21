import { Request, Response } from 'express';
import { InventarioService } from '../services/inventario.service';

export const InventarioController = {
  registrarLote: async (req: Request, res: Response) => {
    try {
      const lote = await InventarioService.registrarLote(req.body);
      res.json(lote);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  obtenerLotes: async (req: Request, res: Response) => {
    try {
      const productoId = parseInt(req.params.productoId);
      const lotes = await InventarioService.obtenerLotesPorProducto(productoId);
      res.json(lotes);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  moverInventario: async (req: Request, res: Response) => {
    try {
      const movimiento = await InventarioService.moverInventario(req.body);
      res.json(movimiento);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  obtenerMovimientos: async (req: Request, res: Response) => {
    try {
      const productoId = parseInt(req.params.productoId);
      const movimientos = await InventarioService.obtenerMovimientos(productoId);
      res.json(movimientos);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  getStockPorProductoSucursal: async (req: Request, res: Response) => {
    try {
      const producto_id = parseInt(req.params.producto_id);
      const sucursal_id = parseInt(req.params.sucursal_id);
      const stock = await InventarioService.getStockPorProductoSucursal(producto_id, sucursal_id);
      res.json(stock);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  getLotesPorCaducar: async (req: Request, res: Response) => {
    try {
      const lotes = await InventarioService.getLotesPorCaducar();
      res.json(lotes);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
};