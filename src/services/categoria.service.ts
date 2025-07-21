import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoriaFiltros {
  incluirInactivas?: boolean;
  filtroTexto?: string;
  filtroEstado?: string;
  incluirSubcategorias?: boolean;
}

interface CategoriaData {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  requiere_refrigeracion?: boolean;
  requiere_control_caducidad?: boolean;
  categoria_padre_id?: number | null;
  activo?: boolean;
}

export const CategoriaService = {
  crear: (data: CategoriaData) => {
    const { categoria_padre_id, ...rest } = data;
    const createData: any = {
      ...rest,
      activo: true
    };
    if (typeof categoria_padre_id === 'number') {
      createData.categoria_padre_id = categoria_padre_id;
    }
    return prisma.categorias.create({
      data: createData,
      include: {
        other_categorias: {
          select: { id: true, nombre: true }
        },
        categorias: {
          select: { id: true, nombre: true }
        }
      }
    });
  },

  obtenerTodas: async (filtros: CategoriaFiltros = {}) => {
    const {
      incluirInactivas = false,
      filtroTexto,
      filtroEstado,
      incluirSubcategorias = true
    } = filtros;

    const where: any = {};

    if (!incluirInactivas) {
      where.activo = true;
    } else if (filtroEstado) {
      where.activo = filtroEstado === 'activo';
    }

    if (filtroTexto) {
      where.OR = [
        { nombre: { contains: filtroTexto, mode: 'insensitive' } },
        { codigo: { contains: filtroTexto, mode: 'insensitive' } },
        { descripcion: { contains: filtroTexto, mode: 'insensitive' } }
      ];
    }

    return prisma.categorias.findMany({
      where,
      include: {
        categorias: {
          select: { id: true, nombre: true }
        },
        ...(incluirSubcategorias && {
          other_categorias: {
            select: { id: true, nombre: true, activo: true }
          }
        })
      },
      orderBy: { nombre: 'asc' }
    });
  },

  obtenerPorId: (id: number) => {
    return prisma.categorias.findUnique({
      where: { id },
      include: {
        categorias: {
          select: { id: true, nombre: true }
        },
        other_categorias: {
          select: { id: true, nombre: true, activo: true }
        }
      }
    });
  },

  actualizar: (id: number, data: CategoriaData) => {
    return prisma.categorias.update({
      where: { id },
      data,
      include: {
        categorias: {
          select: { id: true, nombre: true }
        },
        other_categorias: {
          select: { id: true, nombre: true }
        }
      }
    });
  },

  eliminar: (id: number) => {
    return prisma.categorias.update({
      where: { id },
      data: { activo: false },
      include: {
        other_categorias: {
          select: { id: true, nombre: true }
        }
      }
    });
  },

  tieneProductosAsociados: async (id: number): Promise<boolean> => {
    try {
      const count = await prisma.productos.count({
        where: { categoria_id: id }
      });
      return count > 0;
    } catch (error) {
      console.warn('Tabla productos no encontrada, asumiendo sin productos asociados');
      return false;
    }
  },

  tieneSubcategorias: async (id: number): Promise<boolean> => {
    const count = await prisma.categorias.count({
      where: { categoria_padre_id: id }
    });
    return count > 0;
  },

  obtenerEstadisticas: async () => {
    const [total, activas, conRefrigeracion, conControlCaducidad] = await Promise.all([
      prisma.categorias.count(),
      prisma.categorias.count({ where: { activo: true } }),
      prisma.categorias.count({ where: { requiere_refrigeracion: true } }),
      prisma.categorias.count({ where: { requiere_control_caducidad: true } })
    ]);

    return {
      total,
      activas,
      inactivas: total - activas,
      conRefrigeracion,
      conControlCaducidad
    };
  },

  obtenerParaExportar: async (filtros: CategoriaFiltros = {}) => {
    const { incluirInactivas = false, filtroTexto, filtroEstado } = filtros;

    const where: any = {};

    if (!incluirInactivas) {
      where.activo = true;
    } else if (filtroEstado) {
      where.activo = filtroEstado === 'activo';
    }

    if (filtroTexto) {
      where.OR = [
        { nombre: { contains: filtroTexto, mode: 'insensitive' } },
        { codigo: { contains: filtroTexto, mode: 'insensitive' } },
        { descripcion: { contains: filtroTexto, mode: 'insensitive' } }
      ];
    }

    return prisma.categorias.findMany({
      where,
      include: {
        categorias: {
          select: { nombre: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  },

  existeCodigo: async (codigo: string, excluirId?: number): Promise<boolean> => {
    const where: any = { codigo };
    if (excluirId) {
      where.id = { not: excluirId };
    }
    const categoria = await prisma.categorias.findFirst({ where });
    return !!categoria;
  },

  obtenerParaSelect: async () => {
    return prisma.categorias.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        codigo: true
      },
      orderBy: { nombre: 'asc' }
    });
  },

  buscar: async (texto: string, limite = 10) => {
    return prisma.categorias.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: texto } },
          { codigo: { contains: texto } }
        ]
      },
      select: {
        id: true,
        nombre: true,
        codigo: true
      },
      take: limite,
      orderBy: { nombre: 'asc' }
    });
  }
};
