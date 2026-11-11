# Requisitos del proyecto de primer bimestre

Fuente: ProyectoPrimerBimestre-2026-A.docx, Jaime Sayago-Heredia, Aplicaciones Web, EPN. Este registro resume la guía; sus requisitos no se consideran ya implementados ni sustituyen las instrucciones del autor.

## Alcance actual

Por indicación del autor, la primera iteración es un prototipo visual de terror y vigilancia en un restaurante de comida rápida: oficina con puerta frontal que se abre y cierra, linterna mediante variantes de imagen y cuatro cámaras con imágenes estáticas. Se conserva Phaser + JavaScript + Vite y la estructura modular. Se implementan IA probabilística, imágenes por sala, ataque a los 15 segundos de exposición abierta, retirada tras 5–15 segundos de cierre y victoria tras seis minutos hasta las 6 AM. La relación del diseño de vigilancia con los arquetipos de la guía queda por definir antes de la entrega.

## Arquetipos permitidos y decisiones pendientes

- Arcade shooter: disparos, oleadas, power-ups y vidas.
- Aventura top-down / RTS lite: IA básica, enemigos dinámicos y recolección; minimapa opcional.
- Puzzle de física 2D: objetos manipulables, interacción física y resolución progresiva.
- Plataforma 2D: saltos, plataformas, scroll lateral y checkpoints.

Tema definido por el autor: vigilancia nocturna estilo FNAF en restaurante de comida rápida. Nombre provisional: Último turno. Hay escenarios originales generados, cuatro variantes de oficina y controles de puerta, linterna y cámaras. La cámara 03 muestra una bodega; la cocina está detrás de la oficina y queda sin cámara. Falta definir adaptación al arquetipo, niveles adicionales y los demás requisitos académicos pendientes.

## Requisitos técnicos

- [x] Phaser.js y JavaScript; Vite como herramienta recomendada.
- [x] Estructura scenes, objects, ui, managers, assets, physics y audio.
- [x] Inicialización de Arcade Physics y contenedor adaptable inicial.
- [x] Loader de las imágenes activas; estado visual separado de la interfaz.
- [x] Puerta frontal, linterna y monitor con cuatro cámaras mediante botones y teclado.
- [ ] Escenas definitivas, loader de recursos y sistema de estados.
- [x] Menú principal y comienzo de una partida nueva.
- [x] Game Over, victoria y reinicio después del resultado.
- [ ] Pausa durante partida.
- [ ] Movimiento, colisiones, triggers, overlaps y rebotes o gravedad según arquetipo.
- [ ] Puntaje, HUD, enemigos o retos, victoria y derrota.
- [ ] localStorage: récord, nivel alcanzado y configuración de audio.
- [x] Ambiente de fondo, efectos de golpe y grito, y mute.
- [ ] Evaluar si se requiere una pista musical adicional para la entrega.
- [ ] Teclado y controles táctiles equivalentes.
- [ ] Verificación en escritorio, tablet y móvil. Scale.FIT por sí solo no demuestra compatibilidad.
- [ ] Medición de al menos 45 FPS, ausencia de bloqueos y carga eficiente de assets.
- [ ] Contraste adecuado, instrucciones visibles y controles documentados.
- [ ] Modularidad, reutilización, responsabilidades separadas, clases o módulos adecuados, nombres claros y comentarios explicativos.

## Entregables pendientes

- [x] Repositorio GitHub privado con código e historial de commits: https://github.com/ArielBC910/ultimo-turno-proyecto1b.
- [ ] ZIP ejecutable localmente.
- [ ] Video de 45 a 90 segundos con gameplay, menús, audio y funcionalidades.
- [ ] Entre 4 y 6 capturas de pantallas, niveles y mecánicas.
- [ ] README final con ejecución, controles, estructura y créditos.
- [ ] Autoevaluación con fortalezas, limitaciones y mejoras futuras.

No se ha creado ni publicado un repositorio remoto ni generado entregables de un juego terminado.

## Rúbrica

| Criterio | Peso |
| --- | ---: |
| Funcionalidad principal | 20% |
| Mecánicas | 15% |
| Física y colisiones | 10% |
| Arquitectura y modularidad | 15% |
| Rendimiento y optimización | 10% |
| UX/UI | 10% |
| Audio e inmersión | 5% |
| Responsividad y controles táctiles | 5% |
| Código limpio y documentación | 5% |
| README, video y presentación | 5% |

Bonus opcional de hasta +10%: multiplayer, leaderboard online, PWA, IA avanzada, generación procedural, shaders, minimapa, jefe final, inventario, guardado múltiple, ECS o API externa. No son necesarios para preparar el entorno.

## Restricciones y fecha del documento

La guía prohíbe plantillas completas descargadas, reutilizar proyectos completos de internet, entregar proyectos incompletos y generar el proyecto completo con IA sin comprensión técnica. Solicita autoría, creatividad y comprensión del framework y la arquitectura.

La fecha escrita en el archivo es 26 de mayo de 2026. Confirmar con el docente la fecha aplicable al curso actual.

Recursos sugeridos: Kenney para sprites, OpenGameArt para audio y Pixabay para música. Revisar licencias y créditos al seleccionar recursos.
