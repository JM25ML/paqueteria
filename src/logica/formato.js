// Formatos en español. Los importes se manejan siempre en céntimos (enteros) para evitar
// errores de redondeo; solo se pasan a euros al mostrarlos.

const ESPACIO_FIJO = ' ';

function agruparMiles(entero) {
  return entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// 123456 → "1.234,56" (sin símbolo; útil para exportar a CSV)
export function formatearImporte(centimos) {
  const c = Math.round(centimos);
  const abs = Math.abs(c);
  const signo = c < 0 ? '-' : '';
  return `${signo}${agruparMiles(String(Math.floor(abs / 100)))},${String(abs % 100).padStart(2, '0')}`;
}

// 123456 → "1.234,56 €"
export function formatearEuros(centimos) {
  return `${formatearImporte(centimos)}${ESPACIO_FIJO}€`;
}

// 6.5 → "6,5"; 120 → "120"; 1234.5 → "1.234,5" (hasta `maxDecimales` decimales, sin ceros finales)
export function formatearNumero(n, maxDecimales = 2) {
  if (!Number.isFinite(n)) return String(n);
  const [entero, decimales = ''] = Math.abs(n).toFixed(maxDecimales).split('.');
  const dec = decimales.replace(/0+$/, '');
  const signo = n < 0 && (Number(entero) > 0 || dec) ? '-' : '';
  return `${signo}${agruparMiles(entero)}${dec ? ',' + dec : ''}`;
}

// 6.373 → "6,4 %"
export function formatearPorcentaje(p) {
  return `${p.toFixed(1).replace('.', ',')}${ESPACIO_FIJO}%`;
}

// Lee un número escrito con punto o coma decimal: "1.8", "1,8", "1.234,5".
// Devuelve null si está vacío y NaN si no es un número.
export function parsearNumero(texto) {
  let t = String(texto ?? '').trim().replace(/\s/g, '');
  if (t === '') return null;
  const coma = t.lastIndexOf(',');
  const punto = t.lastIndexOf('.');
  if (coma >= 0 && punto >= 0) {
    t = coma > punto ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else if (coma >= 0) {
    t = t.replace(',', '.');
  }
  if (!/^[-+]?\d+(\.\d+)?$/.test(t)) return NaN;
  return Number(t);
}

export function aCentimos(euros) {
  return Math.round(euros * 100);
}
