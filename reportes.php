<?php
require_once 'config/database.php';
$conn = getConnection();

$niveles = $conn->query("SELECT * FROM niveles ORDER BY id");
$grados_result = $conn->query("SELECT g.*, n.nombre as nivel FROM grados g JOIN niveles n ON g.nivel_id = n.id ORDER BY g.nivel_id, g.numero");
$secciones = $conn->query("SELECT * FROM secciones ORDER BY id");
$cursos_result = $conn->query("SELECT c.*, n.nombre as nivel FROM cursos c JOIN niveles n ON c.nivel_id = n.id WHERE c.activo = 1 ORDER BY n.nombre, c.nombre");

$grados_arr = [];
while ($g = $grados_result->fetch_assoc()) $grados_arr[] = $g;
$cursos_arr = [];
while ($c = $cursos_result->fetch_assoc()) $cursos_arr[] = $c;

// Filtros
$sel_nivel = isset($_GET['nivel_id']) ? (int)$_GET['nivel_id'] : 0;
$sel_grado = isset($_GET['grado_id']) ? (int)$_GET['grado_id'] : 0;
$sel_seccion = isset($_GET['seccion_id']) ? (int)$_GET['seccion_id'] : 0;
$sel_curso = isset($_GET['curso_id']) ? (int)$_GET['curso_id'] : 0;
$fecha_inicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : date('Y-m-01');
$fecha_fin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : date('Y-m-d');

$reporte = [];
if ($sel_nivel > 0 && $sel_grado > 0 && $sel_seccion > 0) {
    $where_curso = $sel_curso > 0 ? "AND a.curso_id = $sel_curso" : "";
    $fecha_inicio_esc = $conn->real_escape_string($fecha_inicio);
    $fecha_fin_esc = $conn->real_escape_string($fecha_fin);

    $sql = "
        SELECT e.id, e.apellidos, e.nombres, e.dni,
            SUM(CASE WHEN a.estado = 'Asistió' THEN 1 ELSE 0 END) as asistencias,
            SUM(CASE WHEN a.estado = 'Faltó' THEN 1 ELSE 0 END) as faltas,
            SUM(CASE WHEN a.estado = 'Tardanza' THEN 1 ELSE 0 END) as tardanzas,
            COUNT(a.id) as total
        FROM estudiantes e
        LEFT JOIN asistencias a ON e.id = a.estudiante_id
            AND a.fecha BETWEEN '$fecha_inicio_esc' AND '$fecha_fin_esc'
            $where_curso
        WHERE e.nivel_id = $sel_nivel AND e.grado_id = $sel_grado AND e.seccion_id = $sel_seccion AND e.activo = 1
        GROUP BY e.id, e.apellidos, e.nombres, e.dni
        ORDER BY e.apellidos, e.nombres
    ";

    $result = $conn->query($sql);
    while ($r = $result->fetch_assoc()) {
        $reporte[] = $r;
    }

    // Detalle por fecha
    $detalle = [];
    if ($sel_curso > 0) {
        $sql_detalle = "
            SELECT a.fecha, a.estado, a.observacion, a.estudiante_id, c.nombre as curso
            FROM asistencias a
            JOIN cursos c ON a.curso_id = c.id
            WHERE a.curso_id = $sel_curso
            AND a.fecha BETWEEN '$fecha_inicio_esc' AND '$fecha_fin_esc'
            AND a.estudiante_id IN (SELECT id FROM estudiantes WHERE nivel_id = $sel_nivel AND grado_id = $sel_grado AND seccion_id = $sel_seccion AND activo = 1)
            ORDER BY a.fecha
        ";
        $result_detalle = $conn->query($sql_detalle);
        while ($d = $result_detalle->fetch_assoc()) {
            $detalle[$d['estudiante_id']][$d['fecha']] = $d;
        }
    }
}
?>
<?php include 'includes/header.php'; ?>

<h1>Reportes de Asistencia</h1>

<div class="filtros">
    <form method="GET" class="form-inline">
        <div class="form-group">
            <label>Fecha Inicio:</label>
            <input type="date" name="fecha_inicio" value="<?php echo htmlspecialchars($fecha_inicio); ?>">
        </div>
        <div class="form-group">
            <label>Fecha Fin:</label>
            <input type="date" name="fecha_fin" value="<?php echo htmlspecialchars($fecha_fin); ?>">
        </div>
        <div class="form-group">
            <label>Nivel:</label>
            <select name="nivel_id" id="filtro_nivel" onchange="filtrarGradosCursos()">
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
            <select name="grado_id" id="filtro_grado">
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
            <select name="seccion_id" id="filtro_seccion">
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
            <select name="curso_id" id="filtro_curso">
                <option value="0">Todos los cursos</option>
                <?php foreach ($cursos_arr as $c): ?>
                    <?php if ($sel_nivel == 0 || $sel_nivel == $c['nivel_id']): ?>
                    <option value="<?php echo $c['id']; ?>" <?php echo $sel_curso == $c['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($c['nombre']); ?>
                    </option>
                    <?php endif; ?>
                <?php endforeach; ?>
            </select>
        </div>
        <button type="submit" class="btn">Buscar</button>
    </form>
</div>

<?php if (count($reporte) > 0): ?>

<!-- Resumen -->
<h2>Resumen de Asistencia</h2>
<table class="table">
    <thead>
        <tr>
            <th>#</th>
            <th>DNI</th>
            <th>Apellidos y Nombres</th>
            <th>Asistencias</th>
            <th>Faltas</th>
            <th>Tardanzas</th>
            <th>Total</th>
            <th>% Asistencia</th>
        </tr>
    </thead>
    <tbody>
        <?php $i = 1; foreach ($reporte as $r):
            $porcentaje = $r['total'] > 0 ? round(($r['asistencias'] / $r['total']) * 100, 1) : 0;
            $clase_porcentaje = $porcentaje >= 80 ? 'text-success' : ($porcentaje >= 50 ? 'text-warning' : 'text-danger');
        ?>
        <tr>
            <td><?php echo $i++; ?></td>
            <td><?php echo htmlspecialchars($r['dni']); ?></td>
            <td><?php echo htmlspecialchars($r['apellidos'] . ', ' . $r['nombres']); ?></td>
            <td class="text-center"><?php echo $r['asistencias']; ?></td>
            <td class="text-center"><?php echo $r['faltas']; ?></td>
            <td class="text-center"><?php echo $r['tardanzas']; ?></td>
            <td class="text-center"><?php echo $r['total']; ?></td>
            <td class="text-center <?php echo $clase_porcentaje; ?>"><?php echo $porcentaje; ?>%</td>
        </tr>
        <?php endforeach; ?>
    </tbody>
</table>

<?php if ($sel_curso > 0 && count($detalle) > 0): ?>
<h2>Detalle por Fecha</h2>
<?php
    // Obtener fechas únicas
    $fechas = [];
    foreach ($detalle as $est_det) {
        foreach (array_keys($est_det) as $f) {
            $fechas[$f] = true;
        }
    }
    ksort($fechas);
    $fechas = array_keys($fechas);
?>
<div class="table-responsive">
<table class="table table-detalle">
    <thead>
        <tr>
            <th>Estudiante</th>
            <?php foreach ($fechas as $f): ?>
                <th class="fecha-col"><?php echo date('d/m', strtotime($f)); ?></th>
            <?php endforeach; ?>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($reporte as $r): ?>
        <tr>
            <td><?php echo htmlspecialchars($r['apellidos'] . ', ' . $r['nombres']); ?></td>
            <?php foreach ($fechas as $f):
                $estado = isset($detalle[$r['id']][$f]) ? $detalle[$r['id']][$f]['estado'] : '-';
                $clase = '';
                $letra = '-';
                if ($estado === 'Asistió') { $clase = 'estado-asistio'; $letra = 'A'; }
                elseif ($estado === 'Faltó') { $clase = 'estado-falto'; $letra = 'F'; }
                elseif ($estado === 'Tardanza') { $clase = 'estado-tardanza'; $letra = 'T'; }
            ?>
                <td class="text-center <?php echo $clase; ?>"><?php echo $letra; ?></td>
            <?php endforeach; ?>
        </tr>
        <?php endforeach; ?>
    </tbody>
</table>
</div>
<?php endif; ?>

<?php elseif ($sel_nivel > 0 && $sel_grado > 0 && $sel_seccion > 0): ?>
    <div class="alert info">No se encontraron registros de asistencia para los filtros seleccionados.</div>
<?php else: ?>
    <div class="alert info">Seleccione nivel, grado y sección para generar el reporte.</div>
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

    selectCurso.innerHTML = '<option value="0">Todos los cursos</option>';
    cursos.forEach(function(c) {
        if (c.nivel_id == nivelId) {
            var opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            selectCurso.appendChild(opt);
        }
    });
}
</script>

<?php
$conn->close();
include 'includes/footer.php';
?>
