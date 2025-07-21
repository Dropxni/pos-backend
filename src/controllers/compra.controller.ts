import { Request, Response } from 'express';
import { CompraService } from '../services/compra.service';

export class CompraController {
  static async crearCompra(req: Request, res: Response) {
    try {
      const compra = await CompraService.registrarCompra(req.body);
      res.status(201).json(compra);
    } catch (error) {
      console.error('Error al registrar compra:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }
}