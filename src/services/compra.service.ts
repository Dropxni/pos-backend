import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

export const CompraService = {
  async registrarCompra(data: {
    compra: Prisma.comprasCreateInput;
    detalles: {
      producto_id: number;
      cantidad: number;
      costo_unitario: number;
      fecha_caducidad?: string; // opcional
    }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const compra = await tx.compras.create({ data: data.compra });

      for (const item of data.detalles) {
        // Crear lote
        const lote = await tx.lotes_inventario.create({
          data: {
            sucursal_id: compra.sucursal_id,
            producto_id: item.producto_id,
            numero_lote: `${compra.numero_compra}-${item.producto_id}`,
            fecha_recepcion: new Date(),
            fecha_caducidad: item.fecha_caducidad ? new Date(item.fecha_caducidad) : null,
            cantidad_inicial: item.cantidad,
            cantidad_actual: item.cantidad,
            precio_costo: item.costo_unitario,
            proveedor_id: compra.proveedor_id,
            orden_compra: compra.numero_compra
          }
        });

        const total_linea = item.cantidad * item.costo_unitario;

        // Crear detalle de compra
        await tx.detalle_compras.create({
          data: {
            compra_id: compra.id,
            producto_id: item.producto_id,
            lote_id: lote.id,
            cantidad: item.cantidad,
            costo_unitario: item.costo_unitario,
            tasa_impuesto: 16,
            total_linea
          }
        });

        // Registrar movimiento de entrada
        await tx.movimientos_inventario.create({
          data: {
            sucursal_id: compra.sucursal_id,
            producto_id: item.producto_id,
            lote_id: lote.id,
            tipo_movimiento: 'entrada',
            cantidad: item.cantidad,
            costo_unitario: item.costo_unitario,
            tipo_referencia: 'compra',
            referencia_id: compra.id,
            usuario_id: compra.usuario_id
          }
        });
      }

      return compra;
    });
  }
};