import { PrismaClient, Prisma, ventas_estatus } from '@prisma/client';
const prisma = new PrismaClient();

type DetalleVentaInput = {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  porcentaje_descuento?: number;
};

type VentaCompletaInput = {
  ventaBase: {
    sucursal_id: number;
    usuario_id: number;
    numero_ticket: string;
    nombre_cliente?: string;
    rfc_cliente?: string;
    notas?: string;
  };
  detalles: DetalleVentaInput[];
  metodo_pago_id: number;
};

export const VentaService = {
  async registrarVentaCompleta(input: VentaCompletaInput) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Calcular totales
      let subtotal = 0;
      let total_descuento = 0;
      let total_impuestos = 0;
      const tasa_impuesto = 16;

      for (const item of input.detalles) {
        const desc = item.porcentaje_descuento ?? 0;
        const sin_desc = item.precio_unitario * item.cantidad;
        const descuento = sin_desc * (desc / 100);
        const neto = sin_desc - descuento;
        const impuestos = neto * (tasa_impuesto / 100);

        subtotal += neto;
        total_descuento += descuento;
        total_impuestos += impuestos;
      }

      const total = subtotal + total_impuestos;

      // 2. Crear venta
      const venta = await tx.ventas.create({
        data: {
          ...input.ventaBase,
          subtotal,
          importe_descuento: total_descuento,
          importe_impuestos: total_impuestos,
          total,
          estatus: 'completada' as ventas_estatus,
        },
      });

      // 3. Procesar cada línea de detalle
      for (const item of input.detalles) {
        const { producto_id, cantidad, precio_unitario, porcentaje_descuento } = item;
        const descuento = (porcentaje_descuento ?? 0) / 100;
        const precio_neto = precio_unitario * (1 - descuento);
        const total_linea = precio_neto * cantidad;

        // Lote con stock suficiente (FIFO)
        const lote = await tx.lotes_inventario.findFirst({
          where: {
            producto_id,
            sucursal_id: input.ventaBase.sucursal_id,
            cantidad_actual: { gte: cantidad },
            activo: true,
          },
          orderBy: {
            fecha_caducidad: 'asc',
          },
        });

        if (!lote) {
          throw new Error(`No hay stock suficiente del producto ID ${producto_id}`);
        }

        // Detalle de venta
        await tx.detalle_ventas.create({
          data: {
            venta_id: venta.id,
            producto_id,
            lote_id: lote.id,
            cantidad,
            precio_unitario,
            porcentaje_descuento: porcentaje_descuento ?? 0,
            tasa_impuesto,
            total_linea,
          },
        });

        // Movimiento de inventario
        await tx.movimientos_inventario.create({
          data: {
            sucursal_id: input.ventaBase.sucursal_id,
            producto_id,
            lote_id: lote.id,
            tipo_movimiento: 'salida',
            cantidad,
            costo_unitario: precio_unitario,
            tipo_referencia: 'venta',
            referencia_id: venta.id,
            usuario_id: input.ventaBase.usuario_id,
            notas: `Salida por venta ${venta.numero_ticket}`,
          },
        });

        // Actualizar cantidad en lote
        await tx.lotes_inventario.update({
          where: { id: lote.id },
          data: {
            cantidad_actual: { decrement: cantidad },
          },
        });
      }

      // 4. Registrar pago
      await tx.pagos_ventas.create({
        data: {
          venta_id: venta.id,
          metodo_pago_id: input.metodo_pago_id,
          importe: total,
        },
      });

      return venta;
    });
  },

  async buscarVentas(filtros: {
    sucursalId?: number;
    fechaInicio?: Date;
    fechaFin?: Date;
    usuarioId?: number;
    estatus?: ventas_estatus;
  }) {
    const where: Prisma.ventasWhereInput = {};

    if (filtros.sucursalId) where.sucursal_id = filtros.sucursalId;
    if (filtros.usuarioId) where.usuario_id = filtros.usuarioId;
    if (filtros.estatus) where.estatus = filtros.estatus;

    if (filtros.fechaInicio || filtros.fechaFin) {
      where.fecha_venta = {};
      if (filtros.fechaInicio) where.fecha_venta.gte = filtros.fechaInicio;
      if (filtros.fechaFin) where.fecha_venta.lte = filtros.fechaFin;
    }

    return prisma.ventas.findMany({
      where,
      include: {
        detalle_ventas: {
          include: {
            productos: true
          }
        },
        sucursales: true,
        usuarios: true,
        pagos_ventas: {
          include: {
            metodos_pago: true
          }
        }
      },
      orderBy: {
        fecha_venta: 'desc'
      }
    });
  }
};
