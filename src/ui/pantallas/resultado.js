import { el, poner, cabeceraPantalla, etiquetaFichero } from '../dom.js';
import { resumir, calcularAhorro } from '../../logica/resumen.js';
import { generarCsvResultado } from '../../logica/exportar.js';
import { formatearEuros, formatearPorcentaje } from '../../logica/formato.js';

const ACTUAL_POR_DEFECTO = 'PaqNacional';

function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

// Valor por el que se ordena cada columna. null = va siempre al final.
function valorOrden(r, columna) {
  switch (columna) {
    case 'pedido': return r.pedido.pedidoId;
    case 'cliente': return r.pedido.codigoCliente;
    case 'elegido': return r.elegido ?? null;
    case 'importe': return r.importe;
    default: {
      const o = r.opciones[columna.slice(4)];
      return o?.puede ? o.importe : null;
    }
  }
}

function ordenar(resultados, { columna, ascendente }) {
  if (!columna) return resultados;
  const signo = ascendente ? 1 : -1;
  return [...resultados].sort((a, b) => {
    const va = valorOrden(a, columna);
    const vb = valorOrden(b, columna);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es', { numeric: true });
    return cmp * signo;
  });
}

function filtrar(resultados, filtro) {
  if (filtro === 'todos') return resultados;
  if (filtro === 'incidencias') return resultados.filter((r) => r.estado === 'incidencia');
  return resultados.filter((r) => r.elegido === filtro.slice(4));
}

function celdaEmpresa(r, empresa) {
  const o = r.opciones[empresa];
  if (!o) return el('td', { class: 'num' });
  if (!o.puede) {
    return el('td', { class: 'num' }, el('span', {
      class: 'no-sirve',
      tabindex: '0',
      'data-motivo': o.texto,
      'aria-label': `${empresa} no puede servirlo: ${o.texto}`,
    }, '—'));
  }
  if (r.elegido === empresa) {
    return el('td', { class: 'num elegido' }, el('span', { class: 'solo-lector' }, 'Elegido: '), formatearEuros(o.importe));
  }
  return el('td', { class: 'num' }, formatearEuros(o.importe));
}

function fila(r, empresas) {
  const inc = r.estado === 'incidencia';
  return el('tr', { class: inc ? 'fila-incidencia' : null },
    el('td', {}, r.pedido.pedidoId),
    el('td', {}, r.pedido.codigoCliente),
    el('td', {}, inc
      ? el('div', { class: 'problema' }, el('span', { class: 'etiqueta aviso' }, r.incidencia), el('span', { class: 'detalle' }, r.detalle))
      : el('strong', {}, r.elegido)),
    el('td', { class: 'num importe' }, inc ? '' : formatearEuros(r.importe)),
    empresas.map((e) => celdaEmpresa(r, e)));
}

function descargarCsv(resultados, empresas, nombreFichero) {
  const csv = '﻿' + generarCsvResultado(resultados, empresas); // BOM: Excel reconoce las tildes
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const base = nombreFichero.replace(/\.csv.*$/i, '').replace(/[^\w-]+/g, '_');
  const a = el('a', { href: url, download: `resultado_${base}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function render(c, { estado, ir }) {
  const { modelo, resultados } = estado;
  const empresas = modelo.empresas;
  if (!empresas.includes(estado.actual)) {
    estado.actual = empresas.includes(ACTUAL_POR_DEFECTO) ? ACTUAL_POR_DEFECTO : empresas[0];
  }
  const resumen = resumir(resultados, empresas, estado.actual);

  // --- Ahorro frente al transportista actual (se repinta al cambiar el desplegable) ---
  const cuerpoAhorro = el('div', { 'aria-live': 'polite' });
  function pintarAhorro() {
    const a = calcularAhorro(resultados, estado.actual);
    if (a.pedidos === 0) {
      cuerpoAhorro.replaceChildren(el('p', { class: 'tarjeta-nota' }, `${estado.actual} no puede servir ninguno de los pedidos asignados.`));
      return;
    }
    cuerpoAhorro.replaceChildren(
      el('span', { class: 'tarjeta-valor ahorro' }, formatearEuros(a.ahorro), el('small', {}, ` (${formatearPorcentaje(a.porcentaje)})`)),
      el('p', { class: 'tarjeta-nota' },
        `Con ${estado.actual}, ${plural(a.pedidos, 'pedido', 'pedidos')} habrían costado ${formatearEuros(a.costeActual)}; `,
        `con la asignación óptima cuestan ${formatearEuros(a.costeOptimo)}.`,
        a.noServibles > 0 ? ` No ${a.noServibles === 1 ? 'se cuenta' : 'se cuentan'} ${plural(a.noServibles, 'pedido', 'pedidos')} que ${estado.actual} no puede servir.` : ''));
  }
  const selectorActual = el('select', {
    id: 'actual',
    onchange: (e) => { estado.actual = e.target.value; pintarAhorro(); },
  }, empresas.map((e) => el('option', { value: e, selected: e === estado.actual }, e)));
  pintarAhorro();

  // --- Tabla (se repinta al filtrar u ordenar) ---
  const cuerpoTabla = el('tbody');
  const contador = el('p', { class: 'contador', 'aria-live': 'polite' });
  const cabeceras = [];

  function pintarTabla() {
    const visibles = ordenar(filtrar(resultados, estado.filtro), estado.orden);
    cuerpoTabla.replaceChildren(...(visibles.length
      ? visibles.map((r) => fila(r, empresas))
      : [el('tr', {}, el('td', { colspan: String(4 + empresas.length), class: 'vacio' }, 'Ningún pedido coincide con el filtro.'))]));
    contador.textContent = `Mostrando ${visibles.length} de ${resultados.length} pedidos`;
    for (const { th, columna } of cabeceras) {
      const activa = estado.orden.columna === columna;
      th.setAttribute('aria-sort', activa ? (estado.orden.ascendente ? 'ascending' : 'descending') : 'none');
      th.querySelector('.flecha').textContent = activa ? (estado.orden.ascendente ? '▲' : '▼') : '';
    }
  }

  function cabecera(texto, columna, num = false) {
    const boton = el('button', {
      type: 'button',
      class: 'ordenar',
      onclick: () => {
        const o = estado.orden;
        estado.orden = o.columna === columna ? { columna, ascendente: !o.ascendente } : { columna, ascendente: true };
        pintarTabla();
      },
    }, texto, el('span', { class: 'flecha', 'aria-hidden': 'true' }));
    const th = el('th', { scope: 'col', class: num ? 'num' : null }, boton);
    cabeceras.push({ th, columna });
    return th;
  }

  const selectorFiltro = el('select', {
    id: 'filtro',
    onchange: (e) => { estado.filtro = e.target.value; pintarTabla(); },
  },
  el('option', { value: 'todos', selected: estado.filtro === 'todos' }, 'Todos los pedidos'),
  el('option', { value: 'incidencias', selected: estado.filtro === 'incidencias' }, `Solo con incidencia (${resumen.incidencias})`),
  empresas.map((e) => el('option', { value: `emp:${e}`, selected: estado.filtro === `emp:${e}` },
    `Asignados a ${e} (${resumen.reparto[e]})`)));

  const tabla = el('table', { class: 'tabla-resultado' },
    el('thead', {}, el('tr', {},
      cabecera('Pedido', 'pedido'),
      cabecera('Código de cliente', 'cliente'),
      cabecera('Transportista elegido', 'elegido'),
      cabecera('Importe', 'importe', true),
      empresas.map((e) => cabecera(e, `emp:${e}`, true)))),
    cuerpoTabla);
  pintarTabla();

  const maxReparto = Math.max(1, ...Object.values(resumen.reparto));

  poner(c,
    cabeceraPantalla('Resultado', 'Transportista más barato para cada pedido.', ir),
    etiquetaFichero(estado.nombreFichero),
    el('div', { class: 'tarjetas' },
      el('div', { class: 'tarjeta' },
        el('span', { class: 'tarjeta-etiqueta' }, 'Pedidos asignados'),
        el('span', { class: 'tarjeta-valor' }, `${resumen.asignados}`, el('small', {}, ` de ${resumen.total}`)),
        el('p', { class: `tarjeta-nota ${resumen.incidencias ? 'texto-aviso' : ''}` },
          resumen.incidencias ? `${plural(resumen.incidencias, 'pedido', 'pedidos')} con incidencia` : 'Ningún pedido con incidencia')),
      el('div', { class: 'tarjeta' },
        el('span', { class: 'tarjeta-etiqueta' }, 'Coste total óptimo'),
        el('span', { class: 'tarjeta-valor' }, formatearEuros(resumen.costeOptimo)),
        el('p', { class: 'tarjeta-nota' }, `Suma de los ${resumen.asignados} pedidos asignados.`)),
      el('div', { class: 'tarjeta tarjeta-ancha' },
        el('label', { class: 'tarjeta-etiqueta', for: 'actual' }, 'Ahorro frente al transportista actual'),
        selectorActual,
        cuerpoAhorro),
      el('div', { class: 'tarjeta' },
        el('span', { class: 'tarjeta-etiqueta' }, 'Reparto por transportista'),
        el('ul', { class: 'reparto' }, empresas.map((e) => el('li', {},
          el('span', { class: 'reparto-nombre' }, e),
          el('span', { class: 'reparto-barra', 'aria-hidden': 'true' },
            el('span', { style: `width:${(resumen.reparto[e] / maxReparto) * 100}%` })),
          el('span', { class: 'reparto-num' }, resumen.reparto[e])))))),
    el('div', { class: 'barra-herramientas' },
      el('label', { for: 'filtro' }, 'Mostrar: '), selectorFiltro,
      contador,
      el('button', {
        type: 'button', class: 'boton secundario',
        onclick: () => descargarCsv(resultados, empresas, estado.nombreFichero),
      }, '⬇ Descargar resultado (CSV)')),
    el('p', { class: 'leyenda' },
      el('span', { class: 'muestra-elegido' }, 'Resaltado'), ' = transportista elegido. ',
      '«—» = ese transportista no puede servirlo (pasa el ratón por encima para ver el motivo). ',
      'Pulsa en el título de una columna para ordenar.'),
    el('div', { class: 'tabla-contenedor' }, tabla),
    el('div', { class: 'acciones' },
      el('button', { type: 'button', class: 'boton secundario', onclick: () => ir('home') }, '← Volver a inicio')),
  );
}
