// Construye el modelo de tarifas a partir de los tres CSV empaquetados con la aplicación.
import { leerCsv } from './csv.js';
import { normalizar } from './normalizar.js';
import { parsearNumero, aCentimos } from './formato.js';

// Los CSV solo traen el código de zona; estos son sus nombres legibles.
export const NOMBRES_ZONA = {
  Z1: 'Provincial',
  Z2: 'Regional',
  Z3: 'Peninsular',
  Z4: 'Baleares',
  Z5: 'Canarias',
  Z6: 'Ceuta y Melilla',
};

export function nombreZona(codigo) {
  return NOMBRES_ZONA[codigo] ? `${codigo} ${NOMBRES_ZONA[codigo]}` : codigo;
}

// Modelo resultante:
// {
//   empresas: ['RápidoExpress', ...]          (en el orden en que aparecen en tarifas.csv)
//   zonas: [{ codigo, nombre, provincias: [...] }]
//   provincias: Map(nombreNormalizado → { provincia, zona })   (incluye alias)
//   servicio: Map(empresa → Map(zona → { tramos, plazoDias, eurKgAdicional, eurBultoAdicional, pesoMaxBultoKg }))
// }
// Los importes (precio de tramo, € por kg y € por bulto) están en céntimos.
export function construirModelo({ tarifas, condiciones, provincias }) {
  const zonas = new Map();
  const indiceProvincias = new Map();
  for (const f of leerCsv(provincias, ',').filas) {
    if (!f.provincia || !f.zona) continue;
    if (!zonas.has(f.zona)) {
      zonas.set(f.zona, { codigo: f.zona, nombre: NOMBRES_ZONA[f.zona] ?? f.zona, provincias: [] });
    }
    zonas.get(f.zona).provincias.push(f.provincia);
    const nombres = [f.provincia, ...(f.alias || '').split('|')].map((s) => s.trim()).filter(Boolean);
    for (const n of nombres) indiceProvincias.set(normalizar(n), { provincia: f.provincia, zona: f.zona });
  }

  const empresas = [];
  const tramos = new Map();
  for (const f of leerCsv(tarifas, ',').filas) {
    if (!f.empresa || !f.zona) continue;
    if (!empresas.includes(f.empresa)) empresas.push(f.empresa);
    const clave = `${f.empresa}|${f.zona}`;
    if (!tramos.has(clave)) tramos.set(clave, []);
    tramos.get(clave).push({
      hastaKg: parsearNumero(f.peso_hasta_kg),
      precio: aCentimos(parsearNumero(f.precio_eur)),
    });
  }

  const servicio = new Map(empresas.map((e) => [e, new Map()]));
  for (const f of leerCsv(condiciones, ',').filas) {
    const t = tramos.get(`${f.empresa}|${f.zona}`);
    // Sin tramos de precio no se puede calcular: se trata como "no da servicio".
    if (!t || t.length === 0 || !servicio.has(f.empresa)) continue;
    servicio.get(f.empresa).set(f.zona, {
      zona: f.zona,
      tramos: [...t].sort((a, b) => a.hastaKg - b.hastaKg),
      plazoDias: parsearNumero(f.plazo_dias),
      eurKgAdicional: aCentimos(parsearNumero(f.eur_kg_adicional)),
      eurBultoAdicional: aCentimos(parsearNumero(f.eur_bulto_adicional)),
      pesoMaxBultoKg: parsearNumero(f.peso_max_por_bulto_kg),
    });
  }

  const zonasOrdenadas = [...zonas.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
  return { empresas, zonas: zonasOrdenadas, provincias: indiceProvincias, servicio };
}

// Busca una provincia ignorando mayúsculas, tildes y espacios, y aceptando alias.
export function buscarProvincia(modelo, texto) {
  return modelo.provincias.get(normalizar(texto)) ?? null;
}

// Condiciones de una empresa en una zona, o null si no da servicio allí.
export function condicionesDe(modelo, empresa, zona) {
  return modelo.servicio.get(empresa)?.get(zona) ?? null;
}
