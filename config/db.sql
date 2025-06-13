-- Script SQL para crear la base de datos de Frutale y sus tablas
-- Ejecutar este script en MySQL para configurar la base de datos completa

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS frutale;

-- Seleccionar la base de datos
USE frutale;

-- Tablas para campos finitos

-- Tabla ciudades
CREATE TABLE IF NOT EXISTS ciudades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla tipos_vehiculo
CREATE TABLE IF NOT EXISTS tipos_vehiculo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tiene_refrigeracion BOOLEAN NOT NULL DEFAULT FALSE,
    temperatura_minima DECIMAL(5,2) NULL,
    capacidad_maxima DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Tabla empresas_transporte
CREATE TABLE IF NOT EXISTS empresas_transporte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    id_rol INT NOT NULL,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id)
);

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    direccion TEXT NOT NULL,
    id_ciudad INT NOT NULL,
    codigo_postal VARCHAR(10),
    notas TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_ciudad) REFERENCES ciudades(id)
);

-- Tabla transportistas
CREATE TABLE IF NOT EXISTS transportistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_empresa INT NOT NULL,
    licencia VARCHAR(50),
    id_tipo_vehiculo INT NOT NULL,
    capacidad_carga DECIMAL(10,2),
    zona_cobertura TEXT,
    tarifa_base DECIMAL(10,2) NOT NULL DEFAULT 0,
    disponibilidad ENUM('disponible', 'en ruta', 'no disponible') DEFAULT 'disponible',
    tiene_gps BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_empresa) REFERENCES empresas_transporte(id),
    FOREIGN KEY (id_tipo_vehiculo) REFERENCES tipos_vehiculo(id)
);



-- Tabla productos (Jugos naturales)
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    estado ENUM('disponible', 'agotado', 'descontinuado') DEFAULT 'disponible',
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_transportista INT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATETIME,
    estado ENUM('pendiente', 'confirmado', 'preparando', 'en_camino', 'entregado', 'cancelado') DEFAULT 'pendiente',
    total DECIMAL(10,2) NOT NULL,
    costo_transporte DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_facturado DECIMAL(10,2) NOT NULL DEFAULT 0,
    direccion_entrega TEXT,
    id_ciudad_entrega INT NOT NULL,
    refrigeracion_requerida BOOLEAN NOT NULL DEFAULT TRUE,
    temperatura_requerida DECIMAL(5,2) NULL,
    tiene_tracking BOOLEAN NOT NULL DEFAULT FALSE,
    link_tracking VARCHAR(255) NULL,
    notas TEXT,
    metodo_pago ENUM('efectivo', 'transferencia', 'yape', 'plin') DEFAULT 'efectivo',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
    FOREIGN KEY (id_transportista) REFERENCES transportistas(id),
    FOREIGN KEY (id_ciudad_entrega) REFERENCES ciudades(id)
);

-- Tabla detalles_pedido
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_producto INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

-- Tabla historial_estados
CREATE TABLE IF NOT EXISTS historial_estados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    estado_anterior ENUM('pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado'),
    estado_nuevo ENUM('pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado'),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT,
    comentario TEXT,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- Tabla rutas_entrega
CREATE TABLE IF NOT EXISTS rutas_entrega (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_transportista INT,
    fecha_ruta DATE,
    estado ENUM('planificada', 'en_progreso', 'completada', 'cancelada') DEFAULT 'planificada',
    kilometros_totales DECIMAL(10,2),
    hora_inicio TIME,
    hora_fin TIME,
    temperatura_promedio DECIMAL(5,2) NULL,
    link_tracking_gps VARCHAR(255) NULL,
    tiempo_estimado_minutos INT DEFAULT 0,
    FOREIGN KEY (id_transportista) REFERENCES transportistas(id)
);

-- Tabla pedidos_en_ruta
CREATE TABLE IF NOT EXISTS pedidos_en_ruta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ruta INT,
    id_pedido INT,
    orden_entrega INT,
    estado ENUM('pendiente', 'entregado', 'no_entregado') DEFAULT 'pendiente',
    hora_entrega TIME,
    temperatura_entrega DECIMAL(5,2) NULL,
    conformidad_cliente BOOLEAN NULL,
    motivo_inconformidad TEXT NULL,
    coordenadas_gps VARCHAR(100) NULL,
    comentarios TEXT,
    FOREIGN KEY (id_ruta) REFERENCES rutas_entrega(id) ON DELETE CASCADE,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id)
);

-- Tabla reportes
CREATE TABLE IF NOT EXISTS reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    tipo ENUM('ventas', 'inventario', 'transportistas', 'clientes', 'personalizado') NOT NULL,
    descripcion TEXT,
    criterios TEXT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- Insertar datos iniciales para las tablas de catálogos

-- Insertar ciudades peruanas
INSERT INTO ciudades (nombre) VALUES 
('Chiclayo'),
('Piura'),
('Trujillo'),
('Lima'),
('Cajamarca');

-- Insertar roles
INSERT INTO roles (nombre) VALUES 
('admin'),
('cliente'),
('transportista');

-- Insertar tipos de vehículo
INSERT INTO tipos_vehiculo (nombre, tiene_refrigeracion, temperatura_minima, capacidad_maxima) VALUES 
('Camioneta refrigerada', TRUE, 2.0, 1500.00),
('Camión refrigerado pequeño', TRUE, 2.0, 2500.00),
('Camión refrigerado mediano', TRUE, 2.0, 5000.00),
('Motocicleta con caja refrigerada', TRUE, 4.0, 50.00),
('Camión estándar', FALSE, NULL, 3000.00);

-- Insertar empresas de transporte
INSERT INTO empresas_transporte (nombre, direccion, telefono, email) VALUES
('TransFrío Perú', 'Av. Balta 1250, Chiclayo', '074234567', 'info@transfrio.com.pe'),
('Refrigerados del Norte', 'Calle Los Laureles 456, Piura', '073987654', 'contacto@refrigeradosnorte.pe'),
('LogisFresh', 'Av. Bolívar 789, Trujillo', '044765432', 'ventas@logisfresh.com.pe');

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, apellidos, username, password, email, telefono, id_rol) 
VALUES ('Administrador', 'Sistema', 'admin', '$2y$10$zFAG5GBNtf.5BpowMqZSputSi5PiGjGpzwsYERPxjIFLTIgX9sad2', 'admin@frutale.com', '5555555555', 1)
ON DUPLICATE KEY UPDATE id = id;
-- Contraseña: 12345678 (hash generado con password_hash)

-- Insertar algunos datos de ejemplo

-- Clientes (Cafeterías)
INSERT INTO usuarios (nombre, apellidos, username, password, email, telefono, id_rol) VALUES
('Juan', 'Pérez Mendoza', 'cafetuccino', '$2y$10$zFAG5GBNtf.5BpowMqZSputSi5PiGjGpzwsYERPxjIFLTIgX9sad2', 'juan@cafetuccino.pe', '974123456', 2),
('María', 'Gómez Ruiz', 'cafedelicia', '$2y$10$zFAG5GBNtf.5BpowMqZSputSi5PiGjGpzwsYERPxjIFLTIgX9sad2', 'maria@cafedelicia.pe', '973987654', 2);

INSERT INTO clientes (id_usuario, direccion, id_ciudad, codigo_postal) VALUES
(2, 'Av. Santa Victoria 325', 1, '14001'),
(3, 'Jr. Libertad 780', 3, '13007');

-- Transportistas
INSERT INTO usuarios (nombre, apellidos, username, password, email, telefono, id_rol) VALUES
('Carlos', 'Rodríguez', 'carlosrodriguez', '$2y$10$zFAG5GBNtf.5BpowMqZSputSi5PiGjGpzwsYERPxjIFLTIgX9sad2', 'carlos@transfrio.com.pe', '974234567', 3),
('Ana', 'Martínez', 'anamartinez', '$2y$10$zFAG5GBNtf.5BpowMqZSputSi5PiGjGpzwsYERPxjIFLTIgX9sad2', 'ana@refrigeradosnorte.pe', '973987654', 3);

INSERT INTO transportistas (id_usuario, id_empresa, licencia, id_tipo_vehiculo, capacidad_carga, zona_cobertura, tarifa_base, tiene_gps) VALUES
(4, 1, 'Q-45782', 1, 1200.00, 'Chiclayo, Piura, Trujillo', 120.00, TRUE),
(5, 2, 'P-78901', 3, 2800.00, 'Chiclayo, Piura, Cajamarca', 150.00, TRUE);

-- Productos (Jugos naturales de Frutale)
INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
('Jugo de Naranja Clásico', 'Jugo de naranja 100% natural sin preservantes ni azúcares añadidos', 15.00, 80),
('Naranja con Zanahoria', 'Jugo de naranja con zanahoria recién exprimido, sin preservantes', 16.50, 65),
('Naranja con Piña', 'Mezcla refrescante de naranja con piña, 100% natural', 17.00, 60),
('Naranja Especial', 'Jugo de naranja con un toque de miel de abeja', 18.00, 70),
('Naranja con Fresa', 'Jugo de naranja con fresas frescas, sin azúcares añadidos', 17.50, 55),
('Naranja Detox', 'Jugo de naranja con apio y jengibre, ideal para desintoxicar', 19.00, 45);
