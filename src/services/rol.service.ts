import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const obtenerRoles = async () => {
  return prisma.roles.findMany({
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      permisos: true
    },
    orderBy: { id: 'asc' }
  });
};

export const obtenerRolPorId = async (id: number) => {
  return prisma.roles.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      permisos: true
    }
  });
};
