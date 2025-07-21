import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSucursales = async (req: Request, res: Response) => {
  try {
    const sucursales = await prisma.sucursales.findMany();
    res.json({ sucursales });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

export const getSucursalById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const sucursal = await prisma.sucursales.findUnique({ where: { id } });
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });
    res.json({ sucursal });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la sucursal' });
  }
};