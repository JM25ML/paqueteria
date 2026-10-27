// Reglas de cálculo del importe y elección del transportista (ver SPEC.md, "Reglas de cálculo").
import { condicionesDe, nombreZona } from './tarifas.js';
import { INCIDENCIA } from './pedidos.js';
import { formatearNumero } from './formato.js';

export const NO_SIRVE = { ZONA: 'zona', PESO_BULTO: 'peso_bulto' };

// Calcula lo que cobraría `empresa` por un pedido válido (con zona, bultos y peso correctos).
// Devuelve { puede: true, importe, base, recargoBultos, kgExtra, plazoDias }  (importes en céntimos)
//       o  { puede: false, motivo, texto, corto }
export function calcularImporte(pedido, empresa, modelo) {
  const c = condicionesDe(modelo, empresa, pedido.zona);
  if (!c) {
    return {
      puede: false,
      motivo: NO_SIRVE.ZONA,
      texto: `No opera en la zona ${nombreZona(pedido.zona)}`,
      corto: 'no opera en la zona',
    };
  }

  // Regla 2: peso medio por bulto (se asume que todos los bultos pesan lo mismo).
  const pesoMedio = pedido.pesoKg / pedido.bultos;
  if (pesoMedio > c.pesoMaxBultoKg) {
    return {
      puede: false,
      motivo: NO_SIRVE.PESO_BULTO,
      texto: `Supera su máximo de ${formatearNumero(c.pesoMaxBultoKg)} kg por bulto (este pedido: ${formatearNumero(pesoMedio)} kg por bulto)`,
      corto: `supera ${formatearNumero(c.pesoMaxBultoKg)} kg por bulto`,
    };
  }

  // Regla 3: precio base por tramo. El límite del tramo está incluido.
  const tramo = c.tramos.find((t) => t.hastaKg >= pedido.pesoKg);
  let base;
  let kgExtra = 0;
  if (tramo) {
    base = tramo.precio;
  } else {
    const ultimo = c.tramos[c.tramos.length - 1];
    // Redondeo previo a 3 decimales para evitar que 41.0 - 40 dé 1.0000000001 y suba a 2 kg.
    kgExtra = Math.ceil(Math.round((pedido.pesoKg - ultimo.hastaKg) * 1000) / 1000);
    base = ultimo.precio + kgExtra * c.eurKgAdicional;
  }

  // Regla 4: recargo por bultos adicionales.
  const recargoBultos = (pedido.bultos - 1) * c.eurBultoAdicional;

  // Regla 5: al trabajar en céntimos enteros, el importe ya está redondeado a 2 decimales.
  return { puede: true, importe: base + recargoBultos, base, recargoBultos, kgExtra, plazoDias: c.plazoDias };
}

// Elige transportista para un pedido.
// Devuelve { pedido, estado: 'asignado' | 'incidencia', elegido, importe, opciones, incidencia, detalle }
export function asignarPedido(pedido, modelo) {
  if (pedido.problemas.length > 0) {
    return {
      pedido,
      estado: 'incidencia',
      incidencia: pedido.problemas[0].tipo,
      detalle: pedido.problemas.map((p) => p.detalle).join('. '),
      elegido: null,
      importe: null,
      opciones: {},
    };
  }

  const opciones = {};
  for (const e of modelo.empresas) opciones[e] = calcularImporte(pedido, e, modelo);

  const candidatas = modelo.empresas.filter((e) => opciones[e].puede);
  if (candidatas.length === 0) {
    return {
      pedido,
      estado: 'incidencia',
      incidencia: INCIDENCIA.SIN_TRANSPORTISTA,
      detalle: modelo.empresas.map((e) => `${e}: ${opciones[e].corto}`).join(' · '),
      elegido: null,
      importe: null,
      opciones,
    };
  }

  // Menor importe; si empatan, menor plazo; si siguen empatados, orden alfabético.
  candidatas.sort((a, b) =>
    opciones[a].importe - opciones[b].importe ||
    opciones[a].plazoDias - opciones[b].plazoDias ||
    a.localeCompare(b, 'es', { sensitivity: 'base' }));
  const elegido = candidatas[0];
  return { pedido, estado: 'asignado', elegido, importe: opciones[elegido].importe, opciones };
}

export function asignar(pedidos, modelo) {
  return pedidos.map((p) => asignarPedido(p, modelo));
}
