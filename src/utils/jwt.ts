import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  rol: string;
  rol_id: number;
  sucursal_id: number;
  permisos: string[];
}

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Token inválido');
  }
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '24h'
  });
};