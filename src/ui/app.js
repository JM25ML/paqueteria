// Arranque de la aplicación: carga las tarifas, guarda el estado en memoria y cambia de pantalla.
import { construirModelo } from '../logica/tarifas.js';
import { leerPedidos } from '../logica/pedidos.js';
import { asignar } from '../logica/calculo.js';
import { activarAyudasFlotantes } from './dom.js';
import * as home from './pantallas/home.js';
import * as cargar from './pantallas/cargar.js';
import * as tarifas from './pantallas/tarifas.js';
import * as pedidos from './pantallas/pedidos.js';
import * as resultado from './pantallas/resultado.js';

const PANTALLAS = { home, cargar, tarifas, pedidos, resultado };
const NECESITAN_PEDIDOS = ['pedidos', 'resultado'];

// Estado de la aplicación. Solo vive en memoria mientras la página está abierta.
const estado = {
  modelo: null,
  nombreFichero: null,
  pedidos: null,
  resultados: null,
  actual: null,            // transportista actual elegido en el desplegable de ahorro
  filtro: 'todos',         // filtro de la tabla de resultados
  orden: { columna: null, ascendente: true },
};

function ir(nombre) {
  if (location.hash === `#${nombre}`) mostrar();
  else location.hash = nombre;
}

// Carga un CSV de pedidos. Devuelve el resultado de la lectura ({ ok, error, ... }).
function cargarPedidos(texto, nombreFichero) {
  const lectura = leerPedidos(texto, estado.modelo);
  if (lectura.ok) {
    estado.nombreFichero = nombreFichero;
    estado.pedidos = lectura.pedidos;
    estado.resultados = asignar(lectura.pedidos, estado.modelo);
    estado.filtro = 'todos';
    estado.orden = { columna: null, ascendente: true };
  }
  return lectura;
}

const ctx = { estado, ir, cargarPedidos };

function mostrar() {
  let nombre = location.hash.slice(1) || 'home';
  if (!PANTALLAS[nombre]) nombre = 'home';
  if (NECESITAN_PEDIDOS.includes(nombre) && !estado.pedidos) nombre = 'home';

  for (const [n] of Object.entries(PANTALLAS)) {
    document.getElementById(`pantalla-${n}`).hidden = n !== nombre;
  }
  const contenedor = document.getElementById(`pantalla-${nombre}`);
  PANTALLAS[nombre].render(contenedor, ctx);
  window.scrollTo(0, 0);
  contenedor.querySelector('h1')?.setAttribute('tabindex', '-1');
  contenedor.querySelector('h1')?.focus({ preventScroll: true });
}

async function leerTexto(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`${ruta}: ${r.status}`);
  return r.text();
}

async function arrancar() {
  const aviso = document.getElementById('arranque');
  try {
    const [t, c, p] = await Promise.all([
      leerTexto('data/tarifas.csv'),
      leerTexto('data/condiciones.csv'),
      leerTexto('data/provincias_zonas.csv'),
    ]);
    estado.modelo = construirModelo({ tarifas: t, condiciones: c, provincias: p });
  } catch (e) {
    aviso.className = 'mensaje error';
    aviso.textContent = 'No se han podido cargar las tarifas. Si has abierto el fichero con doble clic, '
      + 'ábrelo desde un servidor web (por ejemplo, la dirección publicada en GitHub Pages).';
    console.error(e);
    return;
  }
  aviso.remove();
  // Evita que soltar un fichero fuera de la zona de carga haga que el navegador lo abra.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
  window.addEventListener('hashchange', mostrar);
  activarAyudasFlotantes();
  mostrar();
}

arrancar();
