import { el, poner, cabeceraPantalla, etiquetaFichero } from '../dom.js';
import { formatearNumero } from '../../logica/formato.js';
import { normalizar } from '../../logica/normalizar.js';

function celdaProvincia(p) {
  if (!p.provincia) return p.provinciaTexto || '(vacía)';
  const distinta = normalizar(p.provincia) !== normalizar(p.provinciaTexto);
  return el('span', {}, p.provinciaTexto, el('span', { class: 'secundario' },
    distinta ? ` → ${p.provincia} (${p.zona})` : ` (${p.zona})`));
}

function celdaEstado(p) {
  if (p.problemas.length === 0) return el('span', { class: 'etiqueta ok' }, 'Correcto');
  return el('div', {}, p.problemas.map((pr) => el('div', { class: 'problema' },
    el('span', { class: 'etiqueta aviso' }, pr.tipo),
    el('span', { class: 'detalle' }, pr.detalle))));
}

export function render(c, { estado, ir }) {
  const total = estado.pedidos.length;
  const conProblemas = estado.pedidos.filter((p) => p.problemas.length > 0).length;

  const filas = estado.pedidos.map((p) => el('tr', { class: p.problemas.length ? 'fila-incidencia' : null },
    el('td', { 'data-label': 'Pedido' }, p.pedidoId),
    el('td', { 'data-label': 'Provincia' }, celdaProvincia(p)),
    el('td', { 'data-label': 'Código de cliente' }, p.codigoCliente),
    el('td', { class: 'num', 'data-label': 'Bultos' }, p.bultos ?? p.bultosTexto),
    el('td', { class: 'num', 'data-label': 'Peso total (kg)' }, p.pesoKg != null ? formatearNumero(p.pesoKg) : p.pesoTexto),
    el('td', { 'data-label': 'Estado' }, celdaEstado(p))));

  const verResultado = () => ir('resultado');

  poner(c,
    cabeceraPantalla('Pedidos cargados', 'Revisa los pedidos antes de calcular el resultado.', ir),
    etiquetaFichero(estado.nombreFichero),
    el('div', { class: 'tarjetas' },
      el('div', { class: 'tarjeta' }, el('span', { class: 'tarjeta-etiqueta' }, 'Pedidos cargados'), el('span', { class: 'tarjeta-valor' }, total)),
      el('div', { class: `tarjeta ${conProblemas ? 'tarjeta-aviso' : ''}` },
        el('span', { class: 'tarjeta-etiqueta' }, 'Pedidos con problemas'), el('span', { class: 'tarjeta-valor' }, conProblemas))),
    conProblemas > 0 && el('p', { class: 'mensaje aviso' },
      `Hay ${conProblemas} ${conProblemas === 1 ? 'pedido' : 'pedidos'} con problemas (destacados en la tabla). `,
      'No se les asignará transportista. Puedes corregir el fichero y volver a cargarlo, o seguir adelante.'),
    el('div', { class: 'acciones' },
      el('button', { type: 'button', class: 'boton', onclick: verResultado }, 'Ver resultado →')),
    el('div', { class: 'tabla-contenedor' },
      el('table', { class: 'tabla-tarjetas' },
        el('thead', {}, el('tr', {},
          el('th', { scope: 'col' }, 'Pedido'),
          el('th', { scope: 'col' }, 'Provincia'),
          el('th', { scope: 'col' }, 'Código de cliente'),
          el('th', { scope: 'col', class: 'num' }, 'Bultos'),
          el('th', { scope: 'col', class: 'num' }, 'Peso total (kg)'),
          el('th', { scope: 'col' }, 'Estado'))),
        el('tbody', {}, filas))),
    el('div', { class: 'acciones' },
      el('button', { type: 'button', class: 'boton', onclick: verResultado }, 'Ver resultado →'),
      el('button', { type: 'button', class: 'boton secundario', onclick: () => ir('home') }, '← Volver a inicio')),
  );
}
