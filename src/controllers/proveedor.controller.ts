import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ProveedorController = {
  // Crear proveedor
  crear: async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        codigo,
        razon_social,
        nombre_contacto,
        telefono,
        email,
        direccion,
        rfc,
        dias_credito = 0,
        limite_credito = 0.00
      } = req.body;

      const nuevoProveedor = await prisma.proveedores.create({
        data: {
          codigo,
          razon_social,
          nombre_contacto,
          telefono,
          email,
          direccion,
          rfc,
          dias_credito,
          limite_credito
        }
      });

      return res.status(201).json(nuevoProveedor);
    } catch (error: any) {
      console.error('Error al crear proveedor:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Ya existe un proveedor con ese código' });
      }
      return res.status(500).json({ error: 'Error al crear proveedor' });
    }
  },

  // Obtener todos los proveedores activos
  obtenerTodos: async (_req: Request, res: Response): Promise<Response> => {
    try {
      const proveedores = await prisma.proveedores.findMany({
        where: { activo: true },
        orderBy: { razon_social: 'asc' }
      });
      return res.json({ proveedores });
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return res.status(500).json({ error: 'Error al obtener proveedores' });
    }
  },

  // Obtener proveedor por ID
  obtenerPorId: async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);
      const proveedor = await prisma.proveedores.findUnique({ where: { id } });

      if (!proveedor) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      return res.json(proveedor);
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      return res.status(500).json({ error: 'Error al obtener proveedor' });
    }
  },

  // Actualizar proveedor
  actualizar: async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);
      const existe = await prisma.proveedores.findUnique({ where: { id } });

      if (!existe) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const actualizado = await prisma.proveedores.update({
        where: { id },
        data: req.body
      });

      return res.json(actualizado);
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      return res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
  },

  // Eliminar (baja lógica) proveedor
  eliminar: async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);
      const existe = await prisma.proveedores.findUnique({ where: { id } });

      if (!existe) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      await prisma.proveedores.update({
        where: { id },
        data: { activo: false }
      });

      return res.json({ mensaje: 'Proveedor dado de baja correctamente' });
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      return res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
  }
};
