export const GAME = Object.freeze({ width: 1600, height: 900 });
export const CAMERAS = Object.freeze([
  { key: 'cam01', number: '01', name: 'COMEDOR', file: 'cam01.png' },
  { key: 'cam02', number: '02', name: 'MOSTRADOR', file: 'cam02.png' },
  { key: 'cam03', number: '03', name: 'BODEGA', file: 'cam03-storage.png' },
  { key: 'cam04', number: '04', name: 'PASILLO DE ACCESO', file: 'cam04.png' },
]);

export const OFFICE_VIEWS = Object.freeze({
  open: 'office',
  openLight: 'office-light',
  closed: 'office-closed',
  closedLight: 'office-closed-light',
});

export function getSurveillanceTexture(state, location) {
  if (state.monitorOpen) return state.camera + (location === state.camera ? '-wendigo' : '');
  if (state.doorClosed) return state.lightOn ? OFFICE_VIEWS.closedLight : OFFICE_VIEWS.closed;
  if (location === 'door') return state.lightOn ? 'office-wendigo-light' : 'office-wendigo-dark';
  return state.lightOn ? OFFICE_VIEWS.openLight : OFFICE_VIEWS.open;
}
