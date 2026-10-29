# Vergara Logística · Python + Bootstrap

Tienda mayorista y centro de operaciones desarrollados en **Python 3.12+, Flask y Bootstrap 5**. Diseño rojo y blanco, adaptable a móviles. No requiere Node, npm, React, TypeScript ni compilación de frontend.

Todo el código de la aplicación está en archivos Python. Las plantillas y la personalización visual se generan desde `ui.py`; Bootstrap se sirve localmente desde el paquete `Bootstrap-Flask`, sin CDN ni conexión a Internet durante el uso. El navegador recibe HTML, CSS y los componentes de Bootstrap, como en cualquier interfaz web.

## Instalar y ejecutar

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.lock
python app.py
```

El servidor escucha en el puerto **3000**. Para cambiarlo, utiliza la variable `PORT`.

En Windows, activa el entorno con `.venv\Scripts\activate`.

## Ejecutar en Google Colab

[Abrir Vergara en Google Colab](https://colab.research.google.com/github/rodrigoespinozacuadrospe/Vergara/blob/main/colab/Ejecutar_Vergara.ipynb)

1. Abre el cuaderno y conecta el entorno de ejecución.
2. Selecciona **Entorno de ejecución → Ejecutar todas**.
3. Pulsa **Abrir tienda Vergara** al terminar las celdas.

Colab instala las dependencias, inicia Gunicorn y ofrece acceso a la aplicación desde la sesión del cuaderno. Mantén la sesión conectada: el enlace y los datos son temporales, no un despliegue permanente. No necesitas configurar Render para esta opción.

El cuaderno de arranque se genera con `python colab_launcher.py`; sus celdas también son Python. GitHub excluye ese artefacto generado del cálculo de lenguajes. El acceso a la ventana depende de Colab y se verifica al ejecutarlo allí; las celdas de arranque se probaron con el servidor local.

## Qué incluye

- **Tienda:** ocho productos ilustrados, búsqueda, categorías, favoritos, ordenamiento, carrito con cantidades y stock, selección de cliente y seguimiento de los pedidos de la sesión.
- **Resumen general:** ventas, pedidos, entregas, alertas de stock y demanda estimada.
- **Nuevo pedido y ventas:** registro de pedidos, filtro por estado y ventas por cliente.
- **Inventario:** entradas y salidas por código, kardex, reposición EOQ y preparación de pedidos.
- **Distribución:** ruta por vecino más cercano, mapa esquemático, nombre del receptor y confirmación de foto tomada. Esta última es una constancia de demostración; no se suben fotografías ni se capturan firmas manuscritas.
- **Asistente:** respuestas locales por palabras clave sobre productos, precios, stock, pedidos y entregas. No utiliza una API de IA.
- **Laboratorio NumPy:** media, mediana, desviación poblacional, comparación sin U7 y regla del IQR. El cuaderno Jupyter se genera al descargarlo; no se mantiene un archivo Notebook como fuente.
- **Exportaciones CSV:** pedidos, inventario y movimientos; los importes se exportan en céntimos y se identifican en las cabeceras.

## Datos y roles

Los pedidos y el inventario se guardan en SQLite (`instance/vergara.sqlite3`). El catálogo se inicializa una sola vez; reiniciar el servidor conserva los cambios. El carrito, los favoritos y el seguimiento personal dependen de la sesión del navegador. Los datos que existían en `localStorage` o Firebase en la versión anterior **no se importan automáticamente**.

La selección de roles es de **demostración**, no autenticación de usuarios: cualquier visitante puede elegir Cliente, Ventas, Almacén, Repartidor o Gerencia. Las rutas comprueban las funciones permitidas del rol seleccionado. La integración anterior de Google/Firebase se sustituyó por persistencia local. Antes de usar datos reales, hace falta incorporar autenticación y permisos de usuarios.

Al primer arranque se genera una clave de sesión local en `instance/secret.key`. No se versionan claves ni bases de datos. En un despliegue, puede configurarse `VERGARA_SECRET_KEY` mediante las variables seguras del proveedor.

## Pruebas

```bash
python -m unittest discover -s tests -v
python laboratorio/analisis_numpy.py
```

Las pruebas usan bases temporales: validan pedidos, inventario, persistencia, permisos de los roles, formularios, filtros, exportaciones y laboratorio sin modificar los datos de la aplicación.

## Organización

| Archivo | Responsabilidad |
| --- | --- |
| `app.py` | Rutas Flask, formularios, sesiones y descargas |
| `store.py` | SQLite, transacciones, inventario, pedidos, EOQ y rutas |
| `ui.py` | Pantallas Bootstrap y diseño rojo y blanco |
| `tests/test_app.py` | Pruebas funcionales y de persistencia |
| `laboratorio/analisis_numpy.py` | Análisis reproducible con NumPy |
| `assets/` | Ilustraciones, logotipos y fuentes con sus licencias |

`requirements.txt` declara las dependencias directas y `requirements.lock` fija todas las versiones verificadas.

## Publicación

GitHub conserva el código. **GitHub Pages no ejecuta aplicaciones Python/Flask**: para publicar la tienda se necesita un servidor con Python y almacenamiento persistente para SQLite. `python app.py` es el servidor de desarrollo; un despliegue público debe usar un servidor WSGI, HTTPS y configuración de producción.

### Demostración en Render

[Desplegar en Render](https://render.com/deploy?repo=https://github.com/rodrigoespinozacuadrospe/Vergara)

El repositorio incluye `render.yaml` para preparar un servicio gratuito con Gunicorn y una clave de sesión generada por Render. Abre el enlace, inicia sesión y aplica el Blueprint. Cuando termine el despliegue, Render mostrará la dirección pública del servicio. Este enlace abre la configuración; no es una aplicación ya desplegada.

**El plan gratuito es para demostración:** puede suspenderse por inactividad y su almacenamiento es temporal. Los pedidos y cambios de inventario de SQLite se pierden al reiniciar o desplegar de nuevo. Para conservar datos utiliza almacenamiento persistente y cambia la ruta de la base de datos. La selección de roles sigue siendo de demostración.
