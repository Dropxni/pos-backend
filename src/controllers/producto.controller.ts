import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ProductoController = {
  // Crear un producto
  crear: async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        sku,
        codigo_barras,
        nombre,
        precio_venta,
        precio_costo,
        categoria_id,
        proveedor_id,
        ...resto
      } = req.body;

      // Validación: código de barras único si se proporciona
      if (codigo_barras) {
        const existente = await prisma.productos.findFirst({
          where: { codigo_barras }
        });

        if (existente) {
          return res.status(409).json({ error: 'Ya existe un producto con ese código de barras' });
        }
      }

      // Validación mínima
      if (!nombre || !sku || !precio_venta || !categoria_id) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const nuevoProducto = await prisma.productos.create({
        data: {
          sku,
          codigo_barras,
          nombre,
          precio_venta,
          precio_costo,
          categoria_id,
          proveedor_id,
          ...resto
        }
      });

      return res.status(201).json(nuevoProducto);
    } catch (error) {
      console.error('Error al crear producto:', error);
      return res.status(500).json({ error: 'Error al crear el producto' });
    }
  },

  // Obtener todos los productos
  obtenerTodos: async (_req: Request, res: Response): Promise<Response> => {
    try {
      const productos = await prisma.productos.findMany({
        include: {
          categorias: true,
          proveedores: true,
        },
      });
      return res.json(productos);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
  },

  // Obtener producto por ID
  obtenerPorId: async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);

      const producto = await prisma.productos.findUnique({
        where: { id },
        include: {
          categorias: true,
          proveedores: true,
        },
      });

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      return res.json(producto);
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener producto por código de barras
  buscarPorCodigoBarras: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { codigo_barras } = req.params;

      const producto = await prisma.productos.findFirst({
        where: { codigo_barras },
        include: {
          categorias: true,
          proveedores: true
        }
      });

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      return res.json(producto);
    } catch (error) {
      console.error('Error al buscar producto por código de barras:', error);
      return res.status(500).json({ error: 'Error al buscar producto' });
    }
  },

  // Actualizar producto
  actualizar: async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);

      const productoExistente = await prisma.productos.findUnique({ where: { id } });
      if (!productoExistente) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const productoActualizado = await prisma.productos.update({
        where: { id },
        data: req.body,
      });

      return res.json(productoActualizado);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      return res.status(500).json({ error: 'Error al actualizar producto' });
    }
  },

  // Eliminar producto
  eliminar: async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id);

      const productoExistente = await prisma.productos.findUnique({ where: { id } });
      if (!productoExistente) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      await prisma.productos.delete({ where: { id } });
      return res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      return res.status(500).json({ error: 'Error al eliminar producto' });
    }
  }
};
