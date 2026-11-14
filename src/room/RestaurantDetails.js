import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Materiales derivados de las escenas originales y utilería con profundidad.
export class RestaurantDetails {
  constructor(room) {
    this.room=room;this.world=room.world;this.cache=new Map();this.actions=[];
    const {metal,wood,dark}=room.materials;
    const box=(...args)=>room.box(...args);
    const pmrem=new THREE.PMREMGenerator(room.renderer);
    const environment=new RoomEnvironment();
    this.environment=pmrem.fromScene(environment,.05);this.world.environment=this.environment.texture;
    this.world.environmentIntensity=.27;environment.dispose();pmrem.dispose();
    // Escritorio y utilería en las mismas posiciones que office.png.
    box(3.15,.09,.53,0,.88,-1.32,wood);
    for(const x of [-1.4,1.4])box(.12,.84,.43,x,.42,-1.32,wood);
    box(.58,1.75,.38,-1.37,.875,-1.59,metal);
    for(const y of [.35,.85,1.35]){
      box(.49,.025,.03,-1.37,y,-1.38,dark);
      box(.18,.035,.04,-1.37,y+.09,-1.36,metal);
    }
    for(let i=0;i<6;i++){
      const folder=this.photo('office',.12,.22+i*.009,.08,.105,.075,.13,-1.56+i*.065,1.9,-1.39-i*.025);
      folder.rotation.y=-.12+i*.025;
    }
    for(const z of [-1.43,-1.7])for(const y of [1.78,1.84,2.04])box(.48,.008,.008,-1.37,y,z,dark);
    for(let i=0;i<6;i++)for(const z of [-1.43,-1.7])box(.006,.28,.006,-1.59+i*.085,1.91,z,dark);
    const crt=this.filePlane('prop-crt-photo.png',.66,.55,-.96,1.185,-1.1);
    crt.userData.action='monitor';this.actions.push(crt);
    box(.5,.43,.24,-.96,1.14,-1.26,new THREE.MeshStandardMaterial({map:this.load('room-steel-photo.png'),color:'#73634a',roughness:.85}));
    this.filePlane('prop-fan-photo.png',.46,.65,1.04,1.245,-1.14);
    const lampMaterial=new THREE.MeshStandardMaterial({map:this.load('room-steel-photo.png'),color:'#9b7045',metalness:.7,roughness:.38,side:THREE.DoubleSide});
    const shade=new THREE.Mesh(new THREE.ConeGeometry(.24,.24,48,1,true),lampMaterial);
    shade.position.set(1.18,2.25,-1.25);this.world.add(shade);
    box(.025,.33,.025,1.18,2.49,-1.25,dark);
    const task=new THREE.PointLight('#ffbd70',3,3.4,2);task.position.set(1.18,2.08,-1.22);this.world.add(task);
    // Vaso, pajita, libreta y papeles sobre la madera.
    this.cylinder(.055,.043,.19,-.59,1.02,-1.17,new THREE.MeshStandardMaterial({color:'#c5ae82',roughness:.8}));
    this.cylinder(.057,.057,.013,-.59,1.12,-1.17,metal);
    this.cylinder(.004,.004,.15,-.57,1.19,-1.17,new THREE.MeshStandardMaterial({color:'#8e3827'}));
    this.photo('office',.34,.15,.37,.79,.21,.065,0,.938,-1.14,-Math.PI/2,0);
    box(.29,.025,.2,.56,.946,-1.21,new THREE.MeshStandardMaterial({color:'#c6b28b',roughness:.9}));
    this.photo('office',.28,.19,.585,.765,.084,.105,.56,.96,-1.21,-Math.PI/2);
    const switchPlate=this.photo('office',.31,.45,.726,.351,.055,.12,.99,1.38,-1.598);
    switchPlate.userData.action='door';this.actions.push(switchPlate);
    // La persiana usa exactamente la superficie fotografiada del juego 2D.
    const shutter=this.photo('office-closed',1.24,2.26,.325,.05,.352,.695,0,1.14,-1.705);
    room.doorGroup.attach(shutter);
    this.photo('office',1.65,2.5,.326,.045,.35,.69,0,1.32,-5.99);
    // Franja de cerámica burdeos, conservada en las cuatro paredes.
    for(const x of [-1.69,1.69]){
      const stripe=this.photo('office',3.6,.18,.005,.225,.28,.06,x,1.59,0);
      stripe.rotation.y=x<0?Math.PI/2:-Math.PI/2;
    }
    for(const x of [-1.18,1.18])this.photo('office',1.03,.18,.005,.225,.28,.06,x,1.59,-1.78);
    // La calle, toldo y carta proceden de kitchen-stall.png, sin reemplazarlos por una pared vacía.
    this.photo('kitchen-stall',4,2.6,.335,.08,.44,.52,0,1.58,4.43,0,Math.PI);
    this.photo('kitchen-stall',2.23,.24,.23,.028,.625,.06,0,2.2,1.69,0,Math.PI);
    this.photo('kitchen-stall',.42,1.18,.878,.03,.115,.43,-1.41,1.69,1.66,0,Math.PI);
    this.photo('kitchen-stall',.63,.45,.23,.085,.15,.2,1.37,1.84,1.655,0,Math.PI);
    // Acero con arañazos; los equipos ya son mallas y ahora reciben materiales fotográficos.
    box(.65,.1,.75,1.32,.94,1.13,metal);
    box(.78,.16,.6,1.3,2.31,1.12,metal);
    box(.23,.38,.23,1.3,2.54,1.36,metal);
    const grill=box(.56,.035,.55,1.32,1.01,1.12,dark);grill.userData.action='burger';this.actions.push(grill);
    for(let i=0;i<11;i++)box(.018,.025,.51,1.07+i*.046,1.04,1.12,metal);
    for(const z of [.98,1.24])this.cylinder(.095,.095,.018,1.32,1.065,z,new THREE.MeshStandardMaterial({color:'#51301e',roughness:.8}));
    for(let i=0;i<4;i++){
      const tray=box(.34,.045,.22,.65-i*.4,.995,1.46,metal);
      const ingredient=this.photo('kitchen-stall',.31,.19,.24+i*.115,.758,.112,.12,.65-i*.4,1.024,1.46,-Math.PI/2);
      ingredient.rotation.z=Math.PI;
      tray.userData.action=['burger','burger','hotdog','hotdog'][i];this.actions.push(tray);
    }
    for(const [x,color] of [[-.82,'#9d2c20'],[-.96,'#d5a72d'],[-1.1,'#d2c3a4']]){
      const m=new THREE.MeshStandardMaterial({color,roughness:.4});this.cylinder(.035,.04,.2,x,1.08,1.62,m);this.cylinder(.009,.014,.08,x,1.22,1.62,m);
    }
    this.cylinder(.06,.06,.25,-1.2,1.1,1.62,metal);
    for(let i=0;i<7;i++)this.cylinder(.004,.004,.3,-1.23+(i%3)*.019,1.29,1.62+Math.floor(i/3)*.012,new THREE.MeshStandardMaterial({color:'#b53326'}));
    this.foodTray=new THREE.Group();this.world.add(this.foodTray);
    this.foodMaps=new Map();
    for(const [i,id] of ['burger','hotdog','fries','drink'].entries()){
      const map=this.load('food-photo-atlas.png').clone();map.offset.set((i%2)*.5,i<2?.5:0);map.repeat.set(.5,.5);map.needsUpdate=true;room.textures.add(map);this.foodMaps.set(id,map);
    }
    for(const [id,x,w,h] of [['burger',.97,.4,.32],['fries',-.58,.26,.3],['drink',-.85,.24,.35]]){
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:this.foodMaps.get(id),transparent:true,alphaTest:.04,side:THREE.DoubleSide,toneMapped:false}));
      mesh.position.set(x,.99+h/2,1.39);mesh.rotation.y=Math.PI;mesh.userData.action=id;this.world.add(mesh);this.actions.push(mesh);
    }
    const glass=new THREE.MeshPhysicalMaterial({color:'#e4dcc3',transparent:true,opacity:.12,roughness:.12,metalness:.1,depthWrite:false});
    box(.54,.39,.33,.97,1.16,1.45,glass);
    for(const x of [.7,1.24])box(.018,.39,.018,x,1.16,1.29,metal);
    box(.57,.035,.36,.97,.98,1.45,metal);box(.57,.018,.36,.97,1.365,1.45,metal);
    // Sillas rojas en el corredor: mismo lenguaje de restaurante que las cámaras.
    const booth=new THREE.MeshStandardMaterial({color:'#411e19',roughness:.65});
    for(const side of [-1,1])for(const z of [-4.2,-5.35]){
      box(.32,.38,.65,side*.68,.19,z,booth);box(.09,.62,.65,side*.81,.54,z,booth);
    }
  }

  load(file){
    if(this.cache.has(file))return this.cache.get(file);
    const t=this.room.loadTexture(file);this.cache.set(file,t);return t;
  }
  filePlane(file,w,h,x,y,z){
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:this.load(file),transparent:true,alphaTest:.05,side:THREE.DoubleSide,toneMapped:false}));
    mesh.position.set(x,y,z);this.world.add(mesh);return mesh;
  }
  photo(key,w,h,u,v,uw,vh,x,y,z,rx=0,ry=0){
    const t=this.room.texture(this.room.scene.textures.get(key).getSourceImage());t.offset.set(u,1-v-vh);t.repeat.set(uw,vh);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,toneMapped:false,side:THREE.DoubleSide}));
    mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,0);this.world.add(mesh);return mesh;
  }
  cylinder(rt,rb,h,x,y,z,m){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,32),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;this.world.add(mesh);return mesh;}
  update(){
    const ready=this.room.scene.kitchen.cooking.tray;
    if(this.trayKey===ready.join(','))return;this.trayKey=ready.join(',');
    for(const mesh of [...this.foodTray.children]){this.foodTray.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}
    ready.forEach((id,i)=>{
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.25,.25),new THREE.MeshBasicMaterial({map:this.foodMaps.get(id),transparent:true,alphaTest:.04,side:THREE.DoubleSide,toneMapped:false}));
      mesh.rotation.y=Math.PI;mesh.position.set(-.25+i*.25,1.14,1.25);this.foodTray.add(mesh);
    });
  }
  destroy(){this.environment.dispose();}
}
