import { el, poner, cabeceraPantalla } from '../dom.js';
import { fichasTarifas } from '../../logica/textoTarifas.js';

function bloqueZona(z) {
  return el('details', { class: 'zona' },
    el('summary', {},
      el('span', { class: 'zona-nombre' }, `${z.codigo} · ${z.nombre}`),
      el('span', { class: 'zona-resumen' }, `Entrega en ${z.plazo} · desde ${z.tramos[0].split(': ')[1]}`)),
    el('div', { class: 'zona-cuerpo' },
      el('div', {},
        el('h4', {}, 'Precio según el peso total del pedido'),
        el('ul', { class: 'tramos' }, z.tramos.map((t) => el('li', {}, t))),
        el('p', {}, el('strong', {}, 'Más peso: '), z.kgAdicional, ' (se redondea al kg entero hacia arriba).')),
      el('div', {},
        el('h4', {}, 'Condiciones'),
        el('ul', {},
          el('li', {}, el('strong', {}, 'Bultos: '), z.bultoAdicional),
          el('li', {}, el('strong', {}, 'Peso máximo: '), z.pesoMax),
          el('li', {}, el('strong', {}, 'Plazo de entrega: '), z.plazo)),
        el('h4', {}, `Provincias de esta zona (${z.provincias.length})`),
        el('p', { class: 'provincias' }, z.provincias.join(', ')))));
}

export function render(c, { estado, ir }) {
  const fichas = fichasTarifas(estado.modelo);
  const desplegar = el('button', {
    type: 'button',
    class: 'boton secundario desplegar',
    onclick: () => {
      const zonas = [...c.querySelectorAll('details.zona')];
      const abrir = zonas.some((d) => !d.open);
      zonas.forEach((d) => { d.open = abrir; });
      desplegar.textContent = abrir ? 'Plegar todas las zonas' : 'Desplegar todas las zonas';
    },
  }, 'Desplegar todas las zonas');
  poner(c,
    cabeceraPantalla('Tarifas de los transportistas',
      'Precios pactados con cada empresa. Pulsa en una zona para ver el detalle.', ir),
    desplegar,
    el('div', { class: 'fichas' }, fichas.map((f) => el('article', { class: 'ficha' },
      el('h2', {}, f.empresa),
      el('p', { class: 'ficha-resumen' },
        `Da servicio en ${f.zonas.length} ${f.zonas.length === 1 ? 'zona' : 'zonas'}: `,
        f.zonas.map((z) => `${z.codigo} ${z.nombre}`).join(', '), '.',
        f.sinServicio.length ? ` No envía a: ${f.sinServicio.join(', ')}.` : ''),
      f.zonas.map(bloqueZona)))),
  );
}
