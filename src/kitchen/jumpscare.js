// Se llama una vez por cada cliente zombie que se cansa de esperar sin ser atendido, justo después de
// llenar la barra de susto (scene.scare ya está actualizada). Aquí va la animación y el sonido del susto.
//   scene    -> OfficeScene (acceso a scene.add, scene.tweens, scene.registry.get('audio'), scene.scare...)
//   customer -> el zombie: customer.sprite es su imagen y customer.order su pedido (aún visible en este momento).
export function triggerJumpscare(scene, customer) {
  // TODO(equipo): mostrar el jumpscare.
  void scene;
  void customer;
}
