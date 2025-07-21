import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    return;
  }

  try {
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { nombre_usuario, email, password, nombre, apellidos, sucursal_id, rol_id, telefono, codigo_empleado } = req.body;

  if (!nombre_usuario || !email || !password || !nombre || !apellidos || !sucursal_id || !rol_id) {
    res.status(400).json({ error: 'Todos los campos obligatorios deben estar completos.' });
    return;
  }

  try {
    const result = await AuthService.register({
      nombre_usuario,
      email,
      password,
      nombre,
      apellidos,
      sucursal_id,
      rol_id,
      telefono,
      codigo_empleado,
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
