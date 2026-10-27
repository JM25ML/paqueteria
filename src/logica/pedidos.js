// Lee el CSV de pedidos que sube el usuario y detecta los problemas de cada fila.
import { leerCsv } from './csv.js';
import { normalizar } from './normalizar.js';
import { parsearNumero } from './formato.js';
import { buscarProvincia } from './tarifas.js';

export const COLUMNAS = ['pedido_id', 'codigo_cliente', 'provincia', 'bultos', 'peso_total_kg'];

export const INCIDENCIA = {
  PROVINCIA: 'Provincia no reconocida',
  DATOS: 'Datos no válidos',
  SIN_TRANSPORTISTA: 'Sin transportista disponible',
};

function normalizarCabecera(h) {
  return normalizar(h).replace(/ /g, '_');
}

function mayusculaInicial(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function leerBultos(texto) {
  const n = parsearNumero(texto);
  if (n === null) return { valor: null, error: 'faltan los bultos' };
  if (Number.isNaN(n)) return { valor: null, error: `los bultos («${texto}») no son un número` };
  if (n <= 0) return { valor: null, error: 'los bultos deben ser 1 o más' };
  if (!Number.isInteger(n)) return { valor: null, error: 'los bultos deben ser un número entero' };
  return { valor: n, error: null };
}

function leerPeso(texto) {
  const n = parsearNumero(texto);
  if (n === null) return { valor: null, error: 'falta el peso' };
  if (Number.isNaN(n)) return { valor: null, error: `el peso («${texto}») no es un número` };
  if (n <= 0) return { valor: null, error: 'el peso debe ser mayor que 0' };
  return { valor: n, error: null };
}

// Devuelve { ok: true, pedidos } o { ok: false, error, faltan }.
// Cada pedido: { pedidoId, codigoCliente, provinciaTexto, provincia, zona, bultos, pesoKg,
//                bultosTexto, pesoTexto, problemas: [{ tipo, detalle }] }
export function leerPedidos(texto, modelo) {
  const { cabecera, filas } = leerCsv(texto);
  if (cabecera.length === 0) {
    return { ok: false, error: 'El fichero está vacío.', faltan: COLUMNAS };
  }

  // Columna esperada → título tal como viene en el fichero (se aceptan mayúsculas, tildes o espacios).
  const titulo = {};
  for (const h of cabecera) {
    const n = normalizarCabecera(h);
    if (COLUMNAS.includes(n) && !(n in titulo)) titulo[n] = h;
  }
  const faltan = COLUMNAS.filter((c) => !(c in titulo));
  if (faltan.length > 0) {
    const lista = faltan.join(', ');
    const error = faltan.length === 1
      ? `Al fichero le falta la columna «${lista}».`
      : `Al fichero le faltan estas columnas: ${lista}.`;
    return { ok: false, error, faltan, encontradas: cabecera };
  }
  if (filas.length === 0) {
    return { ok: false, error: 'El fichero solo tiene la fila de títulos: no contiene ningún pedido.', faltan: [] };
  }

  const pedidos = filas.map((f) => {
    const v = (col) => f[titulo[col]] ?? '';
    const problemas = [];

    const provinciaTexto = v('provincia');
    const prov = buscarProvincia(modelo, provinciaTexto);
    if (!prov) {
      problemas.push({
        tipo: INCIDENCIA.PROVINCIA,
        detalle: provinciaTexto ? `«${provinciaTexto}» no está en la lista de provincias` : 'La provincia está vacía',
      });
    }

    const bultos = leerBultos(v('bultos'));
    const peso = leerPeso(v('peso_total_kg'));
    const errores = [bultos.error, peso.error].filter(Boolean);
    if (errores.length > 0) {
      problemas.push({ tipo: INCIDENCIA.DATOS, detalle: mayusculaInicial(errores.join(' y ')) });
    }

    return {
      pedidoId: v('pedido_id'),
      codigoCliente: v('codigo_cliente'),
      provinciaTexto,
      provincia: prov?.provincia ?? null,
      zona: prov?.zona ?? null,
      bultos: bultos.valor,
      pesoKg: peso.valor,
      bultosTexto: v('bultos'),
      pesoTexto: v('peso_total_kg'),
      problemas,
    };
  });

  return { ok: true, pedidos };
}
