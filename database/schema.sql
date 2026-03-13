-- Sistema de Asistencia Escolar
-- Base de datos: asistencia_escolar

CREATE DATABASE IF NOT EXISTS asistencia_escolar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE asistencia_escolar;

-- Tabla de niveles educativos
CREATE TABLE niveles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO niveles (nombre) VALUES ('Primaria'), ('Secundaria');

-- Tabla de grados
CREATE TABLE grados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nivel_id INT NOT NULL,
    numero INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    FOREIGN KEY (nivel_id) REFERENCES niveles(id),
    UNIQUE KEY uk_nivel_numero (nivel_id, numero)
) ENGINE=InnoDB;

-- Primaria: 1ro a 6to
INSERT INTO grados (nivel_id, numero, nombre) VALUES
(1, 1, 'Primero'), (1, 2, 'Segundo'), (1, 3, 'Tercero'),
(1, 4, 'Cuarto'), (1, 5, 'Quinto'), (1, 6, 'Sexto');

-- Secundaria: 1ro a 5to
INSERT INTO grados (nivel_id, numero, nombre) VALUES
(2, 1, 'Primero'), (2, 2, 'Segundo'), (2, 3, 'Tercero'),
(2, 4, 'Cuarto'), (2, 5, 'Quinto');

-- Tabla de secciones
CREATE TABLE secciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(10) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO secciones (nombre) VALUES ('A'), ('B'), ('C'), ('Única');

-- Tabla de cursos (materias)
CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nivel_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (nivel_id) REFERENCES niveles(id)
) ENGINE=InnoDB;

INSERT INTO cursos (nombre, nivel_id) VALUES
('Matemática', 1), ('Comunicación', 1), ('Ciencia y Tecnología', 1),
('Personal Social', 1), ('Arte y Cultura', 1), ('Educación Física', 1),
('Educación Religiosa', 1), ('Inglés', 1),
('Matemática', 2), ('Comunicación', 2), ('Ciencia y Tecnología', 2),
('Ciencias Sociales', 2), ('Arte y Cultura', 2), ('Educación Física', 2),
('Educación Religiosa', 2), ('Inglés', 2), ('Educación para el Trabajo', 2);

-- Tabla de estudiantes
CREATE TABLE estudiantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(15) NOT NULL UNIQUE,
    apellidos VARCHAR(100) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    nivel_id INT NOT NULL,
    grado_id INT NOT NULL,
    seccion_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nivel_id) REFERENCES niveles(id),
    FOREIGN KEY (grado_id) REFERENCES grados(id),
    FOREIGN KEY (seccion_id) REFERENCES secciones(id)
) ENGINE=InnoDB;

-- Tabla de asistencias
CREATE TABLE asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha DATE NOT NULL,
    estado ENUM('Asistió', 'Faltó', 'Tardanza') NOT NULL,
    observacion TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    UNIQUE KEY uk_asistencia (estudiante_id, curso_id, fecha)
) ENGINE=InnoDB;
