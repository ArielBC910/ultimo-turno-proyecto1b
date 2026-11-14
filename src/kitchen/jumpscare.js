// Se llama una vez por cada cliente zombie que se cansa de esperar sin ser atendido, justo después de
// llenar la barra de susto (scene.scare ya está actualizada). Aquí va la animación y el sonido del susto.
//   scene    -> OfficeScene (acceso a scene.add, scene.tweens, scene.registry.get('audio'), scene.scare...)
//   customer -> el zombie: customer.sprite es su imagen y customer.order su pedido (aún visible en este momento).
export function triggerJumpscare(scene, customer) {
  document.querySelector('.customer-jumpscare')?.remove();
  const overlay=document.createElement('div');overlay.className='customer-jumpscare';
  const image=document.createElement('img');image.src=scene.textures.get(customer.key).getSourceImage().src;image.alt='Un cliente se marchó sin su pedido';
  const caption=document.createElement('p');caption.textContent='NO LO ATENDISTE';overlay.append(image,caption);
  document.querySelector('#surveillance').append(overlay);
  scene.sound.play('wendigo-scream',{volume:.16,rate:1.2});
  scene.time.delayedCall(850,()=>overlay.remove());
  scene.events.once('shutdown',()=>overlay.remove());
}
