<?php
class Controller {
    protected function view($view, $data = []) {
        extract($data);
        require $view;
    }
}
?>
