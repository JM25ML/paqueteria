import { grupo, test, igual } from './runner.js';
import { buscarProvincia, condicionesDe } from '../src/logica/tarifas.js';
import { fichasTarifas } from '../src/logica/textoTarifas.js';
import { cargarModeloReal } from './datos.js';

const E = ' €';

grupo('Modelo de tarifas', () => {
  test('empresas en el orden de tarifas.csv', async () => {
    const m = await cargarModeloReal();
    igual(m.empresas, ['RápidoExpress', 'Transportes Levante', 'PaqNacional', 'IslasCargo']);
  });
  test('seis zonas', async () => {
    const m = await cargarModeloReal();
    igual(m.zonas.map((z) => z.codigo), ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6']);
  });
  test('precios en céntimos y tramos ordenados', async () => {
    const m = await cargarModeloReal();
    const c = condicionesDe(m, 'RápidoExpress', 'Z1');
    igual(c.tramos.map((t) => t.hastaKg), [2, 5, 10, 20, 40]);
    igual(c.tramos[0].precio, 420);
    igual(c.eurKgAdicional, 55);
    igual(c.eurBultoAdicional, 120);
    igual(c.pesoMaxBultoKg, 30);
  });
  test('sin fila en condiciones = no da servicio', async () => {
    const m = await cargarModeloReal();
    igual(condicionesDe(m, 'IslasCargo', 'Z1'), null);
    igual(condicionesDe(m, 'Transportes Levante', 'Z4'), null);
  });
});

grupo('Búsqueda de provincias', () => {
  const casos = [
    ['Valencia', 'Valencia', 'Z1'],
    ['Alacant', 'Alicante', 'Z2'],
    ['girona', 'Girona', 'Z3'],
    ['Avila', 'Ávila', 'Z3'],
    ['La Coruña', 'A Coruña', 'Z3'],
    ['coruña', 'A Coruña', 'Z3'],
    ['  VIZCAYA ', 'Bizkaia', 'Z3'],
    ['Baleares', 'Illes Balears', 'Z4'],
    ['Santa  Cruz de Tenerife', 'Santa Cruz de Tenerife', 'Z5'],
  ];
  for (const [texto, provincia, zona] of casos) {
    test(`«${texto}» → ${provincia} (${zona})`, async () => {
      const m = await cargarModeloReal();
      igual(buscarProvincia(m, texto), { provincia, zona });
    });
  }
  test('provincia desconocida → null', async () => {
    const m = await cargarModeloReal();
    igual(buscarProvincia(m, 'Andorra'), null);
    igual(buscarProvincia(m, ''), null);
  });
});

grupo('Textos de la pantalla Tarifas', () => {
  test('tramos legibles', async () => {
    const f = fichasTarifas(await cargarModeloReal())[0];
    igual(f.empresa, 'RápidoExpress');
    igual(f.zonas[0].tramos[0], `Hasta 2 kg: 4,20${E}`);
    igual(f.zonas[0].kgAdicional, `0,55${E} por cada kg por encima de 40 kg`);
    igual(f.zonas[0].bultoAdicional, `1,20${E} por cada bulto a partir del segundo`);
    igual(f.zonas[0].pesoMax, '30 kg por bulto');
    igual(f.zonas[0].plazo, '1 día');
  });
  test('zonas con y sin servicio', async () => {
    const islas = fichasTarifas(await cargarModeloReal()).find((f) => f.empresa === 'IslasCargo');
    igual(islas.zonas.map((z) => z.codigo), ['Z4', 'Z5']);
    igual(islas.sinServicio.length, 4);
    igual(islas.zonas[1].plazo, '3 días');
  });
});
