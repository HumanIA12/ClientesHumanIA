<?php
require_once 'config/database.php';
$conn = getConnection();

$mensaje = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'crear') {
        $nombre = $conn->real_escape_string(trim($_POST['nombre']));
        $nivel_id = (int)$_POST['nivel_id'];

        $stmt = $conn->prepare("INSERT INTO cursos (nombre, nivel_id) VALUES (?, ?)");
        $stmt->bind_param("si", $nombre, $nivel_id);

        if ($stmt->execute()) {
            $mensaje = '<div class="alert success">Curso registrado correctamente.</div>';
        } else {
            $mensaje = '<div class="alert error">Error al registrar: ' . htmlspecialchars($stmt->error) . '</div>';
        }
        $stmt->close();
    }

    if ($action === 'editar') {
        $id = (int)$_POST['id'];
        $nombre = $conn->real_escape_string(trim($_POST['nombre']));
        $nivel_id = (int)$_POST['nivel_id'];

        $stmt = $conn->prepare("UPDATE cursos SET nombre=?, nivel_id=? WHERE id=?");
        $stmt->bind_param("sii", $nombre, $nivel_id, $id);

        if ($stmt->execute()) {
            $mensaje = '<div class="alert success">Curso actualizado correctamente.</div>';
        } else {
            $mensaje = '<div class="alert error">Error al actualizar: ' . htmlspecialchars($stmt->error) . '</div>';
        }
        $stmt->close();
    }

    if ($action === 'eliminar') {
        $id = (int)$_POST['id'];
        $stmt = $conn->prepare("UPDATE cursos SET activo = 0 WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $mensaje = '<div class="alert success">Curso eliminado correctamente.</div>';
        $stmt->close();
    }
}

$cursos = $conn->query("
    SELECT c.*, n.nombre as nivel
    FROM cursos c
    JOIN niveles n ON c.nivel_id = n.id
    WHERE c.activo = 1
    ORDER BY n.nombre, c.nombre
");

$niveles = $conn->query("SELECT * FROM niveles ORDER BY id");
?>
<?php include 'includes/header.php'; ?>

<h1>Gestión de Cursos</h1>

<?php echo $mensaje; ?>

<button class="btn" onclick="document.getElementById('formNuevo').style.display='block'">Nuevo Curso</button>

<div id="formNuevo" class="form-container" style="display:none;">
    <h2>Registrar Curso</h2>
    <form method="POST">
        <input type="hidden" name="action" value="crear">
        <div class="form-group">
            <label>Nombre del Curso:</label>
            <input type="text" name="nombre" required>
        </div>
        <div class="form-group">
            <label>Nivel:</label>
            <select name="nivel_id" required>
                <option value="">Seleccione</option>
                <?php
                $niveles->data_seek(0);
                while ($n = $niveles->fetch_assoc()): ?>
                    <option value="<?php echo $n['id']; ?>"><?php echo htmlspecialchars($n['nombre']); ?></option>
                <?php endwhile; ?>
            </select>
        </div>
        <button type="submit" class="btn">Guardar</button>
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('formNuevo').style.display='none'">Cancelar</button>
    </form>
</div>

<table class="table">
    <thead>
        <tr>
            <th>#</th>
            <th>Curso</th>
            <th>Nivel</th>
            <th>Acciones</th>
        </tr>
    </thead>
    <tbody>
        <?php if ($cursos->num_rows === 0): ?>
            <tr><td colspan="4" class="text-center">No se encontraron cursos.</td></tr>
        <?php else: ?>
            <?php $i = 1; while ($c = $cursos->fetch_assoc()): ?>
            <tr>
                <td><?php echo $i++; ?></td>
                <td><?php echo htmlspecialchars($c['nombre']); ?></td>
                <td><?php echo htmlspecialchars($c['nivel']); ?></td>
                <td>
                    <button class="btn btn-sm" onclick="editarCurso(<?php echo $c['id']; ?>, '<?php echo htmlspecialchars($c['nombre'], ENT_QUOTES); ?>', <?php echo $c['nivel_id']; ?>)">Editar</button>
                    <form method="POST" style="display:inline" onsubmit="return confirm('¿Está seguro de eliminar este curso?')">
                        <input type="hidden" name="action" value="eliminar">
                        <input type="hidden" name="id" value="<?php echo $c['id']; ?>">
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
        <h2>Editar Curso</h2>
        <form method="POST">
            <input type="hidden" name="action" value="editar">
            <input type="hidden" name="id" id="edit_id">
            <div class="form-group">
                <label>Nombre del Curso:</label>
                <input type="text" name="nombre" id="edit_nombre" required>
            </div>
            <div class="form-group">
                <label>Nivel:</label>
                <select name="nivel_id" id="edit_nivel_id" required>
                    <?php
                    $niveles->data_seek(0);
                    while ($n = $niveles->fetch_assoc()): ?>
                        <option value="<?php echo $n['id']; ?>"><?php echo htmlspecialchars($n['nombre']); ?></option>
                    <?php endwhile; ?>
                </select>
            </div>
            <button type="submit" class="btn">Actualizar</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('modalEditar').style.display='none'">Cancelar</button>
        </form>
    </div>
</div>

<script>
function editarCurso(id, nombre, nivelId) {
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nombre').value = nombre;
    document.getElementById('edit_nivel_id').value = nivelId;
    document.getElementById('modalEditar').style.display = 'flex';
}
</script>

<?php
$conn->close();
include 'includes/footer.php';
?>
