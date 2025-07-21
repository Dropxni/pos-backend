import { PrismaClient, Prisma, movimientos_inventario } from '@prisma/client';
const prisma = new PrismaClient();

export const InventarioService = {
  registrarLote: (data: Prisma.lotes_inventarioCreateInput) =>
    prisma.lotes_inventario.create({ data }),

  obtenerLotesPorProducto: (productoId: number) =>
    prisma.lotes_inventario.findMany({
      where: { producto_id: productoId, activo: true },
    }),

  getStockPorProductoSucursal: async (productoId: number, sucursalId: number) => {
    const lotes = await prisma.lotes_inventario.findMany({
      where: {
        producto_id: productoId,
        sucursal_id: sucursalId,
        activo: true,
      },
      select: {
        cantidad_actual: true,
      },
    });

    const stockTotal = lotes.reduce(
      (total, lote) => total.plus(lote.cantidad_actual),
      new Prisma.Decimal(0)
    );

    return { stock: stockTotal };
  },

  obtenerMovimientos: (productoId: number) =>
    prisma.movimientos_inventario.findMany({
      where: { producto_id: productoId },
      orderBy: { fecha_movimiento: 'desc' },
    }),

  moverInventario: async (data: Prisma.movimientos_inventarioCreateInput): Promise<movimientos_inventario> => {
    return prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimientos_inventario.create({ data });

      if ((data as any).lote_id) {
        const lote = await tx.lotes_inventario.findUnique({
          where: { id: (data as any).lote_id },
        });

        if (!lote || !lote.activo) {
          throw new Error('Lote no encontrado o inactivo');
        }

        const cantidad = new Prisma.Decimal(data.cantidad as any);
        let nuevaCantidad = lote.cantidad_actual;

        if (data.tipo_movimiento === 'entrada') {
          nuevaCantidad = nuevaCantidad.plus(cantidad);
        } else if (data.tipo_movimiento === 'salida') {
          if (nuevaCantidad.lessThan(cantidad)) {
            throw new Error('Stock insuficiente para la salida');
          }
          nuevaCantidad = nuevaCantidad.minus(cantidad);
        } else if (data.tipo_movimiento === 'ajuste') {
          nuevaCantidad = cantidad;
        }

        await tx.lotes_inventario.update({
          where: { id: lote.id },
          data: { cantidad_actual: nuevaCantidad },
        });
      }

      return movimiento;
    });
  },

  async getLotesPorCaducar(dias: number = 7) {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + dias);

    return prisma.lotes_inventario.findMany({
      where: {
        fecha_caducidad: {
          gte: hoy,
          lte: fechaLimite
        },
        activo: true,
        cantidad_actual: {
          gt: 0
        }
      },
      include: {
        productos: true,
        sucursales: true
      }
    });
  }

};
