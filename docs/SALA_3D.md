# Habitación compacta

Sala de 3,4 × 3,6 m renderizada con Three.js, integrada en la escena Phaser existente. La puerta y el corredor están delante (Z negativa); la cocina y la ventana de atención están detrás (Z positiva). Paredes, dinteles, marcos, puerta corredera, suelo, techo, nevera, encimera, fregadero, grifo, fogones, estantes y conductos son geometría 3D con materiales e iluminación. La habitación ya no usa el lienzo de 480 × 270 ni fotografías completas en las paredes. Las fotografías siguen siendo los canales CCTV; los clientes y el monstruo son planos con textura dentro del espacio 3D.

- WASD: caminar con colisiones.
- Ratón: mirar sin mantener clic. Un clic en una zona vacía de la escena captura el cursor para girar sin límites; Esc lo libera. Abrir cámaras o acercarse a la cocina también libera el cursor para usar los botones. En pantalla táctil se conserva el arrastre y también funcionan las flechas.
- V: girarse 180°.
- C: abrir/cerrar las cámaras a pantalla completa con la interfaz 2D original. Se puede abrir desde cualquier lugar. La posición y orientación se conservan, el jugador deja de caminar y la preparación de comida continúa. Al cerrar se recupera la habitación 3D.
- 1–4: cambiar canal con el monitor abierto. Esc: cerrar monitor.
- Al acercarse mirando hacia la puerta, se habilitan X (puerta) y F (linterna). Alejarse o girarse apaga la linterna. La puerta conserva su estado.
- Al acercarse mirando hacia la ventana trasera, se activan preparación y entrega. B/H/P/R preparan hamburguesa/hot dog/papas/bebida; cada producto tiene un tiempo real. La bandeja admite tres productos entre pendientes y preparados. ENTREGAR exige un cliente que ya esté esperando y cantidades exactas; rechazar un pedido incorrecto no consume la comida. T vacía la bandeja y cancela la cola. La preparación continúa al girarse o abrir las cámaras.
- El monitor conserva la estática de 2,5 segundos al abandonar el monstruo una cámara. La imagen, el plano, los botones de canales y los filtros son los de la vista 2D; ya no se muestra como una ventana pequeña. La noche sigue avanzando. Verificado en navegador: apertura a pantalla completa, selección de Bodega y regreso a la sala. Captura: capturas-3d/camaras-pantalla-completa.jpg.

Recursos nuevos generados con image_gen integrado:

- `public/assets/images/room-floor-ceramic.png`: material de suelo cerámico nítido, con repetición, mipmaps y filtrado anisotrópico.
- `public/assets/images/hambriento-room-cutout.png`: criatura aprobada aislada para colocarla dentro del corredor modelado.

Prompts de generación:

Suelo: Asset type: seamless tileable game floor material, square texture. Photorealistic directly overhead orthographic scan of four large alternating off-white and very dark charcoal ceramic square tiles in a checkerboard 2x2 pattern. Restaurant back-office floor, slightly worn glazed ceramic, fine realistic surface speckles, narrow recessed dark grout, subtle scuffs and grime at grout. Crisp high resolution detail, evenly lit neutral diffuse light, no perspective, no vignette, no cast shadows, no objects, no text, no borders. All outer edges must tile seamlessly. Moderately aged but not destroyed, physically plausible ceramic material. Avoid drawing additional tiny tiles or decorative patterns.

Criatura: Use case: background-extraction. Extract ONLY the fictional wendigo monster from this attached image onto a fully transparent background. Preserve the same identity, severely emaciated upright hunched body, small tilted head, long broken-looking open jaw, sparse stringy hair, very long thin arms and fingers, dark grey mottled skin and sparse dark dried blood. Both arms hang at its sides, no hand on a frame. Full body including feet. Keep its exact eerie blurred low-light indistinct texture, shadowy mostly dark body, no bright eyes, no sharp glossy details. Remove ALL room, doorway, floor, furniture, lights and shadows on the environment. Character only, alpha cutout, no text or props. The monster is to be a barely visible sprite behind a fully modeled 3D doorway.

Actualización fotográfica: `RestaurantDetails.js` incorpora materiales fotográficos de cerámica, madera y acero, CRT y ventilador aislados, comida en atlas, y superficies de persiana, papel, carta, toldo y calle tomadas de las imágenes originales. Los seis recursos nuevos y sus prompts completos se documentan en ARTE_3D_RECURSOS.json; se generaron mediante image_gen integrado y se guardaron en public/assets/images. BootScene precarga todos los materiales para evitar objetos sin textura al empezar.

La sala mantiene geometría 3D simplificada y usa planos fotográficos en la utilería, clientes y criatura: no es una reconstrucción fotogramétrica ni un conjunto de modelos completos de alta resolución para todos los ángulos. Se conservaron las imágenes originales. El movimiento, la iluminación, las colisiones y la persiana son tridimensionales.

La persiana tarda 650 ms en cerrar y solo protege cuando el cierre físico está completo. Los clientes abandonados disparan imagen y sonido de susto; con cuatro fallos se pierde la noche. El resultado muestra el número de pedidos entregados.

Verificación final: 54 pruebas pasan, incluyendo preparación secuencial, cantidades repetidas, rechazo de entregas erróneas, cancelación de cola, cierre físico y bloqueo de controles fuera de alcance. Revisión real en el navegador: persiana cerrada visible; linterna activada y apagada al girarse; hamburguesa y bebida preparadas y entregadas con las cámaras abiertas, contador «1 entregados»; derrota por clientes con el total servido; sin errores de consola en la revisión final. Capturas: capturas-3d/oficina.jpg y capturas-3d/cocina.jpg. Los controles QA solo aparecen en desarrollo con ?qaRoom y no se incluyen en la versión de producción.
