// Mini ejecutor de tests para el navegador (sin dependencias).
const tests = [];
let grupoActual = '';

export function grupo(nombre, definir) {
  grupoActual = nombre;
  definir();
  grupoActual = '';
}

export function test(nombre, fn) {
  tests.push({ grupo: grupoActual, nombre, fn });
}

function mostrar(v) {
  return typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v) ?? String(v);
}

export function igual(real, esperado, mensaje = '') {
  const ok = typeof real === 'object' && real !== null
    ? JSON.stringify(real) === JSON.stringify(esperado)
    : Object.is(real, esperado);
  if (!ok) throw new Error(`${mensaje ? mensaje + ': ' : ''}se esperaba ${mostrar(esperado)} y se obtuvo ${mostrar(real)}`);
}

export function cierto(valor, mensaje = 'se esperaba verdadero') {
  if (!valor) throw new Error(mensaje);
}

export async function ejecutar(destino) {
  const resultados = [];
  for (const t of tests) {
    try {
      await t.fn();
      resultados.push({ ...t, ok: true });
    } catch (e) {
      resultados.push({ ...t, ok: false, error: e.message });
    }
  }
  const fallados = resultados.filter((r) => !r.ok);

  const resumen = document.createElement('p');
  resumen.className = fallados.length ? 'resumen mal' : 'resumen bien';
  resumen.id = 'resumen';
  resumen.textContent = fallados.length
    ? `${fallados.length} de ${resultados.length} tests fallan`
    : `Los ${resultados.length} tests pasan`;
  destino.append(resumen);

  let grupoPintado = null;
  let lista;
  for (const r of resultados) {
    if (r.grupo !== grupoPintado) {
      const h = document.createElement('h2');
      h.textContent = r.grupo || 'General';
      lista = document.createElement('ul');
      destino.append(h, lista);
      grupoPintado = r.grupo;
    }
    const li = document.createElement('li');
    li.className = r.ok ? 'bien' : 'mal';
    li.textContent = `${r.ok ? '✔' : '✘'} ${r.nombre}${r.ok ? '' : ' — ' + r.error}`;
    lista.append(li);
  }

  document.title = fallados.length ? `✘ ${fallados.length} fallan` : '✔ Tests OK';
  window.resultadoTests = { total: resultados.length, fallados: fallados.map((f) => `${f.grupo} › ${f.nombre}: ${f.error}`) };
  return window.resultadoTests;
}
