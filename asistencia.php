<?php
require_once 'config/database.php';
$conn = getConnection();

$mensaje = '';

// Guardar asistencia
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['asistencia'])) {
    $curso_id = (int)$_POST['curso_id'];
    $fecha = $conn->real_escape_string($_POST['fecha']);

    $stmt = $conn->prepare("INSERT INTO asistencias (estudiante_id, curso_id, fecha, estado, observacion) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE estado = VALUES(estado), observacion = VALUES(observacion)");

    $guardados = 0;
    foreach ($_POST['asistencia'] as $estudiante_id => $estado) {
        $est_id = (int)$estudiante_id;
        $est_estado = $conn->real_escape_string($estado);
        $observacion = isset($_POST['observacion'][$estudiante_id]) ? $conn->real_escape_string(trim($_POST['observacion'][$estudiante_id])) : '';

        $stmt->bind_param("iisss", $est_id, $curso_id, $fecha, $est_estado, $observacion);
        if ($stmt->execute()) {
            $guardados++;
        }
    }
    $stmt->close();
    $mensaje = '<div class="alert success">Se registraron ' . $guardados . ' asistencias correctamente.</div>';
}

// Obtener datos para filtros
$niveles = $conn->query("SELECT * FROM niveles ORDER BY id");
$grados_result = $conn->query("SELECT g.*, n.nombre as nivel FROM grados g JOIN niveles n ON g.nivel_id = n.id ORDER BY g.nivel_id, g.numero");
$secciones = $conn->query("SELECT * FROM secciones ORDER BY id");
$cursos_result = $conn->query("SELECT c.*, n.nombre as nivel FROM cursos c JOIN niveles n ON c.nivel_id = n.id WHERE c.activo = 1 ORDER BY n.nombre, c.nombre");

$grados_arr = [];
while ($g = $grados_result->fetch_assoc()) $grados_arr[] = $g;

$cursos_arr = [];
while ($c = $cursos_result->fetch_assoc()) $cursos_arr[] = $c;

// Cargar estudiantes si hay filtros seleccionados
$estudiantes = [];
$asistencias_existentes = [];
$sel_nivel = isset($_GET['nivel_id']) ? (int)$_GET['nivel_id'] : 0;
$sel_grado = isset($_GET['grado_id']) ? (int)$_GET['grado_id'] : 0;
$sel_seccion = isset($_GET['seccion_id']) ? (int)$_GET['seccion_id'] : 0;
$sel_curso = isset($_GET['curso_id']) ? (int)$_GET['curso_id'] : 0;
$sel_fecha = isset($_GET['fecha']) ? $_GET['fecha'] : date('Y-m-d');

if ($sel_nivel > 0 && $sel_grado > 0 && $sel_seccion > 0 && $sel_curso > 0) {
    $stmt = $conn->prepare("SELECT * FROM estudiantes WHERE nivel_id = ? AND grado_id = ? AND seccion_id = ? AND activo = 1 ORDER BY apellidos, nombres");
    $stmt->bind_param("iii", $sel_nivel, $sel_grado, $sel_seccion);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($e = $result->fetch_assoc()) {
        $estudiantes[] = $e;
    }
    $stmt->close();

    // Cargar asistencias existentes para esa fecha y curso
    if (count($estudiantes) > 0) {
        $fecha_esc = $conn->real_escape_string($sel_fecha);
        $result = $conn->query("SELECT * FROM asistencias WHERE curso_id = $sel_curso AND fecha = '$fecha_esc'");
        while ($a = $result->fetch_assoc()) {
            $asistencias_existentes[$a['estudiante_id']] = $a;
        }
    }
}
?>
<?php include 'includes/header.php'; ?>

<h1>Tomar Asistencia</h1>

<?php echo $mensaje; ?>

<div class="filtros">
    <form method="GET" class="form-inline" id="filtroForm">
        <div class="form-group">
            <label>Fecha:</label>
            <input type="date" name="fecha" value="<?php echo htmlspecialchars($sel_fecha); ?>" onchange="this.form.submit()">
        </div>
        <div class="form-group">
            <label>Nivel:</label>
            <select name="nivel_id" id="filtro_nivel" onchange="filtrarGradosCursos(); this.form.submit()">
                <option value="0">Seleccione</option>
                <?php
                $niveles->data_seek(0);
                while ($n = $niveles->fetch_assoc()): ?>
                    <option value="<?php echo $n['id']; ?>" <?php echo $sel_nivel == $n['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($n['nombre']); ?>
                    </option>
                <?php endwhile; ?>
            </select>
        </div>
        <div class="form-group">
            <label>Grado:</label>
            <select name="grado_id" id="filtro_grado" onchange="this.form.submit()">
                <option value="0">Seleccione</option>
                <?php foreach ($grados_arr as $g): ?>
                    <?php if ($sel_nivel == 0 || $sel_nivel == $g['nivel_id']): ?>
                    <option value="<?php echo $g['id']; ?>" <?php echo $sel_grado == $g['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($g['nombre']); ?>
                    </option>
                    <?php endif; ?>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="form-group">
            <label>Sección:</label>
            <select name="seccion_id" id="filtro_seccion" onchange="this.form.submit()">
                <option value="0">Seleccione</option>
                <?php
                $secciones->data_seek(0);
                while ($s = $secciones->fetch_assoc()): ?>
                    <option value="<?php echo $s['id']; ?>" <?php echo $sel_seccion == $s['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($s['nombre']); ?>
                    </option>
                <?php endwhile; ?>
            </select>
        </div>
        <div class="form-group">
            <label>Curso:</label>
            <select name="curso_id" id="filtro_curso" onchange="this.form.submit()">
                <option value="0">Seleccione</option>
                <?php foreach ($cursos_arr as $c): ?>
                    <?php if ($sel_nivel == 0 || $sel_nivel == $c['nivel_id']): ?>
                    <option value="<?php echo $c['id']; ?>" <?php echo $sel_curso == $c['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($c['nombre']); ?>
                    </option>
                    <?php endif; ?>
                <?php endforeach; ?>
            </select>
        </div>
    </form>
</div>

<?php if (count($estudiantes) > 0): ?>
<form method="POST">
    <input type="hidden" name="curso_id" value="<?php echo $sel_curso; ?>">
    <input type="hidden" name="fecha" value="<?php echo htmlspecialchars($sel_fecha); ?>">

    <div class="asistencia-actions">
        <button type="button" class="btn btn-sm" onclick="marcarTodos('Asistió')">Todos Asistieron</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="marcarTodos('Faltó')">Todos Faltaron</button>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>#</th>
                <th>Apellidos y Nombres</th>
                <th>Asistió</th>
                <th>Faltó</th>
                <th>Tardanza</th>
                <th>Observación</th>
            </tr>
        </thead>
        <tbody>
            <?php $i = 1; foreach ($estudiantes as $e):
                $estado_actual = isset($asistencias_existentes[$e['id']]) ? $asistencias_existentes[$e['id']]['estado'] : '';
                $obs_actual = isset($asistencias_existentes[$e['id']]) ? $asistencias_existentes[$e['id']]['observacion'] : '';
            ?>
            <tr>
                <td><?php echo $i++; ?></td>
                <td><?php echo htmlspecialchars($e['apellidos'] . ', ' . $e['nombres']); ?></td>
                <td class="text-center">
                    <input type="radio" name="asistencia[<?php echo $e['id']; ?>]" value="Asistió"
                        <?php echo $estado_actual === 'Asistió' ? 'checked' : ''; ?> required>
                </td>
                <td class="text-center">
                    <input type="radio" name="asistencia[<?php echo $e['id']; ?>]" value="Faltó"
                        <?php echo $estado_actual === 'Faltó' ? 'checked' : ''; ?>>
                </td>
                <td class="text-center">
                    <input type="radio" name="asistencia[<?php echo $e['id']; ?>]" value="Tardanza"
                        <?php echo $estado_actual === 'Tardanza' ? 'checked' : ''; ?>>
                </td>
                <td>
                    <input type="text" name="observacion[<?php echo $e['id']; ?>]"
                        value="<?php echo htmlspecialchars($obs_actual); ?>" class="input-obs">
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <button type="submit" class="btn btn-lg">Guardar Asistencia</button>
</form>
<?php elseif ($sel_nivel > 0 && $sel_grado > 0 && $sel_seccion > 0 && $sel_curso > 0): ?>
    <div class="alert info">No se encontraron estudiantes con los filtros seleccionados.</div>
<?php else: ?>
    <div class="alert info">Seleccione nivel, grado, sección y curso para tomar la asistencia.</div>
<?php endif; ?>

<script>
var grados = <?php echo json_encode($grados_arr); ?>;
var cursos = <?php echo json_encode($cursos_arr); ?>;

function filtrarGradosCursos() {
    var nivelId = document.getElementById('filtro_nivel').value;
    var selectGrado = document.getElementById('filtro_grado');
    var selectCurso = document.getElementById('filtro_curso');

    selectGrado.innerHTML = '<option value="0">Seleccione</option>';
    grados.forEach(function(g) {
        if (g.nivel_id == nivelId) {
            var opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.nombre;
            selectGrado.appendChild(opt);
        }
    });

    selectCurso.innerHTML = '<option value="0">Seleccione</option>';
    cursos.forEach(function(c) {
        if (c.nivel_id == nivelId) {
            var opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            selectCurso.appendChild(opt);
        }
    });
}

function marcarTodos(estado) {
    var radios = document.querySelectorAll('input[type="radio"][value="' + estado + '"]');
    radios.forEach(function(r) { r.checked = true; });
}
</script>

<?php
$conn->close();
include 'includes/footer.php';
?>
