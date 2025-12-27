# Chatbot MODASA (Python)

Asistente de texto en puro Python para clientes de **MODASA**, enfocado en repuestos agrícolas, grupos electrógenos y servicios de mantenimiento. Puede ejecutarse de forma interactiva en consola o en Google Colab sin dependencias adicionales.

## Características
- Respuestas rápidas sobre repuestos, grupos electrógenos, paquetes de servicio y logística.
- Buscador simple por palabras clave y códigos de repuesto incluidos en el inventario de ejemplo.
- Mensajes guiados para cotizaciones y para coordinar mantenimiento preventivo o correctivo.
- Modo demostración para ver un diálogo completo sin interacción.

## Uso rápido (local o Colab)
1. Sube o copia el archivo `modasa_chatbot.py` a tu entorno.
2. Ejecuta la demo para ver respuestas listas:
   ```bash
   python modasa_chatbot.py --demo
   ```
3. Inicia el modo interactivo:
   ```bash
   python modasa_chatbot.py
   ```
   Escribe tus preguntas ("repuestos", "mantenimiento", "entregas") y finaliza con `salir`.

## Personalización
- Agrega repuestos nuevos editando la lista `inventory` en `ModasaKnowledgeBase`.
- Ajusta mensajes de servicio o logística en los métodos `_service_answer` y `_logistics_answer` del chatbot.
- El bot responde en español y está optimizado para consultas típicas de almacén y logística.