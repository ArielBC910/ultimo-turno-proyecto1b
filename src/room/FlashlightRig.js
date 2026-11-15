import * as THREE from 'three';

// Modelo de primera persona, fijado a la cámara y sin sombras sobre sí mismo.
export class FlashlightRig extends THREE.Group {
  constructor() {
    super();
    const material=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness:.65,metalness,emissive:color,emissiveIntensity:.32,depthTest:true,depthWrite:true});
    const skin=material('#ae8262'), sleeve=material('#26342e'), metal=material('#303b37',.75), rubber=material('#121a17');
    const add=(geometry,m,x,y,z)=>{const mesh=new THREE.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.renderOrder=100;this.add(mesh);return mesh;};
    const oval=(m,x,y,z,sx,sy,sz)=>{const mesh=add(new THREE.SphereGeometry(1,16,12),m,x,y,z);mesh.scale.set(sx,sy,sz);return mesh;};
    const barrel=(r1,r2,length,z,m)=>{const mesh=add(new THREE.CylinderGeometry(r1,r2,length,24),m,0,0,z);mesh.rotation.x=Math.PI/2;return mesh;};
    oval(sleeve,.075,-.17,.18,.085,.19,.12).rotation.z=.35;
    oval(skin,.035,-.065,.075,.068,.1,.09).rotation.z=.25;
    barrel(.048,.045,.27,-.045,rubber);
    barrel(.078,.048,.105,-.22,metal);
    barrel(.082,.082,.018,-.277,rubber);
    const glass=new THREE.MeshBasicMaterial({color:'#fff0c7',depthTest:true,depthWrite:true});
    barrel(.066,.066,.006,-.289,glass);
    for(let i=0;i<6;i++)barrel(.051,.051,.008,.05-i*.028,metal);
    for(let i=0;i<4;i++){
      const finger=oval(skin,-.025,-.02+i*.018,.055-i*.03,.064,.014,.021);
      finger.rotation.z=-.25;
    }
    oval(skin,.05,.035,.015,.022,.055,.03).rotation.z=-.65;
    add(new THREE.BoxGeometry(.018,.008,.032),rubber,0,.049,-.03);
    this.position.set(.3,-.20,-.65);this.rotation.set(.10,.28,-.15);
    this.amount=0;this.visible=false;
  }
  update(delta,on,time,reducedMotion=false) {
    this.amount=THREE.MathUtils.damp(this.amount,on?1:0,18,Math.min(delta,100)/1000);
    this.visible=this.amount>.01;
    this.position.y=-.20-(1-this.amount)*.35+(reducedMotion?0:Math.sin(time*2)*.003);
  }
}
