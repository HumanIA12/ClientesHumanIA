<?php
require_once 'config/database.php';
$conn = getConnection();

$total_estudiantes = $conn->query("SELECT COUNT(*) as total FROM estudiantes WHERE activo = 1")->fetch_assoc()['total'];
$total_cursos = $conn->query("SELECT COUNT(*) as total FROM cursos WHERE activo = 1")->fetch_assoc()['total'];
$asistencias_hoy = $conn->query("SELECT COUNT(*) as total FROM asistencias WHERE fecha = CURDATE()")->fetch_assoc()['total'];

$conn->close();
?>
<?php include 'includes/header.php'; ?>

<h1>Panel Principal</h1>

<div class="cards">
    <div class="card">
        <h3>Estudiantes</h3>
        <p class="card-number"><?php echo $total_estudiantes; ?></p>
        <a href="/estudiantes.php" class="btn">Gestionar</a>
    </div>
    <div class="card">
        <h3>Cursos</h3>
        <p class="card-number"><?php echo $total_cursos; ?></p>
        <a href="/cursos.php" class="btn">Gestionar</a>
    </div>
    <div class="card">
        <h3>Asistencias Hoy</h3>
        <p class="card-number"><?php echo $asistencias_hoy; ?></p>
        <a href="/asistencia.php" class="btn">Tomar Asistencia</a>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
