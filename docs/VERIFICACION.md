# Verificación del prototipo visual

Iteración del 10 de noviembre de 2026.

- npm run build: compilación correcta. Vite avisa del tamaño del paquete de Phaser, sin bloquear la compilación.
- Oficina: imagen del restaurante cargada en Phaser.
- Iluminar: cambia el estado accesible del botón y la iluminación visible de la puerta.
- Monitor: abre desde la oficina, apaga la luz frontal y ofrece regreso a la oficina.
- Cámaras 01 a 04: selección comprobada en ejecución; cambian el nombre, la selección y la fotografía.
- Escape: regresa del monitor a la oficina.
- Revisión en viewport móvil 390 × 844 y escritorio 1280 × 720.
- Consola del navegador: sin errores ni advertencias durante la revisión.

## Puerta y linterna

- Botón de puerta y tecla D: alternan entre la imagen de puerta abierta y la de puerta cerrada.
- La linterna utiliza imágenes específicas para ambos estados de la puerta; la capa de oscuridad mantiene el mismo valor.
- Cambios de imagen mediante fundido de 280 ms; se omite con prefers-reduced-motion.
- Se comprobó la puerta con y sin linterna, apertura por teclado y regreso desde el monitor conservando el estado de cierre.
- Cuatro cámaras conservadas: comedor, mostrador, bodega y pasillo. La cámara 03 ahora carga cam03-storage.png y ya no carga la cocina.
- Atajos 3 y 4 comprobados: bodega y pasillo respectivamente.
- Revisión móvil 390 × 844: los tres botones principales quedan visibles.
- Compilación final correcta y sin errores de consola durante la comprobación.

Esta revisión valida el alcance visual actual. No acredita 45 FPS en dispositivos reales, mecánicas finales ni cumplimiento de todos los requisitos de la guía académica. Esta sección corresponde a la iteración visual previa. La implementación de ataques, retirada, reloj y resultados está verificada en PRUEBAS_NOCHE.md.


## Menú, oscuridad y wendigo

- Menú de inicio comprobado en escritorio y en móvil de 390 × 844, sin desbordamiento horizontal.
- Inicio y retorno al menú verificados; iniciar otra vez restablece el estado.
- Oficina sin linterna: acceso central prácticamente negro. Encenderla revela un haz central y mantiene oscuros los laterales.
- Cámara 03 muestra la bodega; las cuatro cámaras conservan sus selectores y atajos.
- Ruido e interferencia analógica comprobados visualmente; se corrigió el desplazamiento accidental del encuadre causado por la capa de ruido.
- Cinco pruebas automatizadas validan recorrido, tiempos, reinicio, una sola ubicación y las imágenes correctas para puerta y linterna.
- Seis imágenes finales del wendigo: cuatro salas en poses distintas y dos variantes cercanas a la oficina, con y sin luz.
- Esa iteración no incluía ataque, Game Over ni victoria; la iteración actual sí los implementa. Consulta PRUEBAS_NOCHE.md.
