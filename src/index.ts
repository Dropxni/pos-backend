import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import { authMiddleware } from './middlewares/auth.middleware';
import productoRoutes from './routes/producto.routes';
import inventarioRoutes from './routes/inventario.routes';
import ventasRoutes from './routes/ventas.routes';
import compraRoutes from './routes/compra.routes';
import usuarioRoutes from './routes/usuario.routes';
import rolRoutes from './routes/rol.routes';
import sucursalRoutes from './routes/sucursal.routes';
import categoriaRoutes from './routes/categoria.routes';
import proveedorRoutes from './routes/proveedor.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Rutas públicas
app.use('/api/auth', authRoutes);

// Productos
app.use('/api/productos', productoRoutes);

// Inventario
app.use('/api/inventario', inventarioRoutes);

// Ventas
app.use('/api/ventas', ventasRoutes);

// Compra
app.use('/api/compras', compraRoutes);

// Usuarios
app.use('/api/usuarios', usuarioRoutes);

// Roles
app.use('/api/roles', rolRoutes);

// Sucursales
app.use('/api/sucursales', sucursalRoutes);

// Categorías
app.use('/api/categorias', categoriaRoutes);

// Proveedores
app.use('/api/proveedores', proveedorRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});