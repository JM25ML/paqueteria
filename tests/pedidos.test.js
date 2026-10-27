import { grupo, test, igual, cierto } from './runner.js';
import { leerPedidos, INCIDENCIA } from '../src/logica/pedidos.js';
import { cargarModeloReal } from './datos.js';

const CAB = 'pedido_id,codigo_cliente,provincia,bultos,peso_total_kg';

async function leer(texto) {
  return leerPedidos(texto, await cargarModeloReal());
}

grupo('Lectura del fichero de pedidos', () => {
  test('fichero correcto', async () => {
    const r = await leer(`${CAB}\nPV-1,CL-1,Alacant,2,6.5\n`);
    igual(r.ok, true);
    const p = r.pedidos[0];
    igual([p.pedidoId, p.codigoCliente, p.provincia, p.zona, p.bultos, p.pesoKg], ['PV-1', 'CL-1', 'Alicante', 'Z2', 2, 6.5]);
    igual(p.problemas, []);
  });
  test('faltan columnas → error que dice cuáles', async () => {
    const r = await leer('pedido_id,codigo_cliente,provincia\nPV-1,CL-1,Madrid\n');
    igual(r.ok, false);
    igual(r.faltan, ['bultos', 'peso_total_kg']);
    cierto(r.error.includes('bultos, peso_total_kg'), r.error);
  });
  test('fichero vacío', async () => igual((await leer('')).ok, false));
  test('solo cabecera', async () => {
    const r = await leer(`${CAB}\n`);
    igual(r.ok, false);
    cierto(r.error.includes('ningún pedido'));
  });
  test('títulos con mayúsculas y columnas extra se aceptan', async () => {
    const r = await leer('Pedido_ID,Codigo_Cliente,Provincia,Bultos,Peso_Total_Kg,Notas\nPV-1,CL-1,Madrid,1,3,hola\n');
    igual(r.ok, true);
    igual(r.pedidos[0].pesoKg, 3);
  });
  test('formato Excel español (punto y coma y coma decimal)', async () => {
    const r = await leer('pedido_id;codigo_cliente;provincia;bultos;peso_total_kg\nPV-1;CL-1;Valencia;1;1,8\n');
    igual(r.ok, true);
    igual(r.pedidos[0].pesoKg, 1.8);
  });
});

grupo('Problemas por fila', () => {
  const problema = async (fila) => (await leer(`${CAB}\n${fila}\n`)).pedidos[0].problemas;
  test('provincia no reconocida', async () => {
    const p = await problema('PV-1,CL-1,Andorra,1,5');
    igual(p.length, 1);
    igual(p[0].tipo, INCIDENCIA.PROVINCIA);
  });
  test('peso cero', async () => igual((await problema('PV-1,CL-1,Madrid,2,0'))[0].tipo, INCIDENCIA.DATOS));
  test('peso negativo', async () => igual((await problema('PV-1,CL-1,Madrid,2,-3'))[0].tipo, INCIDENCIA.DATOS));
  test('bultos vacíos', async () => {
    const p = await problema('PV-1,CL-1,Madrid,,3');
    igual(p[0].tipo, INCIDENCIA.DATOS);
    igual(p[0].detalle, 'Faltan los bultos');
  });
  test('bultos con decimales', async () => igual((await problema('PV-1,CL-1,Madrid,2.5,3'))[0].tipo, INCIDENCIA.DATOS));
  test('peso que no es número', async () => igual((await problema('PV-1,CL-1,Madrid,1,abc'))[0].tipo, INCIDENCIA.DATOS));
  test('varios problemas a la vez', async () => igual((await problema('PV-1,CL-1,Andorra,0,0')).length, 2));
});
