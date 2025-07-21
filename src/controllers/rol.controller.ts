import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.roles.findMany();
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

export const getRolById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const rol = await prisma.roles.findUnique({ where: { id } });
    if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });
    res.json({ rol });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el rol' });
  }
};
