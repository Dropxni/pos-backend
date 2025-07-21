import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const obtenerSucursales = async () => {
  return prisma.sucursales.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      direccion: true,
      telefono: true,
      email: true,
      activo: true
    },
    orderBy: { id: 'asc' }
  });
};

export const obtenerSucursalPorId = async (id: number) => {
  return prisma.sucursales.findUnique({
    where: { id },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      direccion: true,
      telefono: true,
      email: true,
      activo: true
    }
  });
};
