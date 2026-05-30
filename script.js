document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Gracias por contactarnos. Responderemos pronto.');
    this.reset();
});
