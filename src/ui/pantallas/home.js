import { el, poner } from '../dom.js';

function opcion({ titulo, texto, icono, destino, desactivada, ir }) {
  return el('button', {
    type: 'button',
    class: 'opcion',
    disabled: !!desactivada,
    'aria-describedby': desactivada ? 'aviso-sin-pedidos' : null,
    onclick: () => ir(destino),
  },
  el('span', { class: 'opcion-icono', 'aria-hidden': 'true' }, icono),
  el('span', { class: 'opcion-titulo' }, titulo),
  el('span', { class: 'opcion-texto' }, texto));
}

export function render(c, { estado, ir }) {
  const hay = !!estado.pedidos;
  poner(c,
    el('h1', {}, 'Hola 👋'),
    el('p', { class: 'intro' },
      'Esta herramienta elige, para cada pedido, la empresa de paquetería más barata según las tarifas pactadas, ',
      'y te enseña cuánto habría costado con cada una de las demás.'),
    el('ol', { class: 'pasos' },
      el('li', {}, el('strong', {}, 'Carga'), ' el fichero de pedidos (CSV).'),
      el('li', {}, el('strong', {}, 'Revisa'), ' que los pedidos estén bien.'),
      el('li', {}, el('strong', {}, 'Consulta el resultado'), ': transportista elegido, importe y ahorro.')),
    el('div', { class: 'menu' },
      opcion({ titulo: 'Ver tarifas', texto: 'Precios y condiciones de cada transportista', icono: '📋', destino: 'tarifas', ir }),
      opcion({ titulo: 'Cargar pedidos', texto: hay ? 'Sustituir el fichero cargado' : 'Subir el fichero CSV de pedidos', icono: '📤', destino: 'cargar', ir }),
      opcion({ titulo: 'Ver pedidos', texto: 'Revisar los pedidos cargados', icono: '🔎', destino: 'pedidos', desactivada: !hay, ir }),
      opcion({ titulo: 'Ver resultado', texto: 'Transportista elegido y ahorro', icono: '✅', destino: 'resultado', desactivada: !hay, ir })),
    hay
      ? el('p', { class: 'mensaje exito' },
        `Tienes cargado «${estado.nombreFichero}» con ${estado.pedidos.length} pedidos.`)
      : el('p', { class: 'mensaje info', id: 'aviso-sin-pedidos' },
        'Carga primero un fichero de pedidos para poder ver los pedidos y el resultado.'),
  );
}
