import { Request, Response } from 'express';
import { CategoriaService } from '../services/categoria.service';

export const CategoriaController = {
  crear: async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        codigo,
        nombre,
        descripcion,
        requiere_refrigeracion = false,
        requiere_control_caducidad = false,
        categoria_padre_id = null
      } = req.body;

      if (!codigo || !nombre) {
        return res.status(400).json({ error: 'Los campos código y nombre son obligatorios' });
      }

      if (categoria_padre_id) {
        const padre = await CategoriaService.obtenerPorId(categoria_padre_id);
        if (!padre) {
          return res.status(400).json({ error: 'La categoría padre no existe' });
        }
      }

      const nuevaCategoria = await CategoriaService.crear({
        codigo,
        nombre,
        descripcion,
        requiere_refrigeracion,
        requiere_control_caducidad,
        categoria_padre_id
      });

      return res.status(201).json(nuevaCategoria);
    } catch (error: any) {
      console.error('Error al crear categoría:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Ya existe una categoría con ese código' });
      }
      return res.status(500).json({ error: 'Error al crear categoría' });
    }
  },

  obtenerTodas: async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        incluir_inactivas = 'false',
        filtro_texto,
        filtro_estado,
        incluir_subcategorias = 'true'
      } = req.query;

      const filtros = {
        incluirInactivas: incluir_inactivas === 'true',
        filtroTexto: filtro_texto as string,
        filtroEstado: filtro_estado as string,
        incluirSubcategorias: incluir_subcategorias === 'true'
      };

      const categorias = await CategoriaService.obtenerTodas(filtros);
      return res.json({ categorias });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      return res.status(500).json({ error: 'Error al obtener categorías' });
    }
  },

  obtenerPorId: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID de categoría inválido' });
      }

      const categoria = await CategoriaService.obtenerPorId(Number(id));
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      return res.json(categoria);
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      return res.status(500).json({ error: 'Error al obtener categoría' });
    }
  },

  actualizar: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const {
        codigo,
        nombre,
        descripcion,
        requiere_refrigeracion,
        requiere_control_caducidad,
        categoria_padre_id,
        activo
      } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID de categoría inválido' });
      }

      const categoriaExistente = await CategoriaService.obtenerPorId(Number(id));
      if (!categoriaExistente) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      if (categoria_padre_id && categoria_padre_id === Number(id)) {
        return res.status(400).json({ error: 'Una categoría no puede ser padre de sí misma' });
      }

      if (categoria_padre_id && categoria_padre_id !== categoriaExistente.categoria_padre_id) {
        const padre = await CategoriaService.obtenerPorId(categoria_padre_id);
        if (!padre) {
          return res.status(400).json({ error: 'La categoría padre no existe' });
        }
      }

      const categoriaActualizada = await CategoriaService.actualizar(Number(id), {
        codigo,
        nombre,
        descripcion,
        requiere_refrigeracion,
        requiere_control_caducidad,
        categoria_padre_id,
        activo
      });

      return res.json(categoriaActualizada);
    } catch (error: any) {
      console.error('Error al actualizar categoría:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Ya existe una categoría con ese código' });
      }
      return res.status(500).json({ error: 'Error al actualizar categoría' });
    }
  },

  cambiarEstado: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { activo } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID de categoría inválido' });
      }

      if (typeof activo !== 'boolean') {
        return res.status(400).json({ error: 'El campo activo debe ser un boolean' });
      }

      const categoriaExistente = await CategoriaService.obtenerPorId(Number(id));
      if (!categoriaExistente) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      const categoriaActualizada = await CategoriaService.actualizar(Number(id), { activo });

      return res.json({
        message: `Categoría ${activo ? 'activada' : 'desactivada'} correctamente`,
        categoria: categoriaActualizada
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      return res.status(500).json({ error: 'Error al cambiar estado de la categoría' });
    }
  },

  eliminar: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID de categoría inválido' });
      }

      const categoriaExistente = await CategoriaService.obtenerPorId(Number(id));
      if (!categoriaExistente) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      const tieneProductos = await CategoriaService.tieneProductosAsociados(Number(id));
      if (tieneProductos) {
        return res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene productos asociados' });
      }

      const tieneSubcategorias = await CategoriaService.tieneSubcategorias(Number(id));
      if (tieneSubcategorias) {
        return res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene subcategorías asociadas' });
      }

      const categoriaEliminada = await CategoriaService.eliminar(Number(id));

      return res.json({
        message: 'Categoría eliminada correctamente',
        categoria: categoriaEliminada
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      return res.status(500).json({ error: 'Error al eliminar categoría' });
    }
  },

  obtenerEstadisticas: async (_req: Request, res: Response): Promise<Response> => {
    try {
      const estadisticas = await CategoriaService.obtenerEstadisticas();
      return res.json(estadisticas);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  },

  exportarCSV: async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        incluir_inactivas = 'false',
        filtro_texto,
        filtro_estado
      } = req.query;

      const filtros = {
        incluirInactivas: incluir_inactivas === 'true',
        filtroTexto: filtro_texto as string,
        filtroEstado: filtro_estado as string
      };

      const categorias = await CategoriaService.obtenerParaExportar(filtros);

      const headers = [
        'ID', 'Código', 'Nombre', 'Descripción',
        'Refrigeración', 'Control Caducidad', 'Estado', 'Categoría Padre'
      ];

      const csvData = categorias.map(cat => [
        cat.id,
        cat.codigo,
        cat.nombre,
        cat.descripcion || '',
        cat.requiere_refrigeracion ? 'Sí' : 'No',
        cat.requiere_control_caducidad ? 'Sí' : 'No',
        cat.activo ? 'Activa' : 'Inactiva',
        cat.categoria_padre_id ? cat.categoria_padre_id : 'Sin padre'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const fecha = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="categorias_${fecha}.csv"`);
      res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

      return res.send('\ufeff' + csvContent);
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      return res.status(500).json({ error: 'Error al exportar datos' });
    }
  },

  validarCodigo: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { codigo } = req.params;
      const { excluir_id } = req.query;

      if (!codigo) {
        return res.status(400).json({ error: 'Código es requerido' });
      }

      const existe = await CategoriaService.existeCodigo(codigo, excluir_id ? Number(excluir_id) : undefined);

      return res.json({
        disponible: !existe,
        mensaje: existe ? 'El código ya está en uso' : 'Código disponible'
      });
    } catch (error) {
      console.error('Error al validar código:', error);
      return res.status(500).json({ error: 'Error al validar código' });
    }
  },

  obtenerParaSelect: async (_req: Request, res: Response): Promise<Response> => {
    try {
      const categorias = await CategoriaService.obtenerParaSelect();
      return res.json(categorias);
    } catch (error) {
      console.error('Error al obtener categorías para select:', error);
      return res.status(500).json({ error: 'Error al obtener categorías' });
    }
  }
};
