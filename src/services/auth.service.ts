import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();

export const login = async (email: string, password: string) => {
  const user = await prisma.usuarios.findUnique({
    where: { email },
    include: {
      roles: true,
      sucursales: true,
    },
  });

  if (!user || !user.activo) throw new Error('Usuario no encontrado o inactivo');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Contraseña incorrecta');

  const ahoraUTC = new Date();
  const horaMexico = toZonedTime(ahoraUTC, 'America/Mexico_City');

  await prisma.usuarios.update({
    where: { id: user.id },
    data: { ultimo_acceso: ahoraUTC, fecha_actualizacion: ahoraUTC },
  });

  const permisos = Array.isArray(user.roles.permisos)
    ? user.roles.permisos
    : JSON.parse(String(user.roles.permisos || '[]'));

  const token = generateToken({
    id: user.id,
    rol: user.roles.nombre,
    rol_id: user.rol_id,
    sucursal_id: user.sucursal_id,
    permisos,
  });

  return {
    token,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      apellidos: user.apellidos,
      email: user.email,
      nombre_usuario: user.nombre_usuario,
      telefono: user.telefono,
      codigo_empleado: user.codigo_empleado,
      rol: user.roles.nombre,
      rol_id: user.rol_id,
      sucursal_id: user.sucursal_id,
      sucursal: user.sucursales.nombre,
      permisos,
      ultimo_acceso: horaMexico,
    },
  };
};

export const register = async (data: {
  nombre_usuario: string;
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  sucursal_id: number;
  rol_id: number;
  telefono?: string;
  codigo_empleado?: string;
}) => {
  const existeEmail = await prisma.usuarios.findUnique({ where: { email: data.email } });
  if (existeEmail) throw new Error('El correo electrónico ya está registrado');

  const hash = await bcrypt.hash(data.password, 10);

  const codigoEmpleado = data.codigo_empleado || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

  const nuevoUsuario = await prisma.usuarios.create({
    data: {
      nombre_usuario: data.nombre_usuario,
      email: data.email,
      password_hash: hash,
      nombre: data.nombre,
      apellidos: data.apellidos,
      sucursal_id: data.sucursal_id,
      rol_id: data.rol_id,
      telefono: data.telefono,
      codigo_empleado: codigoEmpleado,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
    },
    include: {
      roles: true,
      sucursales: true,
    },
  });

  const permisos = Array.isArray(nuevoUsuario.roles.permisos)
    ? nuevoUsuario.roles.permisos
    : JSON.parse(String(nuevoUsuario.roles.permisos || '[]'));

  const token = generateToken({
    id: nuevoUsuario.id,
    rol: nuevoUsuario.roles.nombre,
    rol_id: nuevoUsuario.rol_id,
    sucursal_id: nuevoUsuario.sucursal_id,
    permisos,
  });

  const ultimoAccesoMexico = nuevoUsuario.ultimo_acceso 
    ? toZonedTime(nuevoUsuario.ultimo_acceso, 'America/Mexico_City')
    : null;

  return {
    token,
    usuario: {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      apellidos: nuevoUsuario.apellidos,
      email: nuevoUsuario.email,
      nombre_usuario: nuevoUsuario.nombre_usuario,
      telefono: nuevoUsuario.telefono,
      codigo_empleado: nuevoUsuario.codigo_empleado,
      rol: nuevoUsuario.roles.nombre,
      rol_id: nuevoUsuario.rol_id,
      sucursal_id: nuevoUsuario.sucursal_id,
      sucursal: nuevoUsuario.sucursales.nombre,
      permisos,
      ultimo_acceso: ultimoAccesoMexico,
    },
  };
};
