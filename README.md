# Último turno

Repositorio: [ArielBC910/ultimo-turno-proyecto1b](https://github.com/ArielBC910/ultimo-turno-proyecto1b).

Juego de vigilancia nocturna en un restaurante de comida rápida, con JavaScript, Phaser 3.90 y Vite 7. Sobrevive seis minutos reales, desde las 12:00 AM hasta las 6:00 AM, vigilando cuatro cámaras, iluminando el acceso y cerrando la puerta cuando se acerque el wendigo.

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
3. Usa la linterna: sin ella el acceso central queda casi negro.
4. Si el wendigo llega al acceso, cierra la puerta. Tras entre 5 y 15 segundos continuos de cierre, se retira: escucharás un golpe metálico y un grito.
5. Sobrevive hasta las 6:00 AM. Al ganar o perder puedes volver al menú o iniciar otra partida.

| Acción | Botón | Teclado |
| --- | --- | --- |
| Abrir/cerrar la puerta | Cerrar puerta / Abrir puerta | D |
| Encender/apagar la linterna | Iluminar | F |
| Abrir/cerrar el monitor | Cámaras / Volver a oficina | C |
| Cerrar el monitor | Volver a oficina | Escape |
| Elegir cámara | Lista o plano | 1–4 |
| Silenciar/reactivar audio | Audio activado / Activar audio | Botón accesible con Tab |

Cada segundo real equivale a un minuto del reloj del juego. La duración total es exactamente 360000 ms. El reloj sigue contando si cambias de pestaña; volver al menú abandona esa partida.

Frente al acceso, el wendigo mata tras acumular 15 segundos con la puerta abierta durante esa visita. Cerrar bloquea el ataque; reabrir antes de que se retire conserva el tiempo de exposición ya acumulado y cancela el intervalo de retirada. La linterna sirve para verlo y no lo ahuyenta.

La IA toma decisiones entre salas conectadas, con mayor probabilidad de acercarse a la oficina y mayor actividad al avanzar la noche. Puede explorar y retroceder. Al retirarse elige comedor, mostrador o bodega; nunca el acceso ni el pasillo inmediato.

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

Arcade Physics permanece habilitado para desarrollo posterior. La amenaza actual se representa mediante estados de salas e imágenes, sin colisiones físicas. No se han añadido batería ni consumo de energía; la puerta puede mantenerse cerrada.

## Créditos y trabajo académico

Los escenarios y variantes se generaron mediante image_gen.imagegen, usando las referencias del autor. Los prompts están en docs/RECURSOS_GENERADOS.json, docs/VARIANTES_OFICINA.json, docs/CAMARA_BODEGA.json y docs/WENDIGO_RECURSOS.json.

Phaser y Vite conservan sus licencias. Los efectos de rubberduck son CC0, con fuentes en docs/AUDIO.md. El ambiente es síntesis original regenerable con `node scripts/generate-ambient.mjs`.

Los requisitos y entregables académicos pendientes están registrados en docs/REQUISITOS.md. No se considera la entrega académica final: faltan medir rendimiento en dispositivos reales y completar los demás entregables.
