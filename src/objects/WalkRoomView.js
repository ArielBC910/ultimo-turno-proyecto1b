import * as THREE from 'three';
import { RoomNavigation, ROOM } from '../room/navigation.js';
import { getSurveillanceTexture, getMonsterPose, CAMERAS } from '../config.js';
import { FACING } from '../kitchen/kitchenConfig.js';
import { orderEmojis, PRODUCTS, PRODUCT_IDS } from '../kitchen/orders.js';
import { DoorMotion } from '../room/DoorMotion.js';
import { RestaurantDetails } from '../room/RestaurantDetails.js';

// La sala y sus muebles son mallas 3D. Las cámaras conservan sus fotografías de vigilancia.
export class WalkRoomView {
  constructor(scene) {
    this.scene = scene;
    this.nav = new RoomNavigation();
    this.doorMotion = new DoorMotion();
    this.keys = new Set();
    this.abort = new AbortController();
    this.textures = new Set();
    this.customerMeshes = new Map();
    this.customerTextures = new Map();
    this.world = new THREE.Scene();
    this.world.background = new THREE.Color('#0e100e');
    this.world.fog = new THREE.Fog('#0e100e', 7, 16);
    this.camera = new THREE.PerspectiveCamera(59, 1, .05, 24);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.host = document.createElement('div'); this.host.id = 'room-world';
    this.host.append(this.renderer.domElement);
    document.querySelector('#surveillance').append(this.host);
    this.build();
    this.details = new RestaurantDetails(this);
    this.buildHUD();
    this.bindInput();
    this.fit();
  }

  texture(source) {
    const t = new THREE.Texture(source); t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); t.needsUpdate = true;
    this.textures.add(t); return t;
  }

  loadTexture(file) { return this.texture(this.scene.textures.get('room-photo:' + file).getSourceImage()); }

  box(w,h,d,x,y,z,material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
    mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true;
    this.world.add(mesh); return mesh;
  }

  wallTexture() {
    const t=this.loadTexture('room-wall-photo.png');
    t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(2,1.5);t.anisotropy=this.renderer.capabilities.getMaxAnisotropy();this.textures.add(t);return t;
  }

  label(text,w=.85,h=.17) {
    const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=96;
    const c=canvas.getContext('2d'); c.fillStyle='#17241e'; c.fillRect(0,0,512,96);
    c.strokeStyle='#9c9e7b'; c.lineWidth=5; c.strokeRect(5,5,502,86);
    c.fillStyle='#d5d7b6'; c.textAlign='center'; c.font='bold 32px monospace'; c.fillText(text,256,59);
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({ map:this.texture(canvas) }));
  }

  build() {
    const tileMap=this.wallTexture();
    this.wallMaterial=new THREE.MeshStandardMaterial({ map:tileMap, bumpMap:tileMap, bumpScale:.006, roughness:.55 });
    const steelMap=this.loadTexture('room-steel-photo.png');
    const metal=new THREE.MeshStandardMaterial({map:steelMap,bumpMap:steelMap,bumpScale:.007,color:'#b8b2a2',metalness:.5,roughness:.47});
    const dark=new THREE.MeshStandardMaterial({color:'#232c28',metalness:.45,roughness:.7});
    const woodMap=this.loadTexture('room-wood-photo.png');
    const wood=new THREE.MeshStandardMaterial({map:woodMap,bumpMap:woodMap,bumpScale:.008,roughness:.53});
    this.materials={metal,dark,wood};
    const red=new THREE.MeshStandardMaterial({color:'#49312a',roughness:.7});
    const floorMap=this.loadTexture('room-floor-ceramic.png');
    floorMap.colorSpace=THREE.SRGBColorSpace; floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;
    floorMap.repeat.set(3.4,3.6); floorMap.anisotropy=this.renderer.capabilities.getMaxAnisotropy(); this.textures.add(floorMap);
    const floorMat=new THREE.MeshStandardMaterial({ map:floorMap, roughness:.43, metalness:.08 });
    this.box(3.4,.12,3.6,0,-.06,0,floorMat);
    this.box(3.4,.12,3.6,0,2.71,0,new THREE.MeshStandardMaterial({color:'#666b5f',roughness:.96}));
    for(const side of [-1,1]) {
      this.box(.12,2.65,3.72,side*1.76,1.325,0,this.wallMaterial);
      this.box(.025,.19,3.6,side*1.692,1.17,0,red);
      this.box(.05,.13,3.6,side*1.68,.065,0,dark);
      // Conductos y zócalos tienen volumen y proyectan sombra.
      this.box(.12,.12,3.5,side*1.58,2.42,0,metal);
      for(const z of [-1.2,0,1.2]) this.box(.19,.2,.035,side*1.59,2.42,z,dark);
    }
    // Frente: abertura real entre dos paños y un dintel.
    for(const side of [-1,1]) {
      this.box(1.04,2.65,.15,side*1.18,1.325,-1.87,this.wallMaterial);
      this.box(.09,2.35,.23,side*.68,1.175,-1.77,metal);
    }
    this.box(1.32,.35,.15,0,2.475,-1.87,this.wallMaterial);
    this.box(1.45,.09,.23,0,2.34,-1.77,metal);
    // Puerta corredera metálica: se levanta, no es una fotografía de la oficina.
    this.doorGroup=new THREE.Group(); this.world.add(this.doorGroup);
    this.doorPanel=this.box(1.26,2.28,.09,0,1.14,-1.8,dark); this.doorGroup.attach(this.doorPanel);
    for(let i=0;i<10;i++) this.doorGroup.attach(this.box(1.19,.025,.03,0,.15+i*.21,-1.733,metal));
    const access=this.label('ACCESO'); access.position.set(0,2.5,-1.775); this.world.add(access);
    // Corredor tridimensional detrás de la puerta.
    this.box(1.65,.1,4.2,0,-.05,-3.95,floorMat);
    this.box(1.85,.1,4.2,0,2.7,-3.95,new THREE.MeshStandardMaterial({color:'#393b30',roughness:.95}));
    for(const side of [-1,1]) this.box(.12,2.65,4.2,side*.88,1.325,-3.95,this.wallMaterial);
    this.box(1.85,2.65,.1,0,1.325,-6.05,dark);
    const monsterMap=this.loadTexture('hambriento-room-cutout.png');
    monsterMap.colorSpace=THREE.SRGBColorSpace; this.textures.add(monsterMap);
    this.creature=new THREE.Mesh(new THREE.PlaneGeometry(1.28,2.4),new THREE.MeshBasicMaterial({map:monsterMap,transparent:true,depthWrite:false,color:'#69716b',alphaTest:.025}));
    this.creature.position.set(0,1.2,-3.1); this.world.add(this.creature);
    // Fondo: cocina y ventana de atención en el lado opuesto al acceso.
    for(const side of [-1,1]) this.box(.62,2.65,.15,side*1.39,1.325,1.87,this.wallMaterial);
    this.box(2.16,.85,.15,0,.425,1.87,this.wallMaterial);
    this.box(2.16,.48,.15,0,2.41,1.87,this.wallMaterial);
    this.box(2.2,.09,.65,0,.94,1.52,metal);
    this.box(2.1,.78,.48,0,.46,1.56,dark);
    for(const side of [-1,1]) this.box(.06,1.33,.15,side*1.09,1.52,1.78,metal);
    this.box(2.25,.08,.16,0,2.2,1.78,metal);
    const kitchenLabel=this.label('COCINA / PEDIDOS',1.35); kitchenLabel.rotation.y=Math.PI; kitchenLabel.position.set(0,2.4,1.775); this.world.add(kitchenLabel);
    // Exterior visible a través de la ventana: profundidad real, con clientes en el vano.
    this.box(4,.1,3,0,-.1,3.3,dark);
    this.box(4,2.6,.1,0,1.3,4.5,new THREE.MeshStandardMaterial({color:'#303b36',roughness:.9}));
    this.box(.15,2.6,3,-1.85,1.3,3.1,dark); this.box(.15,2.6,3,1.85,1.3,3.1,dark);
    // Nevera lateral, encimera, fregadero, grifo, fogones y estantes modelados.
    this.box(.56,1.95,.75,-1.4,.975,.9,metal);
    this.box(.03,.65,.04,-1.09,1.25,.7,dark);
    this.box(.56,.85,1.7,1.4,.425,.65,dark);
    this.box(.62,.07,1.8,1.39,.89,.65,metal);
    this.box(.44,.025,.45,1.38,.935,.9,dark);
    this.box(.035,.3,.035,1.58,1.09,.88,metal); this.box(.22,.035,.035,1.49,1.24,.88,metal);
    for(const z of [.05,.43]) {
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.13,.017,8,24),dark); ring.rotation.x=Math.PI/2; ring.position.set(1.36,.945,z); this.world.add(ring);
    }
    for(const y of [1.55,1.98]) {
      this.box(.32,.05,1.2,1.52,y,.7,metal);
      for(let i=0;i<4;i++) this.box(.13,.22,.15,1.5,y+.13,.3+i*.24,i%2 ? red : wood);
    }
    // Pequeño panel físico junto al acceso, con botones y pilotos.
    this.box(.3,.45,.1,.99,1.38,-1.71,dark);
    for(const [y,color] of [[1.5,'#9eb582'],[1.3,'#9f3d27']]) this.box(.1,.1,.03,.99,y,-1.64,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.25}));
    const fixture=new THREE.MeshStandardMaterial({color:'#e4dfb7',emissive:'#d6d0ab',emissiveIntensity:1.5});
    this.box(.8,.055,.19,0,2.57,0,fixture);
    const light=new THREE.PointLight('#ffcf8e',6.5,8,2); light.position.set(.3,2.35,-.4); light.castShadow=true; light.shadow.mapSize.set(2048,2048); light.shadow.bias=-.0006; this.world.add(light);
    const kitchenLight=new THREE.PointLight('#8ab4bb',5,7,2); kitchenLight.position.set(0,2,2.6); this.world.add(kitchenLight);
    this.world.add(new THREE.HemisphereLight('#d2bda0','#30251e',.45));
    this.flashlight=new THREE.SpotLight('#fff1c9',0,9,.42,.6,1.5); this.flashlight.position.set(0,1.5,-1.2); this.flashlight.target.position.set(0,1.1,-4); this.world.add(this.flashlight,this.flashlight.target);
  }

  buildHUD() {
    this.hud=document.createElement('section'); this.hud.className='walk-hud room-hud';
    this.hud.innerHTML='<div class="walk-title">SALA DE SEGURIDAD<small>ACCESO AL FRENTE · COCINA DETRÁS</small></div><span class="walk-reticle" aria-hidden="true">+</span><p class="room-context" role="status"></p><div class="room-actions"><button data-action="monitor">C · CÁMARAS</button><button data-action="door">X · PUERTA</button><button data-action="light">F · ALUMBRAR</button><button data-action="turn">V · DARSE LA VUELTA</button></div><p class="walk-help">WASD · CAMINAR <span>RATÓN · MIRAR SIN CLIC</span> ACÉRCATE PARA USAR LA PUERTA O LA COCINA</p><div class="walk-touch"><button data-walk="KeyW">▲</button><button data-walk="KeyA">◀</button><button data-walk="KeyS">▼</button><button data-walk="KeyD">▶</button><button data-walk="ArrowLeft">↶</button><button data-walk="ArrowRight">↷</button></div><div class="room-orders" hidden></div>';
    this.monitor=document.createElement('section'); this.monitor.className='portable-monitor'; this.monitor.hidden=true;
    this.monitor.setAttribute('aria-label','Monitor portátil de cámaras');
    this.monitor.innerHTML='<header><span class="portable-name"></span><button class="portable-close" aria-label="Cerrar cámaras">✕</button></header><div class="portable-feed"><canvas width="640" height="360"></canvas><span class="portable-lost" role="status" hidden>SEÑAL PERDIDA<br>RESTABLECIENDO CONEXIÓN</span></div><nav>'+CAMERAS.map(c=>`<button data-feed="${c.key}">${c.number} · ${c.name}</button>`).join('')+'</nav>';
    const root=document.querySelector('#surveillance'); root.append(this.hud,this.monitor);
    this.feed=this.monitor.querySelector('canvas'); this.feedContext=this.feed.getContext('2d');
    this.context=this.hud.querySelector('.room-context'); this.orders=this.hud.querySelector('.room-orders');
    this.orders.innerHTML='<header><strong>PREPARACIÓN</strong><span class="served-count"></span></header><div class="food-buttons">'+PRODUCT_IDS.map((id,i)=>`<button data-product="${id}">${PRODUCTS[id].emoji} ${PRODUCTS[id].label}<kbd>${['B','H','P','R'][i]}</kbd></button>`).join('')+'</div><div class="prep-status"></div><div class="prep-track"><div></div></div><div class="food-tray"><span></span><button data-clear>VACIAR · T</button></div><div class="customer-orders"></div><p class="kitchen-feedback" role="status"></p>';
    this.orders.setAttribute('aria-label','Preparar y entregar pedidos');
    if(import.meta.env.DEV && new URLSearchParams(location.search).has('qaRoom')){
      this.qa=document.createElement('div');this.qa.className='room-qa';
      this.qa.innerHTML='<button data-qa="door">QA acceso</button><button data-qa="kitchen">QA cocina</button><button data-qa="customer">QA pedido</button>';
      this.hud.append(this.qa);
    }
  }

  bindInput() {
    const options={signal:this.abort.signal};
    this.qa?.addEventListener('click',event=>{
      const action=event.target.dataset.qa;
      if(action==='door'){this.nav.x=0;this.nav.y=-.74;this.nav.angle=-Math.PI/2;this.pitch=0;}
      if(action==='kitchen'){this.nav.x=0;this.nav.y=.78;this.nav.angle=Math.PI/2;this.pitch=-.06;}
      if(action==='customer'){
        for(const c of this.scene.kitchen.getCustomers())this.scene.kitchen.dismiss(c);
        this.scene.time.delayedCall(450,()=>{
          const c=this.scene.kitchen.spawnCustomer('customer-01',{items:['burger','drink']});
          if(c){c.arrival.stop();c.p=1;this.scene.kitchen.startWaiting(c);}
        });
      }
      this.syncStation();
    },options);
    this.orders.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.dataset.product)this.prepare(button.dataset.product);
      else if(button.dataset.serve)this.serve(Number(button.dataset.serve));
      else if(button.hasAttribute('data-clear')){this.scene.kitchen.cooking.clear();this.feedback('BANDEJA VACIADA');}
    },options);
    for(const button of this.hud.querySelectorAll('[data-action]')) button.addEventListener('click',()=>{
      if(button.dataset.action==='monitor') this.scene.ui.toggleMonitor();
      else if(button.dataset.action==='turn') this.turnAround();
      else this.scene.ui.perform(button.dataset.action==='door'?'toggleDoor':'toggleLight');
    },options);
    this.monitor.querySelector('.portable-close').addEventListener('click',()=>this.scene.ui.toggleMonitor(),options);
    for(const button of this.monitor.querySelectorAll('[data-feed]')) button.addEventListener('click',()=>{this.scene.state.selectCamera(button.dataset.feed);this.scene.ui.sync();},options);
    window.addEventListener('keydown',event=>{
      if(!this.active||event.ctrlKey||event.altKey||event.metaKey||/INPUT|TEXTAREA/.test(event.target.tagName))return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight'].includes(event.code)){this.keys.add(event.code);event.preventDefault();}
      if(!event.repeat&&this.scene.state.station==='kitchen'){
        const product={KeyB:'burger',KeyH:'hotdog',KeyP:'fries',KeyR:'drink'}[event.code];
        if(product){event.preventDefault();this.prepare(product);}
        if(event.code==='KeyT'){event.preventDefault();this.scene.kitchen.cooking.clear();this.feedback('BANDEJA VACIADA');}
        if(event.code==='KeyE'){event.preventDefault();const customer=this.scene.kitchen.getCustomers().find(c=>c.wait);if(customer)this.serve(customer.id);}
      }
    },options);
    window.addEventListener('keyup',event=>this.keys.delete(event.code),options);
    window.addEventListener('blur',()=>{this.keys.clear();this.dragging=false;this.pointerX=null;this.releaseMouseLock();},options);
    const canvas=this.renderer.domElement;
    canvas.addEventListener('pointerdown',event=>{
      if(!this.active||event.button!==0)return;
      this.dragging=event.pointerType==='touch';this.pointerX=event.clientX;this.pointerY=event.clientY;this.pointerStart={x:event.clientX,y:event.clientY};
      if(this.dragging)canvas.setPointerCapture(event.pointerId);
    },options);
    canvas.addEventListener('pointerup',event=>{
      if(!this.active||event.button!==0)return;
      if(!this.pointerStart||Math.hypot(event.clientX-this.pointerStart.x,event.clientY-this.pointerStart.y)>5)return;
      const rect=canvas.getBoundingClientRect();const ray=new THREE.Raycaster();
      const locked=document.pointerLockElement===canvas;
      ray.setFromCamera(locked?new THREE.Vector2(0,0):new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),this.camera);
      const hit=ray.intersectObjects(this.details.actions)[0];
      if(!hit||hit.distance>3.5){if(event.pointerType!=='touch')this.requestMouseLock();return;}
      if(hit.object.userData.action==='monitor')this.scene.ui.toggleMonitor();
      else if(hit.object.userData.action==='door')this.scene.ui.perform('toggleDoor');
      else if(PRODUCT_IDS.includes(hit.object.userData.action))this.prepare(hit.object.userData.action);
    },options);
    // El ratón mira al pasar por la escena, sin mantener ningún botón pulsado.
    canvas.addEventListener('pointermove',event=>{
      if(!this.active||document.pointerLockElement===canvas||(event.pointerType==='touch'&&!this.dragging))return;
      if(this.pointerX!=null)this.look(event.clientX-this.pointerX,event.clientY-this.pointerY);
      this.pointerX=event.clientX;this.pointerY=event.clientY;
    },options);
    canvas.addEventListener('pointerleave',()=>{this.pointerX=null;},options);
    document.addEventListener('mousemove',event=>{
      if(this.active&&document.pointerLockElement===canvas)this.look(event.movementX,event.movementY);
    },options);
    document.addEventListener('pointerlockchange',()=>{this.pointerX=null;},options);
    for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{this.dragging=false;},options);
    for(const button of this.hud.querySelectorAll('[data-walk]')){
      button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);this.keys.add(button.dataset.walk);},options);
      for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>this.keys.delete(button.dataset.walk),options);
    }
  }

  turnAround(){this.nav.turnAround();this.pitch=0;this.syncStation();}
  look(dx,dy){this.nav.angle+=dx*.004;this.pitch=THREE.MathUtils.clamp((this.pitch??0)-dy*.0025,-.65,.65);}
  requestMouseLock(){
    const canvas=this.renderer.domElement;if(document.pointerLockElement===canvas)return;
    try{canvas.requestPointerLock?.()?.catch?.(()=>{});}catch{/* Mirar sin captura sigue disponible. */}
  }
  releaseMouseLock(){if(document.pointerLockElement===this.renderer.domElement)document.exitPointerLock();}
  prepare(id){if(this.scene.kitchen.prepare(id))this.feedback('PREPARANDO '+PRODUCTS[id].label.toUpperCase());else this.feedback('BANDEJA LLENA O FUERA DE LA COCINA');}
  serve(id){
    const result=this.scene.kitchen.serve(id);
    this.feedback({served:'PEDIDO ENTREGADO ✓',wrong:'EL PEDIDO NO COINCIDE · REVISA LA BANDEJA',preparing:'LA COMIDA TODAVÍA SE ESTÁ PREPARANDO',empty:'LA BANDEJA ESTÁ VACÍA','not-ready':'EL CLIENTE TODAVÍA SE ESTÁ ACERCANDO',gone:'EL CLIENTE YA SE FUE','out-of-reach':'ACÉRCATE A LA COCINA'}[result]);
  }
  feedback(text){this.feedbackText=text;this.feedbackUntil=performance.now()+3500;}
  setVisible(visible){
    if(this.active!==visible){this.keys.clear();this.pointerX=null;this.dragging=false;}
    this.active=visible;this.host.hidden=!visible;this.hud.hidden=!visible;
    this.monitor.hidden=true;
    if(!visible)this.releaseMouseLock();
  }
  fit(){const {width,height}=this.scene.scale;this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}

  syncStation(){
    const state=this.scene.state, station=this.nav.station()?.view??null;
    const facing=Math.sin(this.nav.angle)>.2?FACING.KITCHEN:FACING.BACK;
    if(state.station!==station||state.facing!==facing){state.station=station;state.facing=facing;if(station!=='door')state.lightOn=false;if(station==='kitchen')this.releaseMouseLock();this.scene.ui.sync();}
  }

  update(delta){
    this.doorMotion.update(delta,this.scene.state.doorClosed);
    if(!this.active)return;
    const k=code=>Number(this.keys.has(code));
    this.nav.move(k('KeyW')-k('KeyS'),k('KeyD')-k('KeyA'),k('ArrowRight')-k('ArrowLeft'),delta);
    this.syncStation();
    const state=this.scene.state;
    this.camera.position.set(this.nav.x,1.55,this.nav.y);
    this.camera.lookAt(this.nav.x+Math.cos(this.nav.angle),1.55+Math.tan(this.pitch??0),this.nav.y+Math.sin(this.nav.angle));
    this.doorGroup.position.y=(1-this.doorMotion.closed)*2.6;
    this.creature.visible=this.scene.monster.location==='door';
    this.creature.material.color.set(state.lightOn?'#b1b2a1':'#353d35');
    this.flashlight.intensity=state.lightOn?32:0;
    this.context.textContent=state.station==='door'?'ACCESO · X PARA LA PUERTA / F PARA ALUMBRAR':state.station==='kitchen'?'COCINA · VENTANA DE ATENCIÓN ACTIVA':'PUERTA AL FRENTE · COCINA DETRÁS · CÁMARAS DISPONIBLES CON C';
    for(const action of ['door','light'])this.hud.querySelector(`[data-action="${action}"]`).disabled=state.station!=='door';
    this.hud.querySelector('[data-action="monitor"]').textContent=state.monitorOpen?'C · CERRAR CÁMARAS':'C · CÁMARAS';
    this.hud.querySelector('[data-action="door"]').textContent=state.doorClosed?'X · ABRIR PUERTA':'X · CERRAR PUERTA';
    this.hud.querySelector('[data-action="light"]').setAttribute('aria-pressed',String(state.lightOn));
    this.syncCustomers();this.details.update();
    this.renderer.render(this.world,this.camera);
  }

  syncCustomers(){
    const customers=this.scene.kitchen.getCustomers();
    for(const [customer,mesh] of this.customerMeshes)if(!customers.includes(customer)){this.world.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();this.customerMeshes.delete(customer);}
    for(const customer of customers){
      let mesh=this.customerMeshes.get(customer);
      if(!mesh){
        if(!this.customerTextures.has(customer.key))this.customerTextures.set(customer.key,this.texture(this.scene.textures.get(customer.key).getSourceImage()));
        mesh=new THREE.Mesh(new THREE.PlaneGeometry(.64,1.6),new THREE.MeshStandardMaterial({map:this.customerTextures.get(customer.key),transparent:true,alphaTest:.05,side:THREE.DoubleSide,roughness:1}));mesh.rotation.y=Math.PI;this.world.add(mesh);this.customerMeshes.set(customer,mesh);
      }
      mesh.position.set((customer.xr-.5)*2.2,1.05,3.9-customer.p*1.65);
      mesh.visible=true;
    }
    this.orders.hidden=this.scene.state.station!=='kitchen';
    const cooking=this.scene.kitchen.cooking;
    const orderKey=customers.map(c=>c.id).join(',');
    const list=this.orders.querySelector('.customer-orders');
    if(this.orderKey!==orderKey){
      this.orderKey=orderKey;
      list.innerHTML=customers.length?customers.map(c=>`<div class="customer-order" data-order-card="${c.id}"><span>CLIENTE ${c.lane+1} · ${orderEmojis(c.order).join(' ')}<small></small></span><button data-serve="${c.id}">ENTREGAR</button></div>`).join(''):'<p>ESPERANDO CLIENTES</p>';
    }
    for(const c of customers){
      const card=list.querySelector(`[data-order-card="${c.id}"]`);
      card.querySelector('small').textContent=c.wait?Math.ceil(20*(1-c.wait.getValue()))+' s':'ACERCÁNDOSE';
      card.querySelector('button').disabled=!c.wait;
    }
    this.orders.querySelector('.served-count').textContent=cooking.served+' ENTREGADOS';
    this.orders.querySelector('.prep-status').textContent=cooking.queue.length?'PREPARANDO '+PRODUCTS[cooking.queue[0]].label.toUpperCase()+' · COLA '+cooking.queue.length:'LISTO PARA PREPARAR';
    this.orders.querySelector('.prep-track div').style.width=cooking.progress*100+'%';
    this.orders.querySelector('.food-tray span').textContent='BANDEJA: '+(cooking.tray.map(id=>PRODUCTS[id].emoji).join(' ')||'VACÍA');
    for(const button of this.orders.querySelectorAll('[data-product]'))button.disabled=cooking.queue.length+cooking.tray.length>=3;
    this.orders.querySelector('.kitchen-feedback').textContent=performance.now()<this.feedbackUntil?this.feedbackText:'';
  }

  drawMonitor(delta){
    const state=this.scene.state;this.monitor.hidden=!state.monitorOpen;if(!state.monitorOpen)return;
    this.feedElapsed=(this.feedElapsed??0)+delta;if(this.feedElapsed<80)return;this.feedElapsed=0;
    const lost=this.scene.signal.isLost(state.camera,this.scene.session.elapsed);
    this.monitor.classList.toggle('feed-lost',lost);this.monitor.querySelector('.portable-lost').hidden=!lost;
    const c=this.feedContext;
    if(lost){const data=c.createImageData(160,90);for(let i=0;i<data.data.length;i+=4){const v=Math.random()*190;data.data[i]=v;data.data[i+1]=v;data.data[i+2]=v;data.data[i+3]=255;}this.noiseCanvas??=document.createElement('canvas');this.noiseCanvas.width=160;this.noiseCanvas.height=90;this.noiseCanvas.getContext('2d').putImageData(data,0,0);c.drawImage(this.noiseCanvas,0,0,640,360);}
    else{const key=getSurveillanceTexture({...state,monitorOpen:true},this.scene.monster.location,getMonsterPose(this.scene.monster));c.drawImage(this.scene.textures.get(key).getSourceImage(),0,0,640,360);}
    const cam=CAMERAS.find(item=>item.key===state.camera);this.monitor.querySelector('.portable-name').textContent='CAM '+cam.number+' / '+cam.name;
    for(const button of this.monitor.querySelectorAll('[data-feed]')){button.classList.toggle('selected',button.dataset.feed===state.camera);button.setAttribute('aria-pressed',String(button.dataset.feed===state.camera));}
  }

  destroy(){
    this.releaseMouseLock();
    this.details.destroy();
    this.abort.abort();this.hud.remove();this.monitor.remove();this.host.remove();
    this.world.traverse(object=>{object.geometry?.dispose();if(object.material){for(const m of Array.isArray(object.material)?object.material:[object.material])m.dispose();}});
    for(const texture of this.textures)texture.dispose();this.renderer.dispose();this.renderer.forceContextLoss();
  }
}
