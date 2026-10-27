// Totales de la asignación y ahorro frente al transportista actual. Importes en céntimos.

// Ahorro = coste con el actual − coste óptimo, solo sobre los pedidos que el actual puede servir.
export function calcularAhorro(resultados, actual) {
  const asignados = resultados.filter((r) => r.estado === 'asignado');
  const servibles = asignados.filter((r) => r.opciones[actual]?.puede);
  const costeActual = servibles.reduce((s, r) => s + r.opciones[actual].importe, 0);
  const costeOptimo = servibles.reduce((s, r) => s + r.importe, 0);
  const ahorro = costeActual - costeOptimo;
  return {
    actual,
    pedidos: servibles.length,
    noServibles: asignados.length - servibles.length,
    costeActual,
    costeOptimo,
    ahorro,
    porcentaje: costeActual > 0 ? (ahorro / costeActual) * 100 : 0,
  };
}

export function resumir(resultados, empresas, actual) {
  const asignados = resultados.filter((r) => r.estado === 'asignado');
  const reparto = Object.fromEntries(empresas.map((e) => [e, 0]));
  for (const r of asignados) reparto[r.elegido] += 1;
  return {
    total: resultados.length,
    asignados: asignados.length,
    incidencias: resultados.length - asignados.length,
    costeOptimo: asignados.reduce((s, r) => s + r.importe, 0),
    reparto,
    ahorro: calcularAhorro(resultados, actual),
  };
}
