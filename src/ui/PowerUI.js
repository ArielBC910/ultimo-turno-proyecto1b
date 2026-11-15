import { POWER } from '../managers/PowerManager.js';
export class PowerUI {
  constructor(power,state) {
    this.power=power;this.state=state;
    this.root=document.createElement('section');this.root.className='power-panel';
    this.root.setAttribute('aria-label','Batería compartida');
    this.root.innerHTML='<header><span>BATERÍA</span><strong></strong></header><progress max="100" aria-label="Carga restante"></progress><div class="power-load"></div><p class="power-notice" role="status" aria-live="polite"></p><p class="threat-notice" role="status" aria-live="polite"></p>';
    document.querySelector('#surveillance').append(this.root);
    this.percent=this.root.querySelector('strong');this.bar=this.root.querySelector('progress');
    this.load=this.root.querySelector('.power-load');this.notice=this.root.querySelector('.power-notice');
    this.threat=this.root.querySelector('.threat-notice');this.sync();
  }
  sync() {
    const charge=this.power.charge;
    this.percent.textContent=Math.ceil(charge)+' %';this.bar.value=charge;
    this.root.dataset.level=charge===0?'empty':charge<=POWER.critical?'critical':charge<=POWER.low?'low':'normal';
    const devices=[['lightOn','LINTERNA'],['monitorOpen','CÁMARAS'],['doorClosed','PUERTA']].filter(([key])=>this.state[key]).map(([,label])=>label);
    this.load.textContent=charge===0?'SISTEMAS SIN ENERGÍA':devices.length?devices.join(' + ')+' · '+this.power.rate(this.state).toFixed(2)+' %/s':'SIN CONSUMO';
  }
  event(type) {
    const messages={'power-low':'BATERÍA BAJA · Reabre la puerta tras la retirada.', 'power-critical':'RESERVA CRÍTICA · Usa cámaras y luz en intervalos breves.', 'power-empty':'SIN BATERÍA · Puerta abierta. Sigue atendiendo hasta las 6 AM.', 'arrival':'PASOS EN EL ACCESO · Cierra la puerta: X.', 'retreat':'SE HA RETIRADO · Reabre la puerta para ahorrar.', 'customer-arrival':'CLIENTE EN LA VENTANA · Atiende su pedido.'};
    if(type.startsWith('power-'))this.notice.textContent=messages[type]??'';
    else if(type!=='customer-arrival' || performance.now()>(this.threatUntil??0)) {this.threat.textContent=messages[type]??'';this.threatUntil=performance.now()+6000;}
  }
  update() {this.sync();if(performance.now()>this.threatUntil)this.threat.textContent='';}
  destroy(){this.root.remove();}
}
