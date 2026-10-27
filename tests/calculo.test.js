import { grupo, test, igual } from './runner.js';
import { calcularImporte, asignarPedido, NO_SIRVE } from '../src/logica/calculo.js';
import { INCIDENCIA } from '../src/logica/pedidos.js';
import { modeloPrueba, pedido, cargarModeloReal } from './datos.js';

const importe = (zona, bultos, peso, empresa = 'Alfa', modelo = modeloPrueba()) =>
  calcularImporte(pedido(zona, bultos, peso), empresa, modelo).importe;

grupo('Precio base por tramos', () => {
  test('justo en el límite va al tramo (5,0 kg → "hasta 5")', () => igual(importe('Z1', 1, 5), 500));
  test('un poco más pasa al siguiente tramo', () => igual(importe('Z1', 1, 5.01), 1000));
  test('primer tramo', () => igual(importe('Z1', 1, 0.6), 400));
  test('límite del último tramo (40 kg)', () => igual(importe('Z1', 2, 40), 1000 + 100));
  test('40,1 kg → 1 kg adicional', () => igual(importe('Z1', 2, 40.1), 1000 + 50 + 100));
  test('41 kg → 1 kg adicional (redondeo exacto)', () => igual(importe('Z1', 2, 41), 1000 + 50 + 100));
  test('41,01 kg → 2 kg adicionales', () => igual(importe('Z1', 2, 41.01), 1000 + 100 + 100));
});

grupo('Recargo por bultos', () => {
  test('1 bulto no tiene recargo', () => igual(importe('Z1', 1, 3), 500));
  test('3 bultos → 2 bultos adicionales', () => igual(importe('Z1', 3, 3), 500 + 200));
});

grupo('¿Puede servirlo?', () => {
  test('no opera en la zona', () => {
    const r = calcularImporte(pedido('Z3', 1, 3), 'Alfa', modeloPrueba());
    igual(r.puede, false);
    igual(r.motivo, NO_SIRVE.ZONA);
  });
  test('supera el peso máximo por bulto', () => {
    const r = calcularImporte(pedido('Z1', 1, 31), 'Alfa', modeloPrueba());
    igual(r.puede, false);
    igual(r.motivo, NO_SIRVE.PESO_BULTO);
  });
  test('peso medio igual al máximo sí se admite (60 kg en 2 bultos, máx. 30)', () => {
    igual(calcularImporte(pedido('Z1', 2, 60), 'Alfa', modeloPrueba()).puede, true);
  });
});

grupo('Elección de transportista', () => {
  test('empate de importe → menor plazo', () => {
    igual(asignarPedido(pedido('Z1', 1, 3), modeloPrueba({ plazoAlfa: 3, plazoBeta: 1 })).elegido, 'Beta');
  });
  test('empate de importe y plazo → orden alfabético', () => {
    igual(asignarPedido(pedido('Z1', 1, 3), modeloPrueba({ plazoAlfa: 1, plazoBeta: 1 })).elegido, 'Alfa');
  });
  test('nadie puede servirlo → incidencia con motivo', () => {
    const r = asignarPedido(pedido('Z1', 1, 35), modeloPrueba());
    igual(r.estado, 'incidencia');
    igual(r.incidencia, INCIDENCIA.SIN_TRANSPORTISTA);
    igual(r.detalle, 'Beta: supera 30 kg por bulto · Alfa: supera 30 kg por bulto · Gamma: no opera en la zona');
  });
  test('pedido con problemas no se calcula', () => {
    const p = { ...pedido(null, 1, 3), problemas: [{ tipo: INCIDENCIA.PROVINCIA, detalle: 'x' }] };
    const r = asignarPedido(p, modeloPrueba());
    igual(r.estado, 'incidencia');
    igual(r.incidencia, INCIDENCIA.PROVINCIA);
    igual(r.importe, null);
  });
});

grupo('Casos con las tarifas reales', () => {
  test('Madrid, 1 bulto de 45 kg: solo Transportes Levante (31,50 + 5 × 0,85)', async () => {
    const r = asignarPedido(pedido('Z3', 1, 45), await cargarModeloReal());
    igual(r.elegido, 'Transportes Levante');
    igual(r.importe, 3575);
    igual(r.opciones.PaqNacional.motivo, NO_SIRVE.PESO_BULTO);
  });
  test('Madrid, 5 bultos y 41 kg: PaqNacional 22,60 + 0,55 + 4 × 1,10', async () => {
    const r = asignarPedido(pedido('Z3', 5, 41), await cargarModeloReal());
    igual(r.elegido, 'PaqNacional');
    igual(r.importe, 2755);
  });
  test('Canarias: solo PaqNacional e IslasCargo', async () => {
    const r = asignarPedido(pedido('Z5', 1, 1.2), await cargarModeloReal());
    igual(r.elegido, 'IslasCargo');
    igual(r.opciones.RápidoExpress.motivo, NO_SIRVE.ZONA);
  });
});
