# Vergara · Intelligent Logistics

Prototipo académico mejorado a partir del ZIP proporcionado. HTML, CSS y JavaScript sin compilación ni dependencias web externas.

## Ejecutar la página

Desde `/workspace/Vergara`:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Abra la página servida en su navegador. También puede abrir `index.html` directamente. El panel inicia en Gerencia para explorar el prototipo; «Cambiar rol» permite probar Cliente, Ventas, Almacén y Repartidor.

## Funcionalidades

- Panel con indicadores calculados desde los pedidos, alertas de inventario y demanda estimada.
- Pedido → descuento de stock → preparación → entrega con nombre del receptor y confirmación simulada de foto.
- Inventario, reposición EOQ, CSV, asistente por palabras clave y datos persistentes en localStorage.
- Validación de salidas que exceden el stock, cantidades enteras y transiciones de estado.
- Diseño adaptable a escritorio y móvil, navegación por roles, mensajes de estado accesibles.
- Laboratorio IA/NumPy: gráfico de 12 usuarios, comparación con/sin U7, resultados y descargas Python/Colab.

## Laboratorio resuelto

Datos del PDF S11.s2: `[45,60,90,120,60,85,300,45,90,60,110,75]`.

| Medida | Todos (12) | Sin U7 (11) |
|---|---:|---:|
| Media (min) | 95.00 | 76.36 |
| Mediana (min) | 80.00 | 75.00 |
| Varianza poblacional (min²) | 4341.67 | 568.60 |
| Desviación poblacional (min) | 65.89 | 23.85 |

Q1=60, Q3=95, IQR=35, límites=7.5 y 147.5. U7 (300 min) es atípico. Validar antes de excluir: puede representar consumo intensivo real. No se puede inferir la eficacia del recomendador sin experimento y otras métricas.

```bash
python3 -m pip install -r laboratorio/requirements.txt
python3 laboratorio/analisis_numpy.py
```

También puede importar `laboratorio/Laboratorio_IA_NumPy.ipynb` en Google Colab. NumPy no es necesario para abrir la web.

## Validación

Probado con Chromium/Playwright: pedido de 10 unidades, stock descontado, preparación, entrega, persistencia al recargar, rechazo de salida excesiva, chatbot, navegación por roles, cambio de estadísticas y ausencia de desbordamiento horizontal a 390 px. Análisis ejecutado con NumPy 2.3.5. Capturas en `evidencias/`.

## Alcance del prototipo

No hay backend, autenticación real, integración WhatsApp/GPS ni aprendizaje automático. La predicción usa promedio móvil; las rutas usan coordenadas ficticias. La foto es una confirmación simulada, no un archivo capturado. Los roles limitan la interfaz, no proporcionan seguridad. Los datos permanecen en cada navegador; no se comparten entre dispositivos. «Reiniciar datos» borra las operaciones locales con confirmación.
