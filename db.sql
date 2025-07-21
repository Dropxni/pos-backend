-- ================================
-- SISTEMA POS CREMERÍAS/ABARROTES
-- Base de Datos MySQL - Versión en Español
-- ================================

-- Configuración inicial
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ================================
-- TABLAS MAESTRAS
-- ================================

-- Sucursales/Tiendas
CREATE TABLE sucursales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    rfc VARCHAR(50), -- RFC en México
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sucursal_codigo (codigo),
    INDEX idx_sucursal_activo (activo)
);

-- Roles de usuario
CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSON, -- Array de permisos: ["ventas", "inventario", "reportes", "admin"]
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios/Empleados
CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT UNSIGNED NOT NULL,
    rol_id INT UNSIGNED NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    codigo_empleado VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_usuario_sucursal (sucursal_id),
    INDEX idx_usuario_activo (activo),
    INDEX idx_usuario_codigo_empleado (codigo_empleado)
);

-- Proveedores
CREATE TABLE proveedores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    nombre_contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    rfc VARCHAR(50),
    dias_credito INT DEFAULT 0, -- Días de crédito
    limite_credito DECIMAL(12,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_proveedor_codigo (codigo),
    INDEX idx_proveedor_activo (activo)
);

-- Categorías de productos
CREATE TABLE categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria_padre_id INT UNSIGNED NULL, -- Para subcategorías
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    requiere_refrigeracion BOOLEAN DEFAULT FALSE,
    requiere_control_caducidad BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_categoria_codigo (codigo),
    INDEX idx_categoria_padre (categoria_padre_id),
    INDEX idx_categoria_activo (activo)
);

-- ================================
-- PRODUCTOS E INVENTARIO
-- ================================

-- Catálogo de productos
CREATE TABLE productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT UNSIGNED NOT NULL,
    proveedor_id INT UNSIGNED NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    codigo_barras VARCHAR(50) NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    unidad_medida ENUM('pieza', 'kg', 'litro', 'metro') DEFAULT 'pieza',
    precio_venta DECIMAL(10,2) NOT NULL,
    precio_costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tasa_impuesto DECIMAL(5,2) DEFAULT 16.00, -- IVA México
    stock_minimo DECIMAL(10,3) DEFAULT 0.000,
    stock_maximo DECIMAL(10,3) DEFAULT 0.000,
    requiere_control_lote BOOLEAN DEFAULT FALSE,
    perecedero BOOLEAN DEFAULT FALSE,
    dias_vida_util INT NULL, -- Días de vida útil
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    INDEX idx_producto_sku (sku),
    INDEX idx_producto_codigo_barras (codigo_barras),
    INDEX idx_producto_categoria (categoria_id),
    INDEX idx_producto_activo (activo),
    INDEX idx_producto_nombre (nombre)
);

-- Control de lotes de inventario
CREATE TABLE lotes_inventario (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    fecha_caducidad DATE NULL,
    fecha_recepcion DATE NOT NULL,
    cantidad_inicial DECIMAL(10,3) NOT NULL,
    cantidad_actual DECIMAL(10,3) NOT NULL,
    precio_costo DECIMAL(10,2) NOT NULL,
    proveedor_id INT UNSIGNED NULL,
    orden_compra VARCHAR(50) NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    UNIQUE KEY uk_sucursal_producto_lote (sucursal_id, producto_id, numero_lote),
    INDEX idx_lote_caducidad (fecha_caducidad),
    INDEX idx_lote_producto (producto_id),
    INDEX idx_lote_sucursal (sucursal_id)
);

-- Movimientos de inventario
CREATE TABLE movimientos_inventario (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    lote_id INT UNSIGNED NULL,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'traspaso') NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    costo_unitario DECIMAL(10,2) DEFAULT 0.00,
    tipo_referencia ENUM('venta', 'compra', 'ajuste', 'traspaso', 'devolucion') NOT NULL,
    referencia_id INT UNSIGNED NULL, -- ID de la venta, compra, etc.
    notas TEXT,
    usuario_id INT UNSIGNED NOT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes_inventario(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_movimiento_sucursal (sucursal_id),
    INDEX idx_movimiento_producto (producto_id),
    INDEX idx_movimiento_fecha (fecha_movimiento),
    INDEX idx_movimiento_tipo (tipo_movimiento)
);
-- ================================
-- VENTAS Y TRANSACCIONES
-- ================================

-- Métodos de pago
CREATE TABLE metodos_pago (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    requiere_referencia BOOLEAN DEFAULT FALSE, -- Para tarjetas, transferencias
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cabecera de ventas
CREATE TABLE ventas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL, -- Cajero
    numero_ticket VARCHAR(20) NOT NULL, -- Número de ticket
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombre_cliente VARCHAR(100) NULL,
    rfc_cliente VARCHAR(50) NULL, -- Para facturación
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    importe_impuestos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    importe_descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estatus ENUM('pendiente', 'completada', 'cancelada', 'devuelta') DEFAULT 'completada',
    notas TEXT,
    
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_sucursal_ticket (sucursal_id, numero_ticket),
    INDEX idx_venta_fecha (fecha_venta),
    INDEX idx_venta_sucursal (sucursal_id),
    INDEX idx_venta_estatus (estatus)
);

-- Detalle de ventas
CREATE TABLE detalle_ventas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    venta_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    lote_id INT UNSIGNED NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    porcentaje_descuento DECIMAL(5,2) DEFAULT 0.00,
    tasa_impuesto DECIMAL(5,2) DEFAULT 16.00,
    total_linea DECIMAL(12,2) NOT NULL,
    
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes_inventario(id) ON DELETE SET NULL,
    INDEX idx_detalle_venta (venta_id),
    INDEX idx_detalle_producto (producto_id)
);

-- Pagos de ventas
CREATE TABLE pagos_ventas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    venta_id INT UNSIGNED NOT NULL,
    metodo_pago_id INT UNSIGNED NOT NULL,
    importe DECIMAL(12,2) NOT NULL,
    numero_referencia VARCHAR(100) NULL, -- Número de autorización, etc.
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE RESTRICT,
    INDEX idx_pago_venta (venta_id),
    INDEX idx_pago_metodo (metodo_pago_id)
);

-- ================================
-- COMPRAS
-- ================================

-- Encabezado de compras
CREATE TABLE compras (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT UNSIGNED NOT NULL,
    proveedor_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL, -- quien registró la compra
    numero_compra VARCHAR(50) NOT NULL,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    importe_impuestos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estatus ENUM('pendiente', 'recibida', 'cancelada') DEFAULT 'recibida',
    notas TEXT,
    
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_sucursal_compra (sucursal_id, numero_compra),
    INDEX idx_compra_fecha (fecha_compra),
    INDEX idx_compra_estatus (estatus)
);

-- Detalle de compras
CREATE TABLE detalle_compras (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    compra_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    lote_id INT UNSIGNED NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    tasa_impuesto DECIMAL(5,2) DEFAULT 16.00,
    total_linea DECIMAL(12,2) NOT NULL,
    
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes_inventario(id) ON DELETE SET NULL,
    INDEX idx_detalle_compra (compra_id),
    INDEX idx_detalle_compra_producto (producto_id)
);

-- ================================
-- CLIENTES
-- ================================

-- Tabla de clientes
CREATE TABLE clientes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    rfc VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    limite_credito DECIMAL(12,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cliente_codigo (codigo),
    INDEX idx_cliente_activo (activo)
);

-- ================================
-- SISTEMA DE CAJAS
-- ================================

-- Cajas registradoras
CREATE TABLE cajas_registradoras (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT UNSIGNED NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_sucursal_caja (sucursal_id, codigo),
    INDEX idx_caja_activo (activo)
);

-- Control de turnos de caja
CREATE TABLE turnos_caja (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    caja_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    monto_final DECIMAL(12,2) NULL,
    ventas_efectivo DECIMAL(12,2) DEFAULT 0.00,
    ventas_tarjeta DECIMAL(12,2) DEFAULT 0.00,
    ventas_otros DECIMAL(12,2) DEFAULT 0.00,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    estatus ENUM('abierto', 'cerrado') DEFAULT 'abierto',
    notas_apertura TEXT,
    notas_cierre TEXT,
    
    FOREIGN KEY (caja_id) REFERENCES cajas_registradoras(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_turno_caja (caja_id),
    INDEX idx_turno_usuario (usuario_id),
    INDEX idx_turno_fecha (fecha_apertura)
);

-- ================================
-- SISTEMA DE PROMOCIONES
-- ================================

-- Promociones
CREATE TABLE promociones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo ENUM('porcentaje', 'monto_fijo', 'compra_x_lleva_y', '2x1', '3x2') NOT NULL,
    valor_descuento DECIMAL(10,2) DEFAULT 0.00,
    porcentaje_descuento DECIMAL(5,2) DEFAULT 0.00,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    aplica_lunes BOOLEAN DEFAULT TRUE,
    aplica_martes BOOLEAN DEFAULT TRUE,
    aplica_miercoles BOOLEAN DEFAULT TRUE,
    aplica_jueves BOOLEAN DEFAULT TRUE,
    aplica_viernes BOOLEAN DEFAULT TRUE,
    aplica_sabado BOOLEAN DEFAULT TRUE,
    aplica_domingo BOOLEAN DEFAULT TRUE,
    monto_minimo DECIMAL(10,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_promocion_codigo (codigo),
    INDEX idx_promocion_fechas (fecha_inicio, fecha_fin),
    INDEX idx_promocion_activo (activo)
);

-- Productos incluidos en promociones
CREATE TABLE promociones_productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    categoria_id INT UNSIGNED NULL, -- Si aplica a toda una categoría
    
    FOREIGN KEY (promocion_id) REFERENCES promociones(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE KEY uk_promocion_producto (promocion_id, producto_id),
    INDEX idx_promo_producto (producto_id)
);

-- ================================
-- AUDITORÍA Y LOGS
-- ================================

-- Log de accesos y acciones
CREATE TABLE logs_acceso (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    accion VARCHAR(100) NOT NULL, -- Ej. login, logout, registro_venta, cancelacion_venta
    descripcion TEXT,
    ip_address VARCHAR(45), -- Para IPv6
    user_agent TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_log_usuario (usuario_id),
    INDEX idx_log_accion (accion),
    INDEX idx_log_fecha (fecha_creacion)
);

-- ================================
-- VISTAS PARA REPORTES
-- ================================

-- Vista para resumen de ventas por día
CREATE VIEW vista_ventas_diarias AS
SELECT 
    DATE(fecha_venta) AS fecha,
    sucursal_id,
    COUNT(*) AS total_tickets,
    SUM(subtotal) AS subtotal_total,
    SUM(importe_impuestos) AS impuestos_total,
    SUM(importe_descuento) AS descuentos_total,
    SUM(total) AS venta_total,
    AVG(total) AS ticket_promedio
FROM ventas
WHERE estatus = 'completada'
GROUP BY DATE(fecha_venta), sucursal_id;

-- Vista para productos más vendidos
CREATE VIEW vista_productos_vendidos AS
SELECT 
    p.id,
    p.nombre,
    p.sku,
    c.nombre as categoria,
    SUM(dv.cantidad) AS cantidad_vendida,
    SUM(dv.total_linea) AS venta_total,
    COUNT(DISTINCT dv.venta_id) AS numero_transacciones
FROM productos p
JOIN detalle_ventas dv ON p.id = dv.producto_id
JOIN ventas v ON dv.venta_id = v.id
JOIN categorias c ON p.categoria_id = c.id
WHERE v.estatus = 'completada'
GROUP BY p.id, p.nombre, p.sku, c.nombre;

-- Vista para control de inventario
CREATE VIEW vista_inventario_actual AS
SELECT 
    p.id AS producto_id,
    p.nombre,
    p.sku,
    c.nombre AS categoria,
    li.sucursal_id,
    SUM(li.cantidad_actual) AS stock_actual,
    p.stock_minimo,
    p.stock_maximo,
    CASE 
        WHEN SUM(li.cantidad_actual) <= p.stock_minimo THEN 'CRÍTICO'
        WHEN SUM(li.cantidad_actual) <= (p.stock_minimo * 1.5) THEN 'BAJO'
        ELSE 'NORMAL'
    END AS estado_stock
FROM productos p
LEFT JOIN lotes_inventario li ON p.id = li.producto_id AND li.activo = TRUE
JOIN categorias c ON p.categoria_id = c.id
WHERE p.activo = TRUE
GROUP BY p.id, p.nombre, p.sku, c.nombre, li.sucursal_id, p.stock_minimo, p.stock_maximo;

-- ================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ================================

-- Para reportes de ventas por período
CREATE INDEX idx_ventas_fecha_sucursal ON ventas(fecha_venta, sucursal_id, estatus);

-- Para control rápido de inventario
CREATE INDEX idx_inventario_producto_sucursal ON lotes_inventario(producto_id, sucursal_id, activo);

-- Para búsqueda rápida de productos
CREATE INDEX idx_productos_busqueda ON productos(nombre, sku, codigo_barras);

-- Para movimientos de inventario por fecha
CREATE INDEX idx_movimientos_fecha_tipo ON movimientos_inventario(fecha_movimiento, tipo_movimiento, sucursal_id);

-- Para reportes de compras
CREATE INDEX idx_compras_fecha_proveedor ON compras(fecha_compra, proveedor_id, estatus);

-- Para análisis de turnos
CREATE INDEX idx_turnos_fecha_caja ON turnos_caja(fecha_apertura, caja_id, estatus);

-- ================================
-- DATOS INICIALES
-- ================================

-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('administrador', 'Administrador del sistema', '["ventas", "inventario", "reportes", "admin", "usuarios"]'),
('gerente', 'Gerente de tienda', '["ventas", "inventario", "reportes", "turnos"]'),
('cajero', 'Cajero/Vendedor', '["ventas"]'),
('almacenista', 'Encargado de inventario', '["inventario", "reportes"]');

-- Insertar métodos de pago básicos
INSERT INTO metodos_pago (codigo, nombre, requiere_referencia) VALUES
('efectivo', 'Efectivo', FALSE),
('tarjeta', 'Tarjeta de Débito/Crédito', TRUE),
('transferencia', 'Transferencia Bancaria', TRUE),
('cheque', 'Cheque', TRUE),
('vales', 'Vales de Despensa', TRUE);

-- Insertar categorías básicas para cremería/abarrotes
INSERT INTO categorias (codigo, nombre, requiere_refrigeracion, requiere_control_caducidad) VALUES
('lacteos', 'Lácteos y Derivados', TRUE, TRUE),
('carnes', 'Carnes y Embutidos', TRUE, TRUE),
('abarrotes', 'Abarrotes Secos', FALSE, FALSE),
('bebidas', 'Bebidas y Refrescos', FALSE, TRUE),
('limpieza', 'Productos de Limpieza', FALSE, FALSE),
('panaderia', 'Panadería y Repostería', FALSE, TRUE),
('frutas', 'Frutas y Verduras', TRUE, TRUE),
('congelados', 'Productos Congelados', TRUE, TRUE),
('botanas', 'Botanas y Dulces', FALSE, TRUE),
('higiene', 'Higiene Personal', FALSE, FALSE);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;