# Inteligencia y reglas de la noche

## Reloj y resultado

NightSession mantiene un reloj monotónico de 360000 ms, independiente de los FPS. Un segundo real equivale a un minuto del juego. La victoria se produce a las 6:00 AM. Si un ataque coincide exactamente con el amanecer, tiene prioridad la victoria.

El reloj no se pausa al ocultar la pestaña. Al volver se procesa el tiempo transcurrido, evitando prolongar la noche por limitar los FPS. Volver al menú abandona el intento. Cada reintento crea sesión y criatura nuevas.

## Decisiones de movimiento

La criatura empieza en la bodega. El grafo conecta:

- Bodega: mostrador y comedor.
- Mostrador: bodega, comedor y pasillo.
- Comedor: bodega, mostrador y pasillo.
- Pasillo: comedor, mostrador y acceso a oficina.

En cada decisión se sortea una sala vecina con pesos. El peso de una sala que acerca al acceso es 4 + 3 × progreso de la noche; el resto pesa 1.3. Regresar a la sala anterior multiplica el peso por 0.7. Esto favorece la aproximación y evita una ruta fija, sin prohibir exploración o retroceso.

Los intervalos de movimiento se sortean entre 6.5 y 13 segundos al inicio, reduciéndose hasta un 30% al terminar la noche.

## Ataque y puerta

Al llegar al acceso, el monstruo deja de elegir salas y acumula tiempo de exposición si la puerta está abierta. A los 15000 ms abiertos durante esa visita se produce una única derrota.

Cerrar la puerta bloquea el ataque y sortea un intervalo entre 5000 y 15000 ms. Si la puerta permanece cerrada hasta completarlo, el wendigo se retira, emitiendo un evento único. La escena reproduce un impacto metálico y un grito de fondo.

El destino de retirada se elige entre comedor, mostrador y bodega. Se excluyen pasillo y acceso. Desde allí continúa tomando decisiones.

Reabrir antes de la retirada cancela la espera cerrada y conserva la exposición abierta acumulada. Volver a cerrar sortea otra espera. Así se evita reiniciar indefinidamente el ataque alternando el botón.

## Separación de responsabilidades

MonsterManager decide ubicación y produce eventos con su instante relativo. NightSession resuelve reloj y resultado. OfficeScene consume los eventos, cambia las imágenes y ordena el audio. ResultScene presenta victoria o derrota y limpia su interfaz al reintentar.

La posición es única: solo la cámara de la sala ocupada usa su variante con wendigo. Frente al acceso se usan imágenes distintas con y sin linterna; una puerta cerrada lo oculta.

## Arte

Se conserva el diseño parcialmente oculto y las poses distintas: trepado en una pared, tras el mostrador, colgado junto a una estantería, de perfil en el pasillo y asomado por el marco de la oficina. Los prompts están en WENDIGO_RECURSOS.json.
