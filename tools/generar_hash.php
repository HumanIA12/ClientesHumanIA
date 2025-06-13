<?php
/**
 * Herramienta para generar hashes de contraseñas
 * Útil para crear usuarios en la base de datos manualmente
 */

// Contraseña a hashear (puedes modificarla)
$password = "desarrolloweb";

// Generar un nuevo hash (se genera diferente cada vez)
$hash_nuevo = password_hash($password, PASSWORD_BCRYPT);

// Hash que ya está en la base de datos para todos los usuarios precargados
$hash_existente = '$2y$10$zFAG5GBNtf.5BpowMqZSputSi5PiGjGpzwsYERPxjIFLTIgX9sad2';

// Verificar que ambos funcionan para la misma contraseña
$verificacion1 = password_verify($password, $hash_nuevo) ? "CORRECTA" : "INCORRECTA";
$verificacion2 = password_verify($password, $hash_existente) ? "CORRECTA" : "INCORRECTA";

// Estilo HTML para mejor visualización en el navegador
echo "<html><head><title>Generador de Hashes</title>";
echo "<style>";
echo "body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }";
echo ".container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }";
echo "h1, h2 { color: #333; }";
echo "pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }";
echo ".success { color: green; font-weight: bold; }";
echo ".error { color: red; font-weight: bold; }";
echo ".divider { margin: 20px 0; border-top: 1px solid #eee; }";
echo ".note { font-style: italic; color: #666; }";
echo ".success-bg { background-color: #e8f5e9; padding: 10px; border-radius: 5px; margin: 10px 0; }";
echo "</style></head><body>";
echo "<div class='container'>";

echo "<h1>Generador de Hash de Contraseñas</h1>";
echo "<div class='divider'></div>";

echo "<h2>Contraseña Original</h2>";
echo "<pre>$password</pre>";

echo "<div class='divider'></div>";

echo "<h2>SOLUCIÓN AL PROBLEMA DE LOGIN</h2>";
echo "<div class='success-bg'>";
echo "<p>Usa este hash en la base de datos, que ya funciona con los usuarios precargados:</p>";
echo "<pre>$hash_existente</pre>";
echo "<p>Verificación: <span class='success'>$verificacion2</span></p>";
echo "</div>";

echo "<h2>Nuevo Hash Generado</h2>";
echo "<p>Este hash es único y se genera diferente cada vez:</p>";
echo "<pre>$hash_nuevo</pre>";
echo "<p>Verificación: <span class='success'>$verificacion1</span></p>";
echo "<p class='note'>Aunque ambos hashes son diferentes, los dos funcionan para la misma contraseña porque bcrypt incluye un 'salt' aleatorio en cada hash.</p>";

echo "<div class='divider'></div>";

echo "<h2>SQL para insertar un nuevo usuario</h2>";
echo "<p>Para mantener consistencia con los usuarios existentes, usa el hash fijo:</p>";
echo "<pre>INSERT INTO usuarios (nombre, apellidos, username, password, email, telefono, id_rol)\nVALUES ('Nombre', 'Apellidos', 'usuario', '$hash_existente', 'email@ejemplo.com', '123456789', 1);</pre>";

echo "<div class='divider'></div>";
echo "<p class='note'>Si deseas usar un hash nuevo y diferente para mayor seguridad:</p>";
echo "<pre>INSERT INTO usuarios (nombre, apellidos, username, password, email, telefono, id_rol)\nVALUES ('Nombre', 'Apellidos', 'usuario', '$hash_nuevo', 'email@ejemplo.com', '123456789', 1);</pre>";

echo "</div></body></html>";
?>
