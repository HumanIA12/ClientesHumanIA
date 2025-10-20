<?php
class Model {
    protected $db;
    public function __construct() {
        $this->db = require __DIR__ . '/../config/db.php';
    }
}
?>
