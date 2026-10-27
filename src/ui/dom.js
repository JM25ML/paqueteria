// Pequeña ayuda para crear elementos. Todo el texto se inserta como texto (nunca como HTML),
// así los datos del fichero del usuario no pueden inyectar código en la página.
export function el(etiqueta, props = {}, ...hijos) {
  const n = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (typeof v === 'boolean') n[k] = v;
    else n.setAttribute(k, v);
  }
  for (const h of hijos.flat(Infinity)) {
    if (h == null || h === false) continue;
    n.append(h instanceof Node ? h : String(h));
  }
  return n;
}

// Sustituye el contenido de `contenedor`, ignorando los hijos vacíos (null, false).
export function poner(contenedor, ...hijos) {
  contenedor.replaceChildren(...hijos.flat(Infinity).filter((h) => h != null && h !== false));
}

// Muestra el texto de `data-motivo` al pasar el ratón o enfocar con el teclado.
// Es un elemento flotante para que no lo recorte el scroll de la tabla.
export function activarAyudasFlotantes() {
  const caja = el('div', { class: 'ayuda-flotante', role: 'tooltip', hidden: true });
  document.body.append(caja);

  function mostrar(e) {
    const objetivo = e.target.closest?.('[data-motivo]');
    if (!objetivo) return;
    caja.textContent = objetivo.dataset.motivo;
    caja.hidden = false;
    const r = objetivo.getBoundingClientRect();
    const ancho = caja.offsetWidth;
    const alto = caja.offsetHeight;
    const izquierda = Math.min(Math.max(8, r.right - ancho), window.innerWidth - ancho - 8);
    const arriba = r.top - alto - 6 >= 8 ? r.top - alto - 6 : r.bottom + 6;
    caja.style.left = `${izquierda}px`;
    caja.style.top = `${arriba}px`;
  }
  function ocultar(e) {
    if (e.target.closest?.('[data-motivo]')) caja.hidden = true;
  }
  document.addEventListener('mouseover', mostrar);
  document.addEventListener('focusin', mostrar);
  document.addEventListener('mouseout', ocultar);
  document.addEventListener('focusout', ocultar);
  window.addEventListener('scroll', () => { caja.hidden = true; }, true);
}

export function botonVolver(ir) {
  return el('button', { type: 'button', class: 'boton secundario', onclick: () => ir('home') }, '← Volver a inicio');
}

// Etiqueta con el nombre del fichero de pedidos cargado.
export function etiquetaFichero(nombre) {
  return el('p', { class: 'fichero-cargado' },
    el('span', { 'aria-hidden': 'true' }, '📄'), ' Fichero cargado: ', el('strong', {}, nombre));
}

export function cabeceraPantalla(titulo, subtitulo, ir) {
  return el('div', { class: 'cabecera-pantalla' },
    el('div', {},
      el('h1', {}, titulo),
      subtitulo && el('p', { class: 'subtitulo' }, subtitulo)),
    botonVolver(ir));
}
