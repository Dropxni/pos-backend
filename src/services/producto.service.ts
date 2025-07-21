import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const ProductoService = {
  crear: (data: any) => prisma.productos.create({ data }),

  obtenerTodos: () =>
    prisma.productos.findMany({
      include: {
        categorias: true,
        proveedores: true,
      },
    }),

  obtenerPorId: (id: number) =>
    prisma.productos.findUnique({
      where: { id },
      include: {
        categorias: true,
        proveedores: true,
      },
    }),

  obtenerPorCodigoBarras: (codigo_barras: string) =>
    prisma.productos.findFirst({
      where: { codigo_barras },
      include: {
        categorias: true,
        proveedores: true,
      },
    }),

  actualizar: (id: number, data: any) =>
    prisma.productos.update({ where: { id }, data }),

  eliminar: (id: number) =>
    prisma.productos.delete({ where: { id } }),
};
