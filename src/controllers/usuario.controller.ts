import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();

// Constantes para permisos
const PERMISOS = {
  USUARIOS: 'usuarios',
  USUARIOS_ADMIN: 'usuarios:admin',
  ADMIN: 'admin'
} as const;

// Helper functions
const esUsuarioAdmin = (usuario: any): boolean => {
  return usuario?.permisos?.includes(PERMISOS.USUARIOS_ADMIN) || 
         usuario?.permisos?.includes(PERMISOS.ADMIN);
};

const puedeAccederTodasSucursales = (usuario: any): boolean => {
  return esUsuarioAdmin(usuario);
};

const validarAccesoSucursal = (usuarioActual: any, targetSucursalId: number): boolean => {
  if (puedeAccederTodasSucursales(usuarioActual)) {
    return true; // Admin puede acceder a cualquier sucursal
  }
  return usuarioActual?.sucursal_id === targetSucursalId;
};

export const getUsuarios = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioActual = req.user;

    if (!usuarioActual?.permisos.includes(PERMISOS.USUARIOS)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    const puedeVerTodas = puedeAccederTodasSucursales(usuarioActual);

    const usuarios = await prisma.usuarios.findMany({
      where: puedeVerTodas
        ? {} // Sin filtro por sucursal
        : { sucursal_id: usuarioActual.sucursal_id },
      select: {
        id: true,
        nombre: true,
        email: true,
        nombre_usuario: true,
        activo: true,
        ultimo_acceso: true,
        roles: {
          select: { nombre: true }
        },
        sucursales: {
          select: { nombre: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    return res.json({ usuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getUsuarioById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioActual = req.user;
    const id = Number(req.params.id);

    if (!usuarioActual?.permisos.includes(PERMISOS.USUARIOS)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    const puedeVerTodas = puedeAccederTodasSucursales(usuarioActual);

    const usuario = await prisma.usuarios.findFirst({
      where: puedeVerTodas
        ? { id }
        : {
          id,
          sucursal_id: usuarioActual?.sucursal_id
        },
      include: {
        roles: true,
        sucursales: {
          select: { nombre: true }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ usuario });
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const postUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioActual = req.user;

    // Validar permiso básico
    if (!usuarioActual?.permisos.includes(PERMISOS.USUARIOS)) {
      return res.status(403).json({ error: 'No tienes permisos para crear usuarios' });
    }

    const { nombre_usuario, email, password, nombre, apellidos, rol_id, sucursal_id } = req.body;

    // Validar campos obligatorios
    if (!nombre_usuario || !email || !password || !nombre || !apellidos || !rol_id || !sucursal_id) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // ✅ CORRECCIÓN: Validar si puede crear usuarios en la sucursal especificada
    if (!validarAccesoSucursal(usuarioActual, Number(sucursal_id))) {
      console.log('DEBUG - Acceso denegado:', {
        usuarioId: usuarioActual.id,
        usuarioSucursal: usuarioActual.sucursal_id,
        targetSucursal: sucursal_id,
        permisos: usuarioActual.permisos,
        esAdmin: esUsuarioAdmin(usuarioActual)
      });
      return res.status(403).json({ 
        error: 'No tienes permisos para crear usuarios en esta sucursal',
        debug: {
          tuSucursal: usuarioActual.sucursal_id,
          sucursalDestino: sucursal_id,
          esAdmin: esUsuarioAdmin(usuarioActual)
        }
      });
    }

    // Verificar que el email y nombre_usuario no existan
    const usuarioExistente = await prisma.usuarios.findFirst({
      where: {
        OR: [
          { email },
          { nombre_usuario }
        ]
      }
    });

    if (usuarioExistente) {
      return res.status(409).json({ 
        error: usuarioExistente.email === email 
          ? 'El email ya está registrado' 
          : 'El nombre de usuario ya está en uso' 
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre_usuario,
        email,
        password_hash,
        nombre,
        apellidos,
        rol_id: Number(rol_id),
        sucursal_id: Number(sucursal_id)
      },
      include: {
        roles: true,
        sucursales: {
          select: { nombre: true }
        }
      }
    });

    // Procesar permisos
    const permisos = Array.isArray(nuevoUsuario.roles.permisos)
      ? nuevoUsuario.roles.permisos
      : JSON.parse(String(nuevoUsuario.roles.permisos || '[]'));

    const ultimoAccesoMexico = nuevoUsuario.ultimo_acceso
      ? toZonedTime(nuevoUsuario.ultimo_acceso, 'America/Mexico_City')
      : null;

    // ✅ NO generar token innecesario para el nuevo usuario
    return res.status(201).json({
      message: 'Usuario creado correctamente',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellidos: nuevoUsuario.apellidos,
        email: nuevoUsuario.email,
        nombre_usuario: nuevoUsuario.nombre_usuario,
        rol: nuevoUsuario.roles.nombre,
        rol_id: nuevoUsuario.rol_id,
        sucursal_id: nuevoUsuario.sucursal_id,
        sucursal: nuevoUsuario.sucursales.nombre,
        permisos,
        activo: nuevoUsuario.activo,
        ultimo_acceso: ultimoAccesoMexico
      }
    });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

export const putUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioActual = req.user;
    const id = Number(req.params.id);

    if (!usuarioActual?.permisos.includes(PERMISOS.USUARIOS)) {
      return res.status(403).json({ error: 'No tienes permisos para editar usuarios' });
    }

    const esAdmin = esUsuarioAdmin(usuarioActual);
    
    let usuarioExistente;

    if (esAdmin) {
      usuarioExistente = await prisma.usuarios.findUnique({ where: { id } });
    } else {
      usuarioExistente = await prisma.usuarios.findFirst({
        where: { id, sucursal_id: usuarioActual.sucursal_id }
      });
    }

    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si se está intentando cambiar la sucursal, validar permisos
    if (req.body.sucursal_id && !validarAccesoSucursal(usuarioActual, Number(req.body.sucursal_id))) {
      return res.status(403).json({ error: 'No tienes permisos para mover usuarios a otra sucursal' });
    }

    // Preparar datos de actualización (excluir campos sensibles)
    const { password, password_hash, ...datosActualizacion } = req.body;
    
    // Si se proporciona nueva contraseña, hashearla
    if (password) {
      datosActualizacion.password_hash = await bcrypt.hash(password, 10);
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id },
      data: datosActualizacion,
      include: {
        roles: true,
        sucursales: { select: { nombre: true } }
      }
    });

    return res.json({ 
      message: 'Usuario actualizado correctamente',
      usuario: usuarioActualizado 
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const patchEstadoUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioActual = req.user;
    const id = Number(req.params.id);

    if (!usuarioActual?.permisos.includes(PERMISOS.USUARIOS)) {
      return res.status(403).json({ error: 'No tienes permisos para cambiar el estado de usuarios' });
    }

    const esAdmin = esUsuarioAdmin(usuarioActual);
    
    let usuario;

    if (esAdmin) {
      usuario = await prisma.usuarios.findUnique({ where: { id } });
    } else {
      usuario = await prisma.usuarios.findFirst({
        where: { id, sucursal_id: usuarioActual.sucursal_id }
      });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Evitar que se desactive a sí mismo
    if (usuario.id === usuarioActual.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propio usuario' });
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id },
      data: { activo: !usuario.activo },
      include: {
        roles: true,
        sucursales: { select: { nombre: true } }
      }
    });

    return res.json({
      message: `Usuario ${usuarioActualizado.activo ? 'activado' : 'desactivado'} correctamente`,
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioActual = req.user;
    const id = Number(req.params.id);

    if (!usuarioActual?.permisos.includes(PERMISOS.USUARIOS)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar usuarios' });
    }

    const esAdmin = esUsuarioAdmin(usuarioActual);
    
    let usuario;

    if (esAdmin) {
      usuario = await prisma.usuarios.findUnique({ where: { id } });
    } else {
      usuario = await prisma.usuarios.findFirst({
        where: { id, sucursal_id: usuarioActual.sucursal_id }
      });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Evitar que se elimine a sí mismo
    if (usuario.id === usuarioActual.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const usuarioEliminado = await prisma.usuarios.delete({
      where: { id },
      include: {
        roles: true,
        sucursales: { select: { nombre: true } }
      }
    });

    return res.json({
      message: 'Usuario eliminado correctamente',
      usuario: usuarioEliminado
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};