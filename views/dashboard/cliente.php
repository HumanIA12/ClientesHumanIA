<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Cliente - Frutale</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/estilos.css">
    <link rel="stylesheet" href="../../assets/css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
    <?php include '../includes/header.php'; ?>
    
    <div class="container-fluid mt-4">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 col-lg-2 cliente-sidebar d-none d-md-block">
                <h5 class="px-3 mb-4">Panel de Cliente</h5>
                <div class="nav flex-column">
                    <a class="nav-link active" href="#"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a class="nav-link" href="../pedidos/mis_pedidos.php"><i class="fas fa-shopping-cart"></i> Mis Pedidos</a>
                    <a class="nav-link" href="../pedidos/nuevo.php"><i class="fas fa-plus-circle"></i> Nuevo Pedido</a>
                    <a class="nav-link" href="../pedidos/tracking.php"><i class="fas fa-map-marker-alt"></i> Tracking</a>
                    <a class="nav-link" href="../perfil/editar.php"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="welcome-banner">
                    <h1 class="h2">Bienvenido, <?php echo htmlspecialchars($_SESSION['usuario_nombre']); ?></h1>
                    <p class="text-muted">Panel de cliente de Frutale</p>
                </div>
                
                <!-- Stats Cards -->
                <div class="row">
                    <div class="col-md-4">
                        <div class="dashboard-card bg-primary text-white">
                            <div class="card-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="card-title">Total Pedidos</div>
                            <div class="card-value"><?php echo $total_pedidos; ?></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="dashboard-card bg-warning text-white">
                            <div class="card-icon">
                                <i class="fas fa-truck"></i>
                            </div>
                            <div class="card-title">Pedidos en Camino</div>
                            <div class="card-value"><?php echo $total_en_camino; ?></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="dashboard-card bg-success text-white">
                            <div class="card-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="card-title">Pedidos Entregados</div>
                            <div class="card-value"><?php echo $total_entregados; ?></div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Orders and Profile -->
                <div class="row mt-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Mis Pedidos Recientes</h5>
                                <a href="../pedidos/mis_pedidos.php" class="btn btn-sm btn-primary">Ver todos</a>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Fecha</th>
                                            <th>Total</th>
                                            <th>Estado</th>
                                            <th>Tracking</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php
                                        $query_recientes = "
                                            SELECT id, fecha_pedido, total, estado, tiene_tracking, link_tracking
                                            FROM pedidos
                                            WHERE id_cliente = ?
                                            ORDER BY fecha_pedido DESC
                                            LIMIT 5
                                        ";
                                        $stmt = $conexion->prepare($query_recientes);
                                        $stmt->bind_param("i", $id_cliente);
                                        $stmt->execute();
                                        $resultado_recientes = $stmt->get_result();
                                        
                                        if ($resultado_recientes->num_rows > 0) {
                                            while ($pedido = $resultado_recientes->fetch_assoc()) {
                                                echo '<tr>';
                                                echo '<td>' . $pedido['id'] . '</td>';
                                                echo '<td>' . date('d/m/Y H:i', strtotime($pedido['fecha_pedido'])) . '</td>';
                                                echo '<td>S/. ' . number_format($pedido['total'], 2) . '</td>';
                                                
                                                // Mostrar estado con color
                                                $clase_estado = '';
                                                switch ($pedido['estado']) {
                                                    case 'pendiente': $clase_estado = 'badge bg-warning'; break;
                                                    case 'confirmado': $clase_estado = 'badge bg-info'; break;
                                                    case 'preparando': $clase_estado = 'badge bg-primary'; break;
                                                    case 'en_camino': $clase_estado = 'badge bg-info'; break;
                                                    case 'entregado': $clase_estado = 'badge bg-success'; break;
                                                    case 'cancelado': $clase_estado = 'badge bg-danger'; break;
                                                }
                                                
                                                echo '<td><span class="' . $clase_estado . '">' . ucfirst(str_replace('_', ' ', $pedido['estado'])) . '</span></td>';
                                                
                                                // Mostrar tracking
                                                if ($pedido['tiene_tracking'] && !empty($pedido['link_tracking'])) {
                                                    echo '<td><a href="' . $pedido['link_tracking'] . '" target="_blank" class="btn btn-sm btn-success">Ver</a></td>';
                                                } else {
                                                    echo '<td><span class="badge bg-secondary">No disponible</span></td>';
                                                }
                                                
                                                echo '</tr>';
                                            }
                                        } else {
                                            echo '<tr><td colspan="5" class="text-center">No tienes pedidos recientes</td></tr>';
                                        }
                                        ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Profile Summary -->
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Mi Perfil</h5>
                                <a href="../perfil/editar.php" class="btn btn-sm btn-primary">Editar</a>
                            </div>
                            <div class="card-body">
                                <div class="text-center mb-3">
                                    <div class="avatar-placeholder bg-light rounded-circle mx-auto" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-user fa-3x text-secondary"></i>
                                    </div>
                                </div>
                                
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between">
                                        <strong>Nombre:</strong>
                                        <span><?php echo htmlspecialchars($datos_cliente['nombre'] . ' ' . $datos_cliente['apellidos']); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between">
                                        <strong>Email:</strong>
                                        <span><?php echo htmlspecialchars($datos_cliente['email']); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between">
                                        <strong>Teléfono:</strong>
                                        <span><?php echo htmlspecialchars($datos_cliente['telefono']); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between">
                                        <strong>Dirección:</strong>
                                        <span><?php echo htmlspecialchars($datos_cliente['direccion']); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between">
                                        <strong>Ciudad:</strong>
                                        <span><?php echo htmlspecialchars($datos_cliente['ciudad']); ?></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Tracking de pedidos en camino -->
                <?php if ($total_en_camino > 0): ?>
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Pedidos en Camino</h5>
                            </div>
                            <div class="card-body">
                                <?php
                                $query_en_camino = "
                                    SELECT p.id, p.fecha_pedido, p.total, p.fecha_entrega, p.link_tracking,
                                           CONCAT(u.nombre, ' ', u.apellidos) as transportista,
                                           e.nombre as empresa_transporte
                                    FROM pedidos p
                                    JOIN transportistas t ON p.id_transportista = t.id
                                    JOIN usuarios u ON t.id_usuario = u.id
                                    JOIN empresas_transporte e ON t.id_empresa = e.id
                                    WHERE p.id_cliente = ? AND p.estado = 'en_camino'
                                    ORDER BY p.fecha_entrega ASC
                                    LIMIT 3
                                ";
                                $stmt = $conexion->prepare($query_en_camino);
                                $stmt->bind_param("i", $id_cliente);
                                $stmt->execute();
                                $resultado_tracking = $stmt->get_result();
                                
                                while ($pedido = $resultado_tracking->fetch_assoc()):
                                ?>
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-8">
                                                <h5>Pedido #<?php echo $pedido['id']; ?></h5>
                                                <p>
                                                    <strong>Transportista:</strong> <?php echo htmlspecialchars($pedido['transportista']); ?> 
                                                    (<?php echo htmlspecialchars($pedido['empresa_transporte']); ?>)
                                                </p>
                                                <p>
                                                    <strong>Fecha de entrega estimada:</strong> 
                                                    <?php echo date('d/m/Y H:i', strtotime($pedido['fecha_entrega'])); ?>
                                                </p>
                                                
                                                <div class="tracking-container mt-3">
                                                    <div class="d-flex justify-content-between position-relative">
                                                        <div class="tracking-step text-center">
                                                            <div class="tracking-dot tracking-active"></div>
                                                            <small>Confirmado</small>
                                                        </div>
                                                        <div class="tracking-step text-center">
                                                            <div class="tracking-dot tracking-active"></div>
                                                            <small>Preparando</small>
                                                        </div>
                                                        <div class="tracking-step text-center">
                                                            <div class="tracking-dot tracking-active"></div>
                                                            <small>En camino</small>
                                                        </div>
                                                        <div class="tracking-step text-center">
                                                            <div class="tracking-dot tracking-inactive"></div>
                                                            <small>Entregado</small>
                                                        </div>
                                                        
                                                        <!-- Línea de progreso -->
                                                        <div class="progress position-absolute" style="height: 2px; width: 75%; top: 7px; left: 12%; z-index: -1;">
                                                            <div class="progress-bar bg-success" role="progressbar" style="width: 75%"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-4 d-flex align-items-center justify-content-end">
                                                <?php if (!empty($pedido['link_tracking'])): ?>
                                                <a href="<?php echo $pedido['link_tracking']; ?>" target="_blank" class="btn btn-success">
                                                    <i class="fas fa-map-marker-alt me-2"></i> Seguir en vivo
                                                </a>
                                                <?php else: ?>
                                                <span class="badge bg-secondary p-2">Tracking no disponible</span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <?php endwhile; ?>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
