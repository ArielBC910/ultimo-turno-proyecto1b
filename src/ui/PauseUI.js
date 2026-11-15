// Botón de pausa (arriba a la derecha) y menú de pausa. Se crea por código para no depender de index.html.
// Solo pinta y recoge clics/teclas: el estado vive en PauseManager y lo que se congela lo decide la escena.
export const PAUSE_KEY = 'KeyM';
const KEY_LABEL = 'M';
// Teclas que siguen llegando a los botones del menú (accesibilidad). El resto no llega al juego mientras dura la pausa.
const MENU_KEYS = new Set(['Tab', 'Enter', 'Space']);

function create(tag, className, html = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.innerHTML = html;
  return element;
}

export class PauseUI {
  constructor(pause, { onMenu = () => {} } = {}) {
    this.pause = pause;
    this.root = document.querySelector('#surveillance');
    this.button = create('button', 'pause-button', '<span aria-hidden="true">❚❚</span> PAUSA');
    this.button.type = 'button';
    this.button.title = `Pausa (${KEY_LABEL})`;
    this.button.setAttribute('aria-label', `Pausar el juego (${KEY_LABEL})`);
    this.overlay = create('div', 'pause-overlay', `
      <div class="pause-panel" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <h2 id="pause-title">PAUSA</h2>
        <p>La noche, los clientes y el audio están detenidos.</p>
        <button type="button" class="pause-action" data-pause="resume">CONTINUAR <kbd>${KEY_LABEL}</kbd></button>
        <button type="button" class="pause-action" data-pause="menu">VOLVER AL MENÚ</button>
      </div>`);
    this.overlay.hidden = true;
    this.root.append(this.button, this.overlay);

    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    this.button.addEventListener('click', () => this.pause.pause(), options);
    this.overlay.querySelector('[data-pause="resume"]').addEventListener('click', () => this.pause.resume(), options);
    this.overlay.querySelector('[data-pause="menu"]').addEventListener('click', () => onMenu(), options);
    // En fase de captura: llegan antes que los atajos del juego, que así no se enteran de nada durante la pausa.
    window.addEventListener('keydown', (event) => this.handleKey(event), { ...options, capture: true });
    window.addEventListener('keyup', (event) => { if (this.pause.paused && !MENU_KEYS.has(event.code)) event.stopImmediatePropagation(); }, { ...options, capture: true });
    this.unsubscribe = pause.subscribe(() => this.sync());
    this.sync();
  }

  handleKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA/.test(event.target?.tagName ?? '')) return;
    const swallow = () => { event.preventDefault(); event.stopImmediatePropagation(); };
    if (event.code === PAUSE_KEY) {
      if (!event.repeat) this.pause.toggle();
      swallow(); // la tecla de pausa no la usa ningún otro atajo del juego
      return;
    }
    if (!this.pause.paused) return;
    if (event.code === 'Escape') this.pause.resume();
    if (event.code === 'Escape' || !MENU_KEYS.has(event.code)) swallow();
  }

  sync() {
    const paused = this.pause.paused;
    this.overlay.hidden = !paused;
    this.root.classList.toggle('paused', paused); // congela también las animaciones CSS
    this.button.setAttribute('aria-pressed', String(paused));
    if (paused) this.overlay.querySelector('[data-pause="resume"]').focus();
    else this.button.blur();
  }

  destroy() {
    this.abort.abort();
    this.unsubscribe();
    this.root.classList.remove('paused');
    this.button.remove();
    this.overlay.remove();
  }
}
