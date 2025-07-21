import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ProveedorService = {
  crear: (data: any) => prisma.proveedores.create({ data }),

  obtenerTodos: () =>
    prisma.proveedores.findMany({
      where: { activo: true },
      orderBy: { razon_social: 'asc' }
    }),

  obtenerPorId: (id: number) =>
    prisma.proveedores.findUnique({ where: { id } }),

  actualizar: (id: number, data: any) =>
    prisma.proveedores.update({ where: { id }, data }),

  eliminar: (id: number) =>
    prisma.proveedores.update({ where: { id }, data: { activo: false } })
};
