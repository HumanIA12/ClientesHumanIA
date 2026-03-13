<?php
$rootDir = __DIR__;
$zipFileName = 'sistema_asistencia_escolar.zip';
$tmpFile = tempnam(sys_get_temp_dir(), 'zip_');

$zip = new ZipArchive();
if ($zip->open($tmpFile, ZipArchive::OVERWRITE) !== true) {
    die('No se pudo crear el archivo ZIP.');
}

$excludeDirs = ['.git'];

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($rootDir, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);

foreach ($iterator as $file) {
    $filePath = $file->getRealPath();
    $relativePath = substr($filePath, strlen($rootDir) + 1);

    // Excluir carpetas no deseadas
    $skip = false;
    foreach ($excludeDirs as $excl) {
        if (strpos($relativePath, $excl) === 0) {
            $skip = true;
            break;
        }
    }
    if ($skip) continue;

    if ($file->isDir()) {
        $zip->addEmptyDir($relativePath);
    } else {
        $zip->addFile($filePath, $relativePath);
    }
}

$zip->close();

// Enviar al navegador
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $zipFileName . '"');
header('Content-Length: ' . filesize($tmpFile));
header('Cache-Control: no-cache');

readfile($tmpFile);
unlink($tmpFile);
exit;
