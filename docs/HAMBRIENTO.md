# Hambriento

Se generaron ocho apariciones para las cuatro cámaras y dos versiones de la oficina (con y sin linterna) con la herramienta integrada image_gen. La identidad procede del modelo 2 elegido por el usuario. Los prompts completos están en HAMBRIENTO_RECURSOS.json.

Los archivos están en public/assets/images/*-hambriento-*.png. BootScene carga estos diez recursos y conserva las claves de textura y el cambio de postura a mitad de visita. No se modificaron los tiempos ni decisiones del monstruo.

La criatura tiene detalle degradado, sombras, mandíbula caída asimétrica y sangre oscura. En la oficina ambos brazos quedan dentro del pasillo sin tocar el marco. Las cámaras conservan el filtro CSS existente y la interferencia animada; las imágenes incluyen grano y deterioro adicionales.

Galería: docs/hambriento-galeria.html, con interruptor del filtro de color usado en el juego. La galería no reproduce la interferencia animada de la partida. Con el servidor de desarrollo activo: http://127.0.0.1:5173/docs/hambriento-galeria.html.

Verificación: compilación correcta; revisión visual de las diez salidas generadas; cabeceras PNG, dimensiones y presencia en dist para diez recursos; 13 pruebas de monstruo y posturas correctas. La suite completa tiene dos fallos en tests/kitchen.test.js: los casos alternan el monitor suponiendo que ya está abierto al girarse, aunque BACK_OPENS_MONITOR es false. No se cambiaron esos controles ni esos tests. El navegador de revisión no logró acceder al servidor local y el entorno bloqueó la comprobación HTTP (EACCES); queda pendiente revisar las imágenes durante una partida real.
