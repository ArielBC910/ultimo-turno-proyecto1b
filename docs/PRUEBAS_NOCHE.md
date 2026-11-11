# Verificación de la noche de seis minutos

Fecha: 10 de noviembre de 2026.

## Pruebas automatizadas

npm test: 11 pruebas correctas.

- Posición única e imagen correcta con cámara, puerta y linterna.
- Decisiones entre salas vecinas con diferentes destinos y sesgo de aproximación.
- Ataque exactamente después de 15000 ms de exposición abierta, sin eventos duplicados.
- Retirada entre 5000 y 15000 ms de cierre continuo.
- Destino de retirada lejano, excluyendo acceso y pasillo.
- Reabrir conserva el tiempo abierto acumulado y cancela la espera de retirada.
- Volver a cerrar inicia un nuevo intervalo cerrado.
- Victoria exactamente a los 360000 ms y reloj a las 6:00 AM.
- Conversión de cada minuto real a una hora del reloj.
- Reinicio completo y resolución de empate entre ataque y amanecer.
- Simulación de 100 noches con semillas distintas, validando grafo, tiempos y victoria con la puerta cerrada.

## Navegador

- Menú principal, instrucciones, récord y audio revisados en escritorio y móvil de 390 × 844.
- Se inició una partida real sin cerrar la puerta: terminó en derrota a los 39 segundos, con mensaje y opciones de menú y reintento.
- Volver a jugar inició otra sesión. La segunda partida, con puerta cerrada, avanzó más allá de la 1:00 AM sin errores.
- Se comprobó que el botón de audio alterna su estado accesible y vuelve al menú correctamente.
- La pantalla de victoria se renderizó en escritorio y móvil usando una sesión real simulada hasta 360000 ms en un fixture temporal. Esta comprobación visual no esperó seis minutos de reloj real.
- Sin errores de consola durante estas comprobaciones.
- npm run build: compilación correcta; permanece el aviso de tamaño del paquete de Phaser.

## Audio y alcance

El loader carga los efectos OGG de golpe y grito y el ambiente WAV original. Las pruebas de lógica verifican el evento único de retirada; OfficeScene lo conecta a ambos efectos. Autores y licencias en AUDIO.md.

No se añade energía ni batería. Es posible mantener la puerta cerrada durante toda la noche. El reloj continúa al cambiar de pestaña. La partida no se guarda; sí se guardan la preferencia de audio, el mejor tiempo y las noches ganadas.

## Ambiente e interacciones

- Música ambiental, zumbido de ventilador y grillos originales generados como WAV; se verificaron duración, señal no vacía y ausencia de recorte digital.
- Aspas del ventilador revisadas en dos capturas sucesivas: cambian de posición y la rejilla permanece fija. Se usó un fixture sin oscuridad para comprobar la alineación con la foto.
- Clic de linterna y apertura/cierre de puerta conectados a cambios efectivos, con ratón y teclado.
- Prueba de carga limpia en navegador: inicio, linterna, puerta y monitor sin errores de decodificación ni advertencias de consola.
- Compilación y las 11 pruebas de lógica siguen pasando.
