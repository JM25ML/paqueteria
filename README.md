# Asignador de paquetería

Aplicación web que, a partir de un fichero CSV de pedidos, elige el transportista más barato para
cada pedido según las tarifas pactadas, y muestra lo que habría costado con cada uno de los demás.
Todo se ejecuta en el navegador: los ficheros no salen del ordenador del usuario.

La especificación completa está en [SPEC.md](SPEC.md).

## Cómo usarla
1. Abre la aplicación (ver abajo).
2. Pulsa **Cargar pedidos** y arrastra tu CSV, o pulsa **Probar con datos de ejemplo**.
3. Revisa los pedidos y pulsa **Ver resultado**.

El CSV de pedidos necesita estas columnas: `pedido_id, codigo_cliente, provincia, bultos, peso_total_kg`.
Se acepta separado por comas o por punto y coma, y con punto o coma decimal (formato de Excel en español).

## Abrirla en tu ordenador
La aplicación lee las tarifas de `data/`, así que no funciona con doble clic sobre `index.html`:
hay que servirla con un servidor web. Desde esta carpeta:

```bash
python3 -m http.server 8765
```

y abre <http://localhost:8765>.

## Tests
Con el servidor anterior en marcha, abre <http://localhost:8765/tests.html>. La página ejecuta todos
los tests de la lógica de cálculo (incluido el criterio de aceptación de la especificación) y muestra
en verde los que pasan y en rojo los que fallan.

## Cambiar las tarifas
Edita los ficheros de `data/` (`tarifas.csv`, `condiciones.csv`, `provincias_zonas.csv`) y vuelve a
publicar. Los transportistas, zonas y columnas de la tabla de resultados salen de esos ficheros.

## Publicar en GitHub Pages
1. Crea un repositorio en GitHub y sube esta carpeta:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/paqueteria.git
   ```
   ```bash
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   rama `main`, carpeta `/ (root)`.
3. En un par de minutos estará en `https://TU_USUARIO.github.io/paqueteria/`.

## Estructura
```
index.html            Página única con las cinco pantallas
css/estilos.css       Estilos (modo claro y oscuro)
data/                 Tarifas, condiciones y provincias (empaquetadas con la app)
src/logica/           Cálculo, sin interfaz: CSV, provincias, importes, resumen, exportación
src/ui/               Interfaz: arranque, navegación y un fichero por pantalla
tests.html, tests/    Tests de la lógica en el navegador
```
