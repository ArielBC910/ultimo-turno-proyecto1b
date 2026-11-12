// Elige qué zombie sale a continuación sin repetir hasta que hayan salido todos ("bolsa mezclada").

export class CustomerPicker {
   constructor(keys, rng = Math.random) {
      if (!keys.length) throw new Error('CustomerPicker necesita al menos una imagen de cliente');
      this.keys = [...keys];
      this.rng = rng;
      this.pending = []; // los que aún no han salido en esta ronda
      this.last = null;
   }

   // Devuelve el siguiente zombie. `exclude` son los que ya están en pantalla: se evitan si es posible
   // (se quedan en la bolsa para salir más tarde en la misma ronda).
   next(exclude = []) {
      if (this.pending.length === 0) this.refill();
      let index = this.pending.length - 1;
      while (index >= 0 && exclude.includes(this.pending[index])) index -= 1;
      if (index < 0) index = this.pending.length - 1; // todos los que quedan ya están en pantalla: se acepta repetir
      const [key] = this.pending.splice(index, 1);
      this.last = key;
      return key;
   }

   // Nueva ronda: todas las imágenes vuelven a estar disponibles, mezcladas (Fisher-Yates).
   refill() {
      const bag = [...this.keys];
      for (let i = bag.length - 1; i > 0; i -= 1) {
         const j = Math.floor(this.rng() * (i + 1));
         [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      const end = bag.length - 1;
      if (bag.length > 1 && bag[end] === this.last) [bag[0], bag[end]] = [bag[end], bag[0]];
      this.pending = bag;
   }
}