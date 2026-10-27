// Datos compartidos por los tests: tarifas reales de data/ y un modelo pequeño inventado.
import { construirModelo } from '../src/logica/tarifas.js';

let modeloReal = null;

export async function leerFichero(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`No se pudo leer ${ruta}`);
  return r.text();
}

export async function cargarModeloReal() {
  if (!modeloReal) {
    const [tarifas, condiciones, provincias] = await Promise.all([
      leerFichero('data/tarifas.csv'),
      leerFichero('data/condiciones.csv'),
      leerFichero('data/provincias_zonas.csv'),
    ]);
    modeloReal = construirModelo({ tarifas, condiciones, provincias });
  }
  return modeloReal;
}

// Modelo inventado para probar casos límite con números redondos.
// Beta y Alfa cobran lo mismo en Z1 (para probar desempates); Alfa tarda más.
export function modeloPrueba({ plazoAlfa = 3, plazoBeta = 1 } = {}) {
  return construirModelo({
    provincias: 'provincia,zona,alias\nValencia,Z1,València\nMadrid,Z3,\n',
    tarifas: [
      'empresa,zona,peso_hasta_kg,precio_eur',
      'Beta,Z1,2,4.00', 'Beta,Z1,5,5.00', 'Beta,Z1,40,10.00',
      'Alfa,Z1,2,4.00', 'Alfa,Z1,5,5.00', 'Alfa,Z1,40,10.00',
      'Gamma,Z3,40,20.00',
    ].join('\n'),
    condiciones: [
      'empresa,zona,plazo_dias,eur_kg_adicional,eur_bulto_adicional,peso_max_por_bulto_kg',
      `Beta,Z1,${plazoBeta},0.50,1.00,30`,
      `Alfa,Z1,${plazoAlfa},0.50,1.00,30`,
      'Gamma,Z3,2,1.00,1.00,30',
    ].join('\n'),
  });
}

export function pedido(zona, bultos, pesoKg) {
  return { pedidoId: 'T', codigoCliente: 'C', provinciaTexto: '', zona, bultos, pesoKg, problemas: [] };
}
