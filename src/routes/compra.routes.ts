import { Router } from 'express';
import { CompraService } from '../services/compra.service';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const compra = await CompraService.registrarCompra(req.body);
    res.json(compra);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;