// Lector de CSV sencillo: admite comillas, saltos de línea Windows/Unix y la marca BOM de UTF-8.
// Detecta si el separador es coma o punto y coma (Excel en español usa punto y coma).

export function detectarSeparador(primeraLinea) {
  const comas = (primeraLinea.match(/,/g) || []).length;
  const puntoYComa = (primeraLinea.match(/;/g) || []).length;
  return puntoYComa > comas ? ';' : ',';
}

function trocear(texto, separador) {
  const registros = [];
  let registro = [];
  let campo = '';
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else { entreComillas = false; }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === separador) {
      registro.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      registro.push(campo);
      registros.push(registro);
      registro = [];
      campo = '';
    } else {
      campo += c;
    }
  }
  if (campo !== '' || registro.length > 0) {
    registro.push(campo);
    registros.push(registro);
  }
  return registros;
}

// Devuelve { cabecera: [...], filas: [{ columna: valor }], separador }.
// Las filas totalmente vacías se ignoran. Los valores se devuelven sin espacios a los lados.
export function leerCsv(texto, separador) {
  let t = String(texto ?? '');
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  const sep = separador ?? detectarSeparador(t.split(/\r?\n/, 1)[0] ?? '');

  const registros = trocear(t, sep).filter((r) => r.some((v) => v.trim() !== ''));
  if (registros.length === 0) return { cabecera: [], filas: [], separador: sep };

  const cabecera = registros[0].map((h) => h.trim());
  const filas = registros.slice(1).map((r) => {
    const fila = {};
    cabecera.forEach((h, j) => { fila[h] = (r[j] ?? '').trim(); });
    return fila;
  });
  return { cabecera, filas, separador: sep };
}
