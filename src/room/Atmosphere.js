import * as THREE from 'three';

// Una sola nube de partículas, sin luces ni objetos por mota.
export class Atmosphere {
  constructor(room) {
    this.room = room;
    const positions = new Float32Array(150 * 3);
    let seed = 910;
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (random() - .5) * 3.2;
      positions[i + 1] = random() * 2.6;
      positions[i + 2] = random() * 7.4 - 5.8;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dust = new THREE.Points(geometry, new THREE.PointsMaterial({color: '#bdad83', size: .009, transparent: true, opacity: .2, depthWrite: false}));
    room.world.add(this.dust);
    const { metal, dark } = room.materials;
    // Juntas del techo, soportes, cableado y luminarias del corredor.
    for (const z of [-2.5, -3.9, -5.3]) {
      room.box(1.7,.035,.04,0,2.63,z,metal);
      room.box(.62,.08,.22,0,2.58,z,dark);
      room.box(.49,.025,.15,0,2.53,z,new THREE.MeshStandardMaterial({color:'#c8d2ba',emissive:'#829b85',emissiveIntensity:.45}));
      const light = new THREE.PointLight('#8cab99', .32, 2.6, 2);
      light.position.set(0,2.38,z); room.world.add(light);
      for(const side of [-1,1]) {
        room.box(.035,.04,1.2,side*.81,.14,z,metal);
        room.box(.04,.035,1.2,side*.81,1.12,z,dark);
      }
    }
    this.corridorLight = new THREE.PointLight('#9a3323', .7, 4, 2);
    this.corridorLight.position.set(0,1.85,-5.8);room.world.add(this.corridorLight);
    for(const x of [-1.1,0,1.1]) room.box(.022,.018,3.6,x,2.64,0,dark);
    for(const z of [-1.2,0,1.2]) room.box(3.4,.018,.022,0,2.64,z,dark);
  }

  update(delta, time) {
    const {room} = this;
    const threat = room.scene.monster.location === 'door';
    room.keyLight.intensity =  .65 * (1 - (threat ? .16 : .035) * (Math.sin(time * 17) * Math.sin(time * 7) + 1));
    this.corridorLight.intensity = threat ? .95 : .55;
    if(!room.reducedMotion) this.dust.position.y = Math.sin(time * .12) * .08;
    this.dust.material.opacity = room.scene.state.lightOn ? .32 : .1;
  }
}
