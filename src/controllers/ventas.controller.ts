import { Request, Response } from 'express';
import { VentaService } from '../services/ventas.service';
import { ventas_estatus } from '@prisma/client';

export const registrarVenta = async (req: Request, res: Response) => {
  try {
    console.log('🔥 POST /api/ventas/ - Registrando nueva venta...');
    console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    // Validar estructura del body
    if (!req.body.ventaBase) {
      return res.status(400).json({ 
        error: 'Estructura inválida: falta objeto "ventaBase"',
        ejemplo: {
          ventaBase: {
            sucursal_id: 1,
            usuario_id: 1,
            numero_ticket: "TICKET-001",
            nombre_cliente: "Juan Pérez",
            rfc_cliente: "PEXJ800101XXX",
            notas: "Venta en mostrador"
          },
          detalles: [
            {
              producto_id: 1,
              cantidad: 1,
              precio_unitario: 100.00,
              porcentaje_descuento: 0
            }
          ],
          metodo_pago_id: 1
        }
      });
    }
    
    if (!req.body.detalles || !Array.isArray(req.body.detalles) || req.body.detalles.length === 0) {
      return res.status(400).json({ 
        error: 'Estructura inválida: falta array "detalles" o está vacío' 
      });
    }

    if (!req.body.metodo_pago_id) {
      return res.status(400).json({
        error: 'Estructura inválida: falta metodo_pago_id'
      });
    }

    // Validar campos requeridos en ventaBase
    const camposRequeridos = ['sucursal_id', 'usuario_id', 'numero_ticket'];
    for (const campo of camposRequeridos) {
      if (!req.body.ventaBase[campo]) {
        return res.status(400).json({ 
          error: `Campo requerido faltante en ventaBase: ${campo}` 
        });
      }
    }

    // Validar detalles
    for (let i = 0; i < req.body.detalles.length; i++) {
      const detalle = req.body.detalles[i];
      const camposDetalle = ['producto_id', 'cantidad', 'precio_unitario'];
      
      for (const campo of camposDetalle) {
        if (!detalle[campo]) {
          return res.status(400).json({ 
            error: `Campo requerido faltante en detalle[${i}]: ${campo}` 
          });
        }
      }

      // Validar que sean números positivos
      if (detalle.cantidad <= 0) {
        return res.status(400).json({ 
          error: `La cantidad en detalle[${i}] debe ser mayor a 0` 
        });
      }

      if (detalle.precio_unitario <= 0) {
        return res.status(400).json({ 
          error: `El precio unitario en detalle[${i}] debe ser mayor a 0` 
        });
      }
    }
    
    console.log('✅ Validaciones pasadas, procesando venta...');
    
    const venta = await VentaService.registrarVentaCompleta(req.body);
    console.log('✅ Venta registrada exitosamente:', {
      id: venta.id,
      numero_ticket: venta.numero_ticket,
      total: venta.total
    });

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: venta
    });

  } catch (error) {
    console.error('❌ Error al registrar venta:', error);
    
    // Manejo específico de errores
    if (error instanceof Error) {
      if (error.message.includes('Stock insuficiente')) {
        return res.status(400).json({ 
          error: 'Inventario insuficiente',
          details: error.message 
        });
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return res.status(400).json({ 
          error: 'Referencia inválida (sucursal, usuario, cliente o producto no existe)',
          details: error.message 
        });
      }
    }

    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Contacte al administrador'
    });
  }
};

export const obtenerVentas = async (req: Request, res: Response) => {
  try {
    const { 
      sucursal_id, 
      fecha_inicio, 
      fecha_fin, 
      usuario_id, 
      estatus 
    } = req.query;

    const filtros: {
      sucursalId?: number;
      fechaInicio?: Date;
      fechaFin?: Date;
      usuarioId?: number;
      estatus?: ventas_estatus;
    } = {};
    
    if (sucursal_id) filtros.sucursalId = parseInt(sucursal_id as string);
    if (usuario_id) filtros.usuarioId = parseInt(usuario_id as string);
    if (estatus && Object.values(ventas_estatus).includes(estatus as ventas_estatus)) {
      filtros.estatus = estatus as ventas_estatus;
    }
    if (fecha_inicio) filtros.fechaInicio = new Date(fecha_inicio as string);
    if (fecha_fin) filtros.fechaFin = new Date(fecha_fin as string);

    const ventas = await VentaService.buscarVentas(filtros);
    
    res.json({
      success: true,
      data: ventas,
      total: ventas.length
    });

  } catch (error) {
    console.error('❌ Error al obtener ventas:', error);
    res.status(500).json({ 
      error: 'Error al obtener ventas',
      details: (error as Error).message 
    });
  }
};

export const obtenerVentaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ventas = await VentaService.buscarVentas({});
    const venta = ventas.find(v => v.id === parseInt(id));
    
    if (!venta) {
      return res.status(404).json({ 
        error: 'Venta no encontrada' 
      });
    }
    
    res.json({
      success: true,
      data: venta
    });

  } catch (error) {
    console.error('❌ Error al obtener venta:', error);
    res.status(500).json({ 
      error: 'Error al obtener venta',
      details: (error as Error).message 
    });
  }
};