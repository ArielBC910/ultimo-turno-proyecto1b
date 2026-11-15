import * as THREE from 'three';

// Relieve articulado: conserva los rostros y vestuario originales, con volumen,
// normales y sombras. No pretende sustituir el arte por un humanoide genérico.
export class CharacterActor extends THREE.Group {
  constructor(map, { monster = false } = {}) {
    super();
    this.monster = monster;
    const width = monster ? 1.28 : .72, height = monster ? 2.4 : 1.8;
    const geometry = new THREE.PlaneGeometry(width, height, 32, 48);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) / width * 2;
      const y = positions.getY(i) / height + .5;
      const torso = Math.exp(-(((y - .57) / .27) ** 2));
      const head = Math.exp(-(((y - .87) / .13) ** 2));
      positions.setZ(i, Math.sqrt(Math.max(0, 1 - x * x)) * (.05 + torso * .15 + head * .12));
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ map, transparent: true,
      alphaTest: .12, side: THREE.DoubleSide, roughness: .94 });
    this.body = new THREE.Mesh(geometry, material);
    this.body.position.y = height / 2;
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.body.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: .12, side: THREE.DoubleSide });
    this.add(this.body);
  }

  animate(time, walking = 0, urgency = 0, reducedMotion = false) {
    const amount = reducedMotion ? 0 : 1;
    this.body.rotation.z = Math.sin(time * (this.monster ? 1.7 : 2.1)) * (.008 + walking * .025) * amount;
    this.body.rotation.x = Math.sin(time * 1.3) * .015 * amount;
    this.body.scale.y = 1 + Math.sin(time * 2.2) * .006 * amount;
    this.body.position.z = Math.sin(time * 3) * urgency * .025 * amount;
  }

  dispose() {
    this.body.geometry.dispose();
    this.body.material.dispose();
    this.body.customDepthMaterial.dispose();
  }
}
