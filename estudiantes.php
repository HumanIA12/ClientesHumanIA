<?php
require_once 'config/database.php';
$conn = getConnection();

$mensaje = '';

// Procesar formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'crear') {
        $dni = $conn->real_escape_string(trim($_POST['dni']));
        $apellidos = $conn->real_escape_string(trim($_POST['apellidos']));
        $nombres = $conn->real_escape_string(trim($_POST['nombres']));
        $nivel_id = (int)$_POST['nivel_id'];
        $grado_id = (int)$_POST['grado_id'];
        $seccion_id = (int)$_POST['seccion_id'];

        $stmt = $conn->prepare("INSERT INTO estudiantes (dni, apellidos, nombres, nivel_id, grado_id, seccion_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssiii", $dni, $apellidos, $nombres, $nivel_id, $grado_id, $seccion_id);

        if ($stmt->execute()) {
            $mensaje = '<div class="alert success">Estudiante registrado correctamente.</div>';
        } else {
            $mensaje = '<div class="alert error">Error al registrar: ' . htmlspecialchars($stmt->error) . '</div>';
        }
        $stmt->close();
    }

    if ($action === 'editar') {
        $id = (int)$_POST['id'];
        $dni = $conn->real_escape_string(trim($_POST['dni']));
        $apellidos = $conn->real_escape_string(trim($_POST['apellidos']));
        $nombres = $conn->real_escape_string(trim($_POST['nombres']));
        $nivel_id = (int)$_POST['nivel_id'];
        $grado_id = (int)$_POST['grado_id'];
        $seccion_id = (int)$_POST['seccion_id'];

        $stmt = $conn->prepare("UPDATE estudiantes SET dni=?, apellidos=?, nombres=?, nivel_id=?, grado_id=?, seccion_id=? WHERE id=?");
        $stmt->bind_param("sssiiii", $dni, $apellidos, $nombres, $nivel_id, $grado_id, $seccion_id, $id);

        if ($stmt->execute()) {
            $mensaje = '<div class="alert success">Estudiante actualizado correctamente.</div>';
        } else {
            $mensaje = '<div class="alert error">Error al actualizar: ' . htmlspecialchars($stmt->error) . '</div>';
        }
        $stmt->close();
    }

    if ($action === 'eliminar') {
        $id = (int)$_POST['id'];
        $stmt = $conn->prepare("UPDATE estudiantes SET activo = 0 WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $mensaje = '<div class="alert success">Estudiante eliminado correctamente.</div>';
        $stmt->close();
    }
}

// Filtros
$filtro_nivel = isset($_GET['nivel_id']) ? (int)$_GET['nivel_id'] : 0;
$filtro_grado = isset($_GET['grado_id']) ? (int)$_GET['grado_id'] : 0;
$filtro_seccion = isset($_GET['seccion_id']) ? (int)$_GET['seccion_id'] : 0;

$where = "WHERE e.activo = 1";
if ($filtro_nivel > 0) $where .= " AND e.nivel_id = $filtro_nivel";
if ($filtro_grado > 0) $where .= " AND e.grado_id = $filtro_grado";
if ($filtro_seccion > 0) $where .= " AND e.seccion_id = $filtro_seccion";

$estudiantes = $conn->query("
    SELECT e.*, n.nombre as nivel, g.nombre as grado, g.numero as grado_num, s.nombre as seccion
    FROM estudiantes e
    JOIN niveles n ON e.nivel_id = n.id
    JOIN grados g ON e.grado_id = g.id
    JOIN secciones s ON e.seccion_id = s.id
    $where
    ORDER BY n.nombre, g.numero, s.nombre, e.apellidos, e.nombres
");

$niveles = $conn->query("SELECT * FROM niveles ORDER BY id");
$grados = $conn->query("SELECT g.*, n.nombre as nivel FROM grados g JOIN niveles n ON g.nivel_id = n.id ORDER BY g.nivel_id, g.numero");
$secciones = $conn->query("SELECT * FROM secciones ORDER BY id");

// Guardar grados en array para reusar
$grados_arr = [];
while ($g = $grados->fetch_assoc()) {
    $grados_arr[] = $g;
}
?>
<?php include 'includes/header.php'; ?>

<h1>Gestión de Estudiantes</h1>

<?php echo $mensaje; ?>

<button class="btn" onclick="document.getElementById('formNuevo').style.display='block'">Nuevo Estudiante</button>

<!-- Formulario nuevo estudiante -->
<div id="formNuevo" class="form-container" style="display:none;">
    <h2>Registrar Estudiante</h2>
    <form method="POST">
        <input type="hidden" name="action" value="crear">
        <div class="form-group">
            <label>DNI:</label>
            <input type="text" name="dni" required maxlength="15">
        </div>
        <div class="form-group">
            <label>Apellidos:</label>
            <input type="text" name="apellidos" required>
        </div>
        <div class="form-group">
            <label>Nombres:</label>
            <input type="text" name="nombres" required>
        </div>
        <div class="form-group">
            <label>Nivel:</label>
            <select name="nivel_id" id="nivel_nuevo" required onchange="filtrarGrados(this.value, 'grado_nuevo')">
                <option value="">Seleccione</option>
                <?php
                $niveles->data_seek(0);
                while ($n = $niveles->fetch_assoc()): ?>
                    <option value="<?php echo $n['id']; ?>"><?php echo htmlspecialchars($n['nombre']); ?></option>
                <?php endwhile; ?>
            </select>
        </div>
        <div class="form-group">
            <label>Grado:</label>
            <select name="grado_id" id="grado_nuevo" required>
                <option value="">Seleccione nivel primero</option>
            </select>
        </div>
        <div class="form-group">
            <label>Sección:</label>
            <select name="seccion_id" required>
                <option value="">Seleccione</option>
                <?php
                $secciones->data_seek(0);
                while ($s = $secciones->fetch_assoc()): ?>
                    <option value="<?php echo $s['id']; ?>"><?php echo htmlspecialchars($s['nombre']); ?></option>
                <?php endwhile; ?>
            </select>
        </div>
        <button type="submit" class="btn">Guardar</button>
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('formNuevo').style.display='none'">Cancelar</button>
    </form>
</div>

<!-- Filtros -->
<div class="filtros">
    <form method="GET" class="form-inline">
        <select name="nivel_id" onchange="this.form.submit()">
            <option value="0">Todos los niveles</option>
            <?php
            $niveles->data_seek(0);
            while ($n = $niveles->fetch_assoc()): ?>
                <option value="<?php echo $n['id']; ?>" <?php echo $filtro_nivel == $n['id'] ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($n['nombre']); ?>
                </option>
            <?php endwhile; ?>
        </select>
        <select name="grado_id" onchange="this.form.submit()">
            <option value="0">Todos los grados</option>
            <?php foreach ($grados_arr as $g): ?>
                <?php if ($filtro_nivel == 0 || $filtro_nivel == $g['nivel_id']): ?>
                <option value="<?php echo $g['id']; ?>" <?php echo $filtro_grado == $g['id'] ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($g['nombre'] . ' - ' . $g['nivel']); ?>
                </option>
                <?php endif; ?>
            <?php endforeach; ?>
        </select>
        <select name="seccion_id" onchange="this.form.submit()">
            <option value="0">Todas las secciones</option>
            <?php
            $secciones->data_seek(0);
            while ($s = $secciones->fetch_assoc()): ?>
                <option value="<?php echo $s['id']; ?>" <?php echo $filtro_seccion == $s['id'] ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($s['nombre']); ?>
                </option>
            <?php endwhile; ?>
        </select>
    </form>
</div>

<!-- Tabla de estudiantes -->
<table class="table">
    <thead>
        <tr>
            <th>DNI</th>
            <th>Apellidos y Nombres</th>
            <th>Nivel</th>
            <th>Grado</th>
            <th>Sección</th>
            <th>Acciones</th>
        </tr>
    </thead>
    <tbody>
        <?php if ($estudiantes->num_rows === 0): ?>
            <tr><td colspan="6" class="text-center">No se encontraron estudiantes.</td></tr>
        <?php else: ?>
            <?php while ($e = $estudiantes->fetch_assoc()): ?>
            <tr>
                <td><?php echo htmlspecialchars($e['dni']); ?></td>
                <td><?php echo htmlspecialchars($e['apellidos'] . ', ' . $e['nombres']); ?></td>
                <td><?php echo htmlspecialchars($e['nivel']); ?></td>
                <td><?php echo htmlspecialchars($e['grado']); ?></td>
                <td><?php echo htmlspecialchars($e['seccion']); ?></td>
                <td>
                    <button class="btn btn-sm" onclick="editarEstudiante(<?php echo htmlspecialchars(json_encode($e)); ?>)">Editar</button>
                    <form method="POST" style="display:inline" onsubmit="return confirm('¿Está seguro de eliminar este estudiante?')">
                        <input type="hidden" name="action" value="eliminar">
                        <input type="hidden" name="id" value="<?php echo $e['id']; ?>">
                        <button type="submit" class="btn btn-sm btn-danger">Eliminar</button>
                    </form>
                </td>
            </tr>
            <?php endwhile; ?>
        <?php endif; ?>
    </tbody>
</table>

<!-- Modal editar -->
<div id="modalEditar" class="modal" style="display:none;">
    <div class="modal-content">
        <h2>Editar Estudiante</h2>
        <form method="POST">
            <input type="hidden" name="action" value="editar">
            <input type="hidden" name="id" id="edit_id">
            <div class="form-group">
                <label>DNI:</label>
                <input type="text" name="dni" id="edit_dni" required maxlength="15">
            </div>
            <div class="form-group">
                <label>Apellidos:</label>
                <input type="text" name="apellidos" id="edit_apellidos" required>
            </div>
            <div class="form-group">
                <label>Nombres:</label>
                <input type="text" name="nombres" id="edit_nombres" required>
            </div>
            <div class="form-group">
                <label>Nivel:</label>
                <select name="nivel_id" id="edit_nivel_id" required onchange="filtrarGrados(this.value, 'edit_grado_id')">
                    <option value="">Seleccione</option>
                    <?php
                    $niveles->data_seek(0);
                    while ($n = $niveles->fetch_assoc()): ?>
                        <option value="<?php echo $n['id']; ?>"><?php echo htmlspecialchars($n['nombre']); ?></option>
                    <?php endwhile; ?>
                </select>
            </div>
            <div class="form-group">
                <label>Grado:</label>
                <select name="grado_id" id="edit_grado_id" required>
                    <option value="">Seleccione nivel primero</option>
                </select>
            </div>
            <div class="form-group">
                <label>Sección:</label>
                <select name="seccion_id" id="edit_seccion_id" required>
                    <?php
                    $secciones->data_seek(0);
                    while ($s = $secciones->fetch_assoc()): ?>
                        <option value="<?php echo $s['id']; ?>"><?php echo htmlspecialchars($s['nombre']); ?></option>
                    <?php endwhile; ?>
                </select>
            </div>
            <button type="submit" class="btn">Actualizar</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('modalEditar').style.display='none'">Cancelar</button>
        </form>
    </div>
</div>

<script>
var grados = <?php echo json_encode($grados_arr); ?>;

function filtrarGrados(nivelId, selectId) {
    var select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Seleccione</option>';
    grados.forEach(function(g) {
        if (g.nivel_id == nivelId) {
            var opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.nombre;
            select.appendChild(opt);
        }
    });
}

function editarEstudiante(e) {
    document.getElementById('edit_id').value = e.id;
    document.getElementById('edit_dni').value = e.dni;
    document.getElementById('edit_apellidos').value = e.apellidos;
    document.getElementById('edit_nombres').value = e.nombres;
    document.getElementById('edit_nivel_id').value = e.nivel_id;
    filtrarGrados(e.nivel_id, 'edit_grado_id');
    setTimeout(function() {
        document.getElementById('edit_grado_id').value = e.grado_id;
    }, 50);
    document.getElementById('edit_seccion_id').value = e.seccion_id;
    document.getElementById('modalEditar').style.display = 'flex';
}
</script>

<?php
$conn->close();
include 'includes/footer.php';
?>
