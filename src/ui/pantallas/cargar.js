import { el, poner, cabeceraPantalla } from '../dom.js';
import { COLUMNAS } from '../../logica/pedidos.js';

const RUTA_EJEMPLO = 'data/pedidos_ejemplo.csv';

export function render(c, { estado, ir, cargarPedidos }) {
  const mensaje = el('div', { class: 'zona-mensaje', role: 'alert', 'aria-live': 'assertive' });

  function mostrarError(titulo, detalle) {
    mensaje.replaceChildren(el('div', { class: 'mensaje error' },
      el('strong', {}, titulo), detalle && el('div', {}, detalle)));
  }

  function procesar(texto, nombre) {
    const r = cargarPedidos(texto, nombre);
    if (r.ok) { ir('pedidos'); return; }
    const detalle = [
      el('p', {}, 'La primera fila del fichero debe tener estos títulos de columna:'),
      el('p', {}, el('code', {}, COLUMNAS.join(', '))),
    ];
    if (r.encontradas?.length) {
      detalle.push(el('p', {}, 'Columnas encontradas en tu fichero: ', el('code', {}, r.encontradas.join(', '))));
    }
    mostrarError(r.error, detalle);
  }

  async function leerArchivo(archivo) {
    if (!archivo) return;
    if (!/\.csv$/i.test(archivo.name)) {
      mostrarError(`«${archivo.name}» no es un fichero CSV.`,
        'Si lo tienes en Excel, usa «Guardar como» y elige el formato «CSV UTF-8 (delimitado por comas)».');
      return;
    }
    try {
      procesar(await archivo.text(), archivo.name);
    } catch {
      mostrarError('No se ha podido leer el fichero.', 'Prueba a guardarlo de nuevo y vuelve a intentarlo.');
    }
  }

  async function cargarEjemplo() {
    try {
      const r = await fetch(RUTA_EJEMPLO);
      if (!r.ok) throw new Error();
      procesar(await r.text(), 'pedidos_ejemplo.csv (datos de ejemplo)');
    } catch {
      mostrarError('No se han podido cargar los datos de ejemplo.');
    }
  }

  const input = el('input', {
    type: 'file', accept: '.csv,text/csv', class: 'oculto', id: 'selector-fichero',
    onchange: (e) => { leerArchivo(e.target.files[0]); e.target.value = ''; },
  });

  const zona = el('label', { class: 'zona-carga', for: 'selector-fichero' },
    el('span', { class: 'zona-icono', 'aria-hidden': 'true' }, '📄'),
    el('span', { class: 'zona-titulo' }, 'Arrastra aquí tu fichero CSV'),
    el('span', { class: 'zona-texto' }, 'o ', el('span', { class: 'enlace' }, 'pulsa para buscarlo en tus carpetas')),
    input);

  zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('encima'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('encima'));
  zona.addEventListener('drop', (e) => {
    e.preventDefault();
    zona.classList.remove('encima');
    leerArchivo(e.dataTransfer.files[0]);
  });

  poner(c,
    cabeceraPantalla('Cargar pedidos', 'Sube el fichero de pedidos de venta para calcular el transportista de cada uno.', ir),
    estado.pedidos && el('p', { class: 'mensaje info' },
      `Ahora tienes cargado «${estado.nombreFichero}». Si cargas otro fichero, lo sustituirá.`),
    zona,
    mensaje,
    el('div', { class: 'acciones' },
      el('button', { type: 'button', class: 'boton secundario', onclick: cargarEjemplo }, 'Probar con datos de ejemplo')),
    el('details', { class: 'ayuda' },
      el('summary', {}, '¿Qué formato debe tener el fichero?'),
      el('p', {}, 'Un fichero CSV con una fila por pedido y estas cinco columnas:'),
      el('ul', {},
        el('li', {}, el('code', {}, 'pedido_id'), ': número de pedido (ej. PV-1001)'),
        el('li', {}, el('code', {}, 'codigo_cliente'), ': código de cliente (ej. CL-0107)'),
        el('li', {}, el('code', {}, 'provincia'), ': provincia de destino'),
        el('li', {}, el('code', {}, 'bultos'), ': número total de bultos (1 o más)'),
        el('li', {}, el('code', {}, 'peso_total_kg'), ': peso total del pedido en kg')),
      el('p', {}, 'Sirve tanto separado por comas como por punto y coma (el formato de Excel en español).')),
  );
}
