import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface UsuarioActual {
  sucursal_id: number;
  permisos: string[];
}

// Función helper para verificar si el usuario es admin
const esAdmin = (usuarioActual: UsuarioActual): boolean => {
  return usuarioActual.permisos.includes('usuarios:admin');
};

export const obtenerUsuarios = async (usuarioActual: UsuarioActual) => {
  if (!usuarioActual.permisos.includes('usuarios')) {
    throw new Error('No autorizado');
  }

  // Los admins pueden ver usuarios de todas las sucursales
  const whereCondition = esAdmin(usuarioActual) 
    ? {} 
    : { sucursal_id: usuarioActual.sucursal_id };

  return prisma.usuarios.findMany({
    where: whereCondition,
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      nombre_usuario: true,
      email: true,
      activo: true,
      ultimo_acceso: true,
      roles: {
        select: {
          nombre: true
        }
      },
      sucursales: {
        select: {
          nombre: true
        }
      }
    },
    orderBy: { id: 'asc' }
  });
};

export const obtenerUsuarioPorId = async (id: number, usuarioActual: UsuarioActual) => {
  if (!usuarioActual.permisos.includes('usuarios')) {
    throw new Error('No autorizado');
  }

  // Los admins pueden ver cualquier usuario
  const whereCondition = esAdmin(usuarioActual)
    ? { id }
    : { id, sucursal_id: usuarioActual.sucursal_id };

  return prisma.usuarios.findFirst({
    where: whereCondition,
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      nombre_usuario: true,
      email: true,
      activo: true,
      ultimo_acceso: true,
      roles: {
        select: {
          nombre: true
        }
      },
      sucursales: {
        select: {
          nombre: true
        }
      }
    }
  });
};

export const crearUsuario = async (data: any, usuarioActual: UsuarioActual) => {
  if (!usuarioActual.permisos.includes('usuarios')) {
    throw new Error('No autorizado');
  }

  // Preparar datos del usuario
  let usuarioData = { ...data };

  if (esAdmin(usuarioActual)) {
    // Admin puede crear usuarios en cualquier sucursal
    // Si no se especifica sucursal_id, usar la del admin
    if (!usuarioData.sucursal_id) {
      usuarioData.sucursal_id = usuarioActual.sucursal_id;
    }
  } else {
    // Usuario normal solo puede crear en su sucursal
    usuarioData.sucursal_id = usuarioActual.sucursal_id;
    
    // Verificar que no esté intentando crear en otra sucursal
    if (data.sucursal_id && data.sucursal_id !== usuarioActual.sucursal_id) {
      throw new Error('No tienes permisos para crear usuarios en otra sucursal');
    }
  }

  return prisma.usuarios.create({
    data: usuarioData,
    include: {
      roles: true,
      sucursales: true
    }
  });
};

export const actualizarUsuario = async (id: number, data: any, usuarioActual: UsuarioActual) => {
  if (!usuarioActual.permisos.includes('usuarios')) {
    throw new Error('No autorizado');
  }

  let usuario;

  if (esAdmin(usuarioActual)) {
    // Admin puede actualizar cualquier usuario
    usuario = await prisma.usuarios.findUnique({
      where: { id }
    });
  } else {
    // Usuario normal solo puede actualizar usuarios de su sucursal
    usuario = await prisma.usuarios.findFirst({
      where: { id, sucursal_id: usuarioActual.sucursal_id }
    });
    
    // Verificar que no esté intentando cambiar la sucursal
    if (data.sucursal_id && data.sucursal_id !== usuarioActual.sucursal_id) {
      throw new Error('No tienes permisos para mover usuarios a otra sucursal');
    }
  }

  if (!usuario) {
    throw new Error('Usuario no encontrado o acceso denegado');
  }

  return prisma.usuarios.update({
    where: { id },
    data,
    include: {
      roles: true,
      sucursales: true
    }
  });
};

export const cambiarEstadoUsuario = async (id: number, usuarioActual: UsuarioActual) => {
  if (!usuarioActual.permisos.includes('usuarios')) {
    throw new Error('No autorizado');
  }

  let usuario;

  if (esAdmin(usuarioActual)) {
    // Admin puede cambiar estado de cualquier usuario
    usuario = await prisma.usuarios.findUnique({
      where: { id }
    });
  } else {
    // Usuario normal solo puede cambiar estado de usuarios de su sucursal
    usuario = await prisma.usuarios.findFirst({
      where: { id, sucursal_id: usuarioActual.sucursal_id }
    });
  }

  if (!usuario) {
    throw new Error('Usuario no encontrado o acceso denegado');
  }

  return prisma.usuarios.update({
    where: { id },
    data: { activo: !usuario.activo },
    include: {
      roles: true,
      sucursales: true
    }
  });
};

export const eliminarUsuario = async (id: number, usuarioActual: UsuarioActual) => {
  if (!usuarioActual.permisos.includes('usuarios')) {
    throw new Error('No autorizado');
  }

  let usuario;

  if (esAdmin(usuarioActual)) {
    // Admin puede eliminar cualquier usuario
    usuario = await prisma.usuarios.findUnique({
      where: { id }
    });
  } else {
    // Usuario normal solo puede eliminar usuarios de su sucursal
    usuario = await prisma.usuarios.findFirst({
      where: { id, sucursal_id: usuarioActual.sucursal_id }
    });
  }

  if (!usuario) {
    throw new Error('Usuario no encontrado o acceso denegado');
  }

  return prisma.usuarios.delete({
    where: { id }
  });
};