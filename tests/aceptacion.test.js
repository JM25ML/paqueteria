// Criterio de aceptación de SPEC.md con data/pedidos_ejemplo.csv.
import { grupo, test, igual, cierto } from './runner.js';
import { leerPedidos, INCIDENCIA } from '../src/logica/pedidos.js';
import { asignar } from '../src/logica/calculo.js';
import { resumir } from '../src/logica/resumen.js';
import { generarCsvResultado } from '../src/logica/exportar.js';
import { formatearEuros, formatearPorcentaje } from '../src/logica/formato.js';
import { cargarModeloReal, leerFichero } from './datos.js';

async function resultadoEjemplo() {
  const modelo = await cargarModeloReal();
  const { pedidos } = leerPedidos(await leerFichero('data/pedidos_ejemplo.csv'), modelo);
  const resultados = asignar(pedidos, modelo);
  return { modelo, resultados, resumen: resumir(resultados, modelo.empresas, 'PaqNacional') };
}

grupo('Aceptación: pedidos_ejemplo.csv', () => {
  test('27 pedidos asignados y 3 incidencias', async () => {
    const { resumen } = await resultadoEjemplo();
    igual(resumen.total, 30);
    igual(resumen.asignados, 27);
    igual(resumen.incidencias, 3);
  });
  test('coste óptimo 598,40 €', async () => {
    const { resumen } = await resultadoEjemplo();
    igual(formatearEuros(resumen.costeOptimo), '598,40 €');
  });
  test('ahorro frente a PaqNacional: 38,30 € (6,4 %) sobre 26 pedidos', async () => {
    const { ahorro } = (await resultadoEjemplo()).resumen;
    igual(formatearEuros(ahorro.ahorro), '38,30 €');
    igual(formatearPorcentaje(ahorro.porcentaje), '6,4 %');
    igual(ahorro.pedidos, 26);
  });
  test('las tres incidencias esperadas', async () => {
    const { resultados } = await resultadoEjemplo();
    const inc = resultados.filter((r) => r.estado === 'incidencia').map((r) => [r.pedido.pedidoId, r.incidencia]);
    igual(inc, [
      ['PV-1028', INCIDENCIA.SIN_TRANSPORTISTA],
      ['PV-1029', INCIDENCIA.PROVINCIA],
      ['PV-1030', INCIDENCIA.DATOS],
    ]);
  });
  test('reparto por transportista', async () => {
    const { resumen } = await resultadoEjemplo();
    igual(resumen.reparto, { 'RápidoExpress': 3, 'Transportes Levante': 8, PaqNacional: 12, IslasCargo: 4 });
  });
  test('exportación a CSV: cabecera y una fila por pedido', async () => {
    const { resultados, modelo } = await resultadoEjemplo();
    const lineas = generarCsvResultado(resultados, modelo.empresas).trim().split('\r\n');
    igual(lineas.length, 31);
    cierto(lineas[0].startsWith('Pedido;Código de cliente;'), lineas[0]);
    igual(lineas[1], 'PV-1001;CL-0107;Valencia;Z1;1;1,8;RápidoExpress;4,20;4,20;4,50;4,90;No puede (no opera en la zona);');
  });
});
