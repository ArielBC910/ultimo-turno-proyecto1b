# Verificación de energía y turno 3D

Rama de trabajo: `Ariel_Baldeon`. No se modificó `Develop` ni se hizo commit/push.

## Reglas

- Noche: 360000 ms, HUD por horas (12 AM hasta 6 AM).
- Batería: 100 %, sin regeneración; luz 0,12 %/s, monitor 0,18 %/s, puerta cerrada 0,52 %/s. Tasas sumadas.
- Agotamiento: apagar luz/monitor, abrir puerta, bloquear acciones eléctricas tanto en el modelo como en la interfaz. Sin muerte automática.
- Apertura pierde protección enseguida; cierre protege después de 650 ms. La energía, puerta y IA comparten tiempo y se subdividen en el instante exacto de cierre, agotamiento o resultado.
- Se conservan 15 s de exposición acumulada y retirada de 5–15 s. Patrulla aleatoria acotada; desde 3 AM prioriza acercarse.
- Llegadas cada 18 s, paciencia de 32 s, cuatro clientes perdidos causan derrota. Cocina independiente de la batería.

## Pruebas automáticas

`npm test`: 65 comprobaciones. Incluyen suma de consumo, avisos únicos, límites, bloqueo del modelo y UI, consumo a 15/30/60/144 FPS, frames largos, protección física, fronteras de hora, victoria, derrota y reinicio.

En 100 semillas, puerta cerrada permanentemente agota la batería y termina en derrota. En otras 100, reaccionando a los 4 s, con cámaras abiertas el 50 % del tiempo, luz el 25 % y reapertura 3 s después de la retirada, todas las noches terminan en victoria; margen mínimo 30,12 %. Esta simulación comprueba recursos/IA, no pedidos ni habilidad humana.

## Entorno visual

Chrome local aislado mediante Chrome DevTools Protocol, sin añadir dependencias al juego. El acceso local dentro del sandbox falló por permisos de sockets; fuera del sandbox funciona. Se corrigió además el watcher de Vite para excluir `tmp/`, donde el perfil temporal de Chrome bloqueaba archivos. Las capturas y registros de las pruebas se guardan en `tmp/` (ignorados por Git).

## Resultados de navegador (2026-11-15)

- Partida completa de seis minutos reales, sin adelantar el reloj ni modificar IA/batería: victoria a 6 AM y 19 pedidos entregados. Automatización con teclas WASD/V/X/C y acciones de preparación/entrega; defensa a partir de los avisos perceptibles de llegada/retirada. `tmp/full-night-report.json` y `tmp/full-night-result.jpg`.
- Agotamiento visual: fixture inicial de 1,64 % con los tres dispositivos activos, tasas de producción sin alterar. Tras agotarse: 0 %, luz apagada, monitor cerrado, puerta abierta y los tres botones bloqueados; diez intentos de X/F/C no reactivan nada. `tmp/boundary-report.json`.
- Sin batería: movimiento y preparación de una bebida comprobados. Una llegada controlada a la puerta no mata a los cinco segundos; después se produce la derrota según los 15 s normales. Reinicio mediante VOLVER A JUGAR restablece carga 100 %, 12 AM, enemigo en bodega, puerta abierta, cero pedidos y cero susto.
- Se comprobó que mantener X con eventos repetidos no alterna la puerta, el haz cambia al girar, 1–4 cambia cámaras y la interferencia transitoria deja ver la imagen (CAM 04 comprobada después del pulso).
- Después de los ajustes visuales, se comprobó nuevamente la frontera 6 AM con un escenario cercano al amanecer: resultado correcto y energía/IA congeladas después de ganar. `tmp/final-smoke-report.json`. Esta comprobación adicional usa fixture; la partida completa anterior no.
- La captura Pointer Lock no se concede en Chrome headless; se añadió y probó la alternativa de arrastre. La orientación pasó de -1,5708 a -1,2908 rad con un arrastre de ratón. La captura en un navegador con ventana no quedó verificada.
- Ninguna excepción JavaScript en las pruebas completadas. Build correcto; Vite mantiene advertencias por el tamaño de los paquetes de Phaser y Three.js.

Límites: una partida completa automatizada en Chrome local y simulaciones de recursos, no una evaluación de dificultad con varios jugadores ni una matriz de navegadores/GPU. Se comprobaron llamadas y estados de audio, no se evaluó auditivamente la mezcla. Los personajes mantienen relieves texturizados, no modelos de cuerpo completo para todos los ángulos.
