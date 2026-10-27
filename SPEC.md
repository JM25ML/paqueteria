# Asignador de paquetería — Especificación

## Objetivo
Aplicación web que, a partir de un fichero de pedidos de venta, decide qué empresa de paquetería
debe servir cada pedido para minimizar el coste de transporte, y muestra en pantalla la decisión
junto con lo que habría costado con cada uno de los otros transportistas.

Usuario tipo: personal de logística o administración de una pyme que envía desde un almacén en
Valencia. No es técnico. Debe poder usarla sin formación.

## Restricciones técnicas
- Aplicación **estática**: todo se ejecuta en el navegador. Sin backend, sin base de datos, sin login.
- Las tarifas (`data/tarifas.csv`, `data/condiciones.csv`, `data/provincias_zonas.csv`) van
  empaquetadas con la aplicación y se cargan al arrancar.
- El usuario sube el fichero de pedidos. Los datos no salen de su navegador.
- Debe poder publicarse gratis como sitio estático (GitHub Pages, Netlify o similar).
- Interfaz en español. Importes en euros con formato español (1.234,56 €).
- La lógica de cálculo debe estar separada de la interfaz y tener tests automáticos.

## Ficheros de entrada

### Pedidos (lo sube el usuario) — `data/pedidos_ejemplo.csv` es un ejemplo
CSV en UTF-8, separado por comas, decimales con punto. **Solo estas cinco columnas**, una fila
por pedido. No se pide el peso de cada bulto: todo se calcula con el peso total.

| Columna | Descripción |
|---|---|
| pedido_id | Número de pedido (ej. PV-1001) |
| codigo_cliente | Código de cliente (ej. CL-0107) |
| provincia | Provincia de destino |
| bultos | Número total de bultos del pedido (entero ≥ 1) |
| peso_total_kg | Peso total del pedido en kg (> 0) |

### Provincias y zonas — `data/provincias_zonas.csv`
Cada provincia pertenece a una zona de envío (Z1 Provincial, Z2 Regional, Z3 Peninsular,
Z4 Baleares, Z5 Canarias, Z6 Ceuta y Melilla). La columna `alias` contiene nombres alternativos
separados por `|` (ej. "Alacant", "La Coruña|Coruña", "Vizcaya").

### Tarifas — `data/tarifas.csv`
Precio por empresa, zona y tramo de peso. `peso_hasta_kg` es el límite superior **incluido** del
tramo (un pedido de 5,0 kg va al tramo "hasta 5").

### Condiciones — `data/condiciones.csv`
Por empresa y zona: plazo de entrega en días, euros por kg adicional, euros por bulto adicional y
peso máximo admitido por bulto. Si una combinación empresa-zona no aparece, esa empresa no da
servicio en esa zona.

## Reglas de cálculo
Para cada pedido y cada empresa:

1. **Zona**: se obtiene de la provincia. La comparación ignora mayúsculas, tildes y espacios
   sobrantes, y acepta los alias.
2. **¿Puede servirlo?** No, si la empresa no opera en esa zona o si el peso medio por bulto
   supera su peso máximo por bulto. El peso medio se calcula como peso_total_kg / bultos
   (se asume que los bultos de un pedido pesan lo mismo).
3. **Precio base**: el del primer tramo cuyo `peso_hasta_kg` sea ≥ peso del pedido.
   Si el peso supera el último tramo: precio del último tramo + (kg por encima del último tramo,
   **redondeados hacia arriba** a kg entero) × euros por kg adicional.
4. **Recargo por bultos**: (bultos − 1) × euros por bulto adicional.
5. **Importe** = precio base + recargo por bultos, redondeado a 2 decimales.

**Elección**: la empresa con menor importe. Empate → menor plazo. Si persiste → orden alfabético.

**Casos especiales** (el pedido se muestra, marcado, y no suma en los totales):
- Provincia no reconocida → "Provincia no reconocida".
- Bultos o peso vacíos, cero o negativos → "Datos no válidos".
- Ninguna empresa puede servirlo → "Sin transportista disponible" (mostrando el motivo).

## Pantallas
Aplicación de una sola página con cinco pantallas. Todas, salvo Home, tienen un botón
"Volver a inicio". Los pedidos cargados se mantienen en memoria mientras la página esté
abierta, de modo que el usuario puede ir y volver entre pantallas sin recargar el fichero.

### Pantalla 1: Home
- Para qué sirve: pantalla de bienvenida.
- Qué se ve: saludo y explicación breve de para qué sirve la aplicación (elegir el transportista
  más barato para cada pedido a partir de las tarifas pactadas).
- Qué puede hacer el usuario: cuatro botones: **Ver tarifas**, **Cargar pedidos**,
  **Ver pedidos** y **Ver resultado**.
- "Ver pedidos" y "Ver resultado" aparecen desactivados hasta que se hayan cargado pedidos,
  con un texto que lo indique (ej. "Carga primero un fichero de pedidos").

### Pantalla 2: Cargar pedidos
- Para qué sirve: subir el fichero CSV de pedidos.
- El usuario puede arrastrar y soltar el fichero sobre una zona de carga o pulsar para
  buscarlo en sus carpetas.
- Incluye además un botón **Probar con datos de ejemplo**, que carga
  `data/pedidos_ejemplo.csv` (útil para demostraciones).
- Al cargarse correctamente, la aplicación pasa directamente a la pantalla Ver pedidos.
- Si el fichero no es un CSV o le faltan columnas, se queda en esta pantalla y muestra un
  mensaje claro indicando qué falta.
- Botón para volver a Home.

### Pantalla 3: Tarifas
- Para qué sirve: consultar las tarifas de cada transportista, explicadas como texto legible
  para alguien no técnico.
- Un bloque por transportista con: zonas en las que da servicio (y qué provincias forman cada
  zona), precio por tramo de peso en cada zona (ej. "Hasta 2 kg: 4,20 €"), coste por kg
  adicional por encima de 40 kg, coste por bulto adicional, peso máximo por bulto y plazo de
  entrega.
- El texto se genera a partir de los ficheros de tarifas, no se escribe a mano.
- Botón para volver a Home.

### Pantalla 4: Ver pedidos
- Para qué sirve: revisar los pedidos cargados antes de calcular.
- Tabla con una fila por pedido y estas columnas: **Pedido**, **Provincia**,
  **Código de cliente**, **Bultos**, **Peso total (kg)**.
- Las filas con problemas (provincia no reconocida, bultos o peso no válidos) aparecen
  destacadas con el motivo, para que el usuario lo vea antes de pasar al resultado.
- Encima de la tabla: número de pedidos cargados y número de pedidos con problemas.
- Dos botones: **Ver resultado** y **Volver a inicio**.

### Pantalla 5: Resultado (la más importante)
Tabla con una fila por pedido y estas columnas:

| Pedido | Código de cliente | Transportista elegido | Importe | RápidoExpress | Transportes Levante | PaqNacional | IslasCargo |
|---|---|---|---|---|---|---|---|

- Una columna por cada transportista con su importe para ese pedido. Se generan a partir de las
  empresas que aparezcan en las tarifas, no fijas en el código.
- En esas columnas, la celda del elegido se resalta; si un transportista no puede servirlo se
  muestra "—" y, al pasar el ratón, el motivo (no opera en la zona / supera kg por bulto).
- Los pedidos con error o sin transportista aparecen destacados con su motivo, sin importe.
- Encima de la tabla, un resumen:
  - Pedidos asignados / total, y pedidos con incidencia.
  - Coste total de la asignación óptima.
  - **Ahorro frente al transportista actual**: un desplegable para elegir el transportista actual
    (por defecto PaqNacional). Ahorro = coste con el actual − coste óptimo, calculado solo sobre
    los pedidos que el actual puede servir. Mostrar en euros y en %.
  - Reparto de pedidos por transportista elegido.
- Botón para volver a Home.

## Opcional (solo si sobra tiempo)
- Botón para descargar el resultado en CSV.
- Ordenar y filtrar la tabla de resultados por transportista o por incidencias.

## Fuera de alcance
Persistencia, usuarios, edición de tarifas desde la aplicación, conexión con ERP, plazos como
criterio de elección (solo desempate), peso volumétrico.

## Criterio de aceptación
Con `data/pedidos_ejemplo.csv`, la aplicación debe reproducir exactamente el resultado de
referencia: 27 pedidos asignados, 3 incidencias, coste óptimo 598,40 € y ahorro frente a
PaqNacional de 38,30 € (6,4 %) sobre 26 pedidos.
