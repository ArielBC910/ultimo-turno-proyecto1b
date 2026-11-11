# Audio y licencias

## Efectos de retirada

Autor: rubberduck. Licencia indicada en las páginas originales: CC0.

- door-bang.ogg: archivo metal_slam_01.ogg del paquete [100 CC0 metal and wood SFX](https://opengameart.org/content/100-cc0-metal-and-wood-sfx).
- wendigo-scream.ogg: archivo scream_02.ogg del paquete [80 CC0 creature SFX](https://opengameart.org/content/80-cc0-creature-sfx).

Los archivos originales OGG se mantienen sin edición. El juego ajusta volumen y velocidad de reproducción. Al retirarse la criatura se reproduce el impacto, seguido del grito con 120 ms de retraso.

## Ambiente

night-ambient.wav es un bucle original de síntesis procedural, generado por scripts/generate-ambient.mjs. Acompaña la partida a volumen bajo. Se puede regenerar con node scripts/generate-ambient.mjs.

Se añaden tres capas originales generadas con scripts/generate-soundscape.mjs:

- night-music.wav: música ambiental de 32 segundos con acordes menores, pads y campanillas espaciadas.
- fan-loop.wav: motor de ventilador, aire filtrado y pulsación de aspas, 12 segundos. Se sitúa hacia la derecha en audio estéreo.
- night-crickets.wav: coro de grillos sintetizados con llamadas escalonadas, 24 segundos. Se sitúa ligeramente a la izquierda.

Regenerar con node scripts/generate-soundscape.mjs. Los archivos tienen entradas y salidas suavizadas para evitar chasquidos. Música y ambiente quedan por debajo del golpe y grito de retirada. El ventilador y los grillos bajan de volumen al abrir el monitor.

Las aspas usan una imagen transparente generada con image_gen.imagegen: public/assets/images/fan-rotor.png. El prompt está en VENTILADOR_RECURSO.json. FanEffect la hace girar sin girar la rejilla ni la carcasa de la oficina. La capa se oculta en las cámaras y respeta prefers-reduced-motion.

## Sonidos de interacción

El mismo generador crea flashlight-click.wav (clic del interruptor), door-close.wav (motor, rieles y cierre metálico) y door-open.wav (mecanismo de apertura). Son efectos originales de síntesis procedural, separados del impacto fuerte del wendigo.

Los sonidos se disparan una sola vez por cambio efectivo mediante ratón, táctil o teclado. No se reproducen al actualizar una imagen ni al pulsar un control bloqueado en el monitor. El clic también se oye al apagar manualmente la linterna.

## Controles y ciclo de vida

El audio comienza después de pulsar el botón de inicio, respetando el bloqueo de reproducción automática del navegador. El botón Audio permite silenciar todo y conserva la preferencia en localStorage. Volver al menú o terminar la partida detiene el ambiente y los efectos activos. La derrota reproduce un grito en la escena de resultados.
