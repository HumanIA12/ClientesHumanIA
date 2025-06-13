    </div> <!-- Fin del container del contenido -->
    
    <!-- Footer -->
    <footer class="bg-dark text-white text-center py-3 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-4">
                    <h5>FRUTALE</h5>
                    <p class="small">Sistema de gestión de pedidos y distribución</p>
                </div>
                <div class="col-md-4">
                    <h5>Contacto</h5>
                    <p class="small">
                        <i class="fas fa-envelope me-2"></i> info@frutale.com<br>
                        <i class="fas fa-phone me-2"></i> (123) 456-7890
                    </p>
                </div>
                <div class="col-md-4">
                    <h5>Enlaces</h5>
                    <ul class="list-unstyled small">
                        <li><a href="#" class="text-white">Términos y condiciones</a></li>
                        <li><a href="#" class="text-white">Política de privacidad</a></li>
                    </ul>
                </div>
            </div>
            <hr class="my-2">
            <p class="mb-0 small">© <?php echo date('Y'); ?> Frutale. Todos los derechos reservados.</p>
        </div>
    </footer>
    
    <!-- Scripts -->
    <script>
        // Inicializar tooltips
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })
    </script>
</body>
</html>
