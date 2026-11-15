# Último turno

Repositorio: [ArielBC910/ultimo-turno-proyecto1b](https://github.com/ArielBC910/ultimo-turno-proyecto1b).

Juego de vigilancia nocturna en un restaurante de comida rápida, con JavaScript, Phaser 3.90 y Vite 7. Sobrevive seis minutos reales, desde las 12 AM hasta las 6 AM, vigilando cuatro cámaras, iluminando el acceso y cerrando la puerta cuando se acerque el wendigo.

## Ejecutar

Requisitos: Node.js 20.19+ de la rama 20, o 22.12+ y npm.

```powershell
cd "C:\Users\MY HP\OneDrive\Escritorio\ApliacionesWeb\Proyecto1B"
npm ci
npm run dev
```

Abre http://127.0.0.1:5174. Para usar el servidor de revisión: `npm run dev -- --port 5175`, en http://127.0.0.1:5175. No abras index.html directamente.

```powershell
npm run build
npm run preview
npm test
```

La compilación genera dist/. La vista previa usa http://127.0.0.1:4174. Las pruebas simulan los tiempos completos sin esperar seis minutos.

## Cómo jugar

1. Pulsa Sobrevivir la noche en el menú.
2. Revisa comedor, mostrador, bodega y pasillo. La cocina está detrás de la oficina y no tiene cámara.
3. Usa la linterna: sin ella el acceso central queda casi negro. Cuando el wendigo llega a la oficina, aparece de pie en el centro del acceso, detrás del plano de la puerta.
4. Si el wendigo llega al acceso, cierra la puerta. Tras entre 5 y 15 segundos continuos de cierre, se retira: escucharás un golpe metálico y un grito.
5. Sobrevive hasta las 6 AM. Al ganar o perder puedes volver al menú o iniciar otra partida.

| Acción | Botón | Teclado |
| --- | --- | --- |
| Abrir/cerrar la puerta | Cerrar puerta / Abrir puerta | X |
| Encender/apagar la linterna | Iluminar | F |
| Abrir/cerrar el monitor | Cámaras / Volver a oficina | C |
| Cerrar el monitor | Volver a oficina | Escape |
| Elegir cámara | Lista o plano | 1–4 |
| Silenciar/reactivar audio | Audio activado / Activar audio | Botón accesible con Tab |

El HUD muestra únicamente horas: 12 AM, 1 AM, …, 6 AM; cambia cada 60 segundos reales. La duración total es exactamente 360000 ms. El reloj sigue contando si cambias de pestaña; volver al menú abandona esa partida.

Frente al acceso, el wendigo mata tras acumular 15 segundos con la puerta abierta durante esa visita. Cerrar bloquea el ataque; reabrir antes de que se retire conserva el tiempo de exposición ya acumulado y cancela el intervalo de retirada. La linterna sirve para verlo y no lo ahuyenta.

La IA toma decisiones entre salas conectadas, con mayor probabilidad de acercarse a la oficina y mayor actividad al avanzar la noche. Puede explorar y retroceder. Al retirarse elige comedor, mostrador o bodega; nunca el acceso ni el pasillo inmediato.

Cada cámara tiene dos imágenes del wendigo en posiciones diferentes: una de pie y otra al ras del suelo o trepando por el techo. Durante cada visita se muestra la primera postura y, a mitad de la estancia, cambia a la segunda. Esto solo cambia la representación visual: no altera los tiempos, las decisiones de IA, la estática ni los filtros de iluminación.

## Audio y progreso

El audio se activa tras el gesto de inicio: música ambiental, motor del ventilador, grillos nocturnos, clic de linterna, mecanismo de puerta, golpe metálico y grito al retirarse; la derrota reproduce un grito. El ventilador tiene aspas animadas con carcasa fija. Al mirar el monitor baja el sonido del ventilador y de los grillos. Mute afecta a toda la mezcla. Consulta docs/AUDIO.md para autores y licencias.

localStorage conserva la preferencia de audio, el mejor tiempo sobrevivido y las noches superadas. Si el navegador bloquea el almacenamiento, el juego continúa sin persistencia. La partida en curso no se guarda.

## Arquitectura

- src/scenes/BootScene.js: loader de imágenes y audio.
- src/scenes/MenuScene.js: menú, instrucciones y récord.
- src/scenes/OfficeScene.js: escena de vigilancia y sincronización con el reloj.
- src/scenes/ResultScene.js: victoria, derrota, menú y reintento.
- src/managers/NightSession.js: reloj de seis minutos y resolución de la partida.
- src/managers/MonsterManager.js: grafo de salas, decisiones probabilísticas, ataque y retirada.
- src/managers/SurveillanceManager.js: puerta, linterna y monitor.
- src/managers/ProgressManager.js: persistencia local.
- src/ui/SurveillanceUI.js: botones y atajos.
- src/ui/CameraInterference.js: ruido visual e interferencias.
- src/audio/AudioManager.js: reproducción, mute y limpieza.
- src/objects/FanEffect.js: aspas animadas, rejilla fija y adaptación al encuadre.
- src/config.js: catálogo de cámaras y selección de imágenes.
- public/assets/images/: escenarios y variantes del wendigo.
- public/assets/audio/: efectos OGG y ambiente WAV.
- tests/monster.test.js: pruebas de IA, reloj, retirada, ataque y final de partida.

Arcade Physics permanece habilitado para desarrollo posterior. La amenaza actual se representa mediante estados de salas e imágenes, sin colisiones físicas. La batería compartida limita puerta, linterna y cámaras. `PowerManager` centraliza sus tasas y `ShiftSimulation` integra consumo, cierre físico y ataques con el mismo tiempo transcurrido.

## Créditos y trabajo académico

Los escenarios y variantes se generaron mediante image_gen.imagegen, usando las referencias del autor. Los prompts están en docs/RECURSOS_GENERADOS.json, docs/VARIANTES_OFICINA.json, docs/CAMARA_BODEGA.json y docs/WENDIGO_RECURSOS.json. Las diez imágenes de pie se registran en docs/WENDIGO_DE_PIE_RECURSOS.json y las cuatro alternativas en suelo o techo en docs/WENDIGO_POSES_VARIADAS.json; las variantes anteriores se conservan como versiones previas y no se cargan en el juego.

Phaser y Vite conservan sus licencias. Los efectos de rubberduck son CC0, con fuentes en docs/AUDIO.md. El ambiente es síntesis original regenerable con `node scripts/generate-ambient.mjs`.

Los requisitos y entregables académicos pendientes están registrados en docs/REQUISITOS.md. No se considera la entrega académica final: faltan medir rendimiento en dispositivos reales y completar los demás entregables.


## Energía y supervivencia (modo 3D)

La noche dura 360000 ms. La batería empieza al 100 %, sin regeneración:

| Sistema activo | Consumo por segundo real |
| --- | --- |
| Linterna | 0,12 % |
| Cámaras abiertas | 0,18 % |
| Puerta cerrada | 0,52 % |
| Los tres simultáneamente | 0,82 % |

Los valores se ajustan en `src/managers/PowerManager.js`. La puerta sola agota la batería en aproximadamente 192,3 s y todo encendido en 122 s. Los avisos de 25 %, 10 % y 0 % se emiten una sola vez. A cero se apagan luz y monitor, se abre la puerta y se bloquean sus controles; caminar, mirar, girar, cocinar y entregar siguen disponibles. Agotarse no mata automáticamente: continúa el ataque normal con 15 s de exposición acumulada.

WASD mueve; clic en la sala captura el ratón, Esc lo libera; si el navegador rechaza la captura, arrastra para mirar; flechas izquierda/derecha permiten mirar sin ratón y V gira. F enciende la linterna desde cualquier punto y sigue la mirada. C abre/cierra el monitor; 1–4 cambia canal. X acciona la puerta solamente cerca del acceso. B/H/P/R preparan comida; E entrega al primer cliente esperando; T vacía la bandeja. Las teclas de acción ignoran la repetición al mantenerlas pulsadas.

Revisa CAM 04 para anticipar la llegada. Los pasos en el acceso y su aviso visual dejan tiempo para volver desde la cocina; cierra y espera el golpe/grito de retirada antes de reabrir. El monstruo conserva rutas conectadas y aleatorias; después de tres movimientos de patrulla o desde las 3 AM prioriza avanzar para evitar noches sin amenazas por azar.

Los clientes llegan cada 18 s (primero a los 4,5 s), caminan 9 s y esperan 32 s. Como máximo hay dos en la ventana; cuatro pedidos abandonados causan derrota. Estos valores están en `kitchenConfig.js`. La cocina no gasta batería. La preparación continúa mientras vigilas. Es posible defender el acceso y volver a entregar un pedido de tres productos dentro de la paciencia.

`npm test` incluye simulaciones a 15/30/60/144 FPS, agotamiento durante un frame largo, controles bloqueados, límites de hora, victoria/derrota, reinicio y 100 semillas para estrategias de defensa y puerta permanente. Las simulaciones de energía no sustituyen las pruebas visuales de pedidos y navegación.
