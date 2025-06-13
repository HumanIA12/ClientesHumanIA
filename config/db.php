<?php
/**
 * Archivo de configuración de la base de datos para Frutale
 * Este archivo solo se encarga de la conexión a la base de datos.
 * La creación de tablas se realiza con el script bd.sql
 */

// Configuración de la base de datos
$host = 'localhost';
$usuario = 'root';
$contrasena = '';
$db_nombre = 'frutale';

// Crear conexión
$conexion = new mysqli($host, $usuario, $contrasena, $db_nombre);

// Verificar conexión
if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

// Establecer el juego de caracteres
$conexion->set_charset("utf8mb4");

// Devolver la conexión para uso posterior
return $conexion;
?>
