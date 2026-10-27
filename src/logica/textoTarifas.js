// Genera, a partir del modelo de tarifas, los textos legibles de la pantalla "Tarifas".
import { condicionesDe } from './tarifas.js';
import { formatearEuros, formatearNumero } from './formato.js';

function dias(n) {
  return n === 1 ? '1 día' : `${formatearNumero(n)} días`;
}

// Devuelve, por transportista:
// { empresa, zonas: [{ codigo, nombre, provincias, tramos: ['Hasta 2 kg: 4,20 €', ...],
//   kgAdicional, bultoAdicional, pesoMax, plazo }], sinServicio: ['Z5 Canarias', ...] }
export function fichasTarifas(modelo) {
  return modelo.empresas.map((empresa) => {
    const zonas = [];
    const sinServicio = [];
    for (const z of modelo.zonas) {
      const c = condicionesDe(modelo, empresa, z.codigo);
      if (!c) { sinServicio.push(`${z.codigo} ${z.nombre}`); continue; }
      const ultimo = c.tramos[c.tramos.length - 1];
      zonas.push({
        codigo: z.codigo,
        nombre: z.nombre,
        provincias: z.provincias,
        tramos: c.tramos.map((t) => `Hasta ${formatearNumero(t.hastaKg)} kg: ${formatearEuros(t.precio)}`),
        kgAdicional: `${formatearEuros(c.eurKgAdicional)} por cada kg por encima de ${formatearNumero(ultimo.hastaKg)} kg`,
        bultoAdicional: `${formatearEuros(c.eurBultoAdicional)} por cada bulto a partir del segundo`,
        pesoMax: `${formatearNumero(c.pesoMaxBultoKg)} kg por bulto`,
        plazo: dias(c.plazoDias),
      });
    }
    return { empresa, zonas, sinServicio };
  });
}
