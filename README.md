# Vergara Logística · Tienda mayorista y operaciones

Aplicación moderna desarrollada en **React 18 + TypeScript + Vite**, adaptada fielmente a partir del prototipo original. Integra la tienda mayorista para clientes y el centro de operaciones con control de acceso por roles.

## Ejecución del proyecto

Para iniciar el servidor de desarrollo en el puerto 3000:

```bash
npm install
npm run dev
```

Para compilar la aplicación para producción:

```bash
npm run build
```

## Arquitectura y Módulos

### 1. Tienda Mayorista (`Storefront`)
- Catálogo completo con 8 productos mayoristas ilustrados.
- Filtros por categorías (Abarrotes, Desayunos, Limpieza y hogar).
- Filtro de favoritos («Mi lista») y buscador en tiempo real.
- Ordenamiento por recomendados, menor/mayor precio y alfabético.
- Carrito de compras interactivo con validación de stock y selector de cliente.
- Seguimiento visual de pedidos con historial por cliente.
- Asistente de consultas integrado con respuestas automáticas por palabras clave.

### 2. Centro de Operaciones (`Operations Center`)
- **Control de acceso por roles (RBAC)**:
  - *Cliente*: Nuevo pedido y Asistente virtual.
  - *Ventas*: Nuevo pedido y Panel de Ventas por cliente.
  - *Almacén*: Inventario en tiempo real, registro por código de barras, picking y reposición EOQ.
  - *Repartidor*: Distribución y seguimiento de rutas optimizadas.
  - *Gerencia*: Acceso completo a todos los módulos y KPIs globales.
- **Resumen general (Dashboard)**: Ventas acumuladas, pedidos totales, porcentaje de entregas, alertas de stock bajo y proyección de demanda a 30 días.
- **Distribución**: Cálculo de ruta optimizada mediante el algoritmo del vecino más cercano (TSP) desde el almacén (0,0), visualización en mapa esquemático SVG y confirmación de entregas con firma digital y foto.
- **Laboratorio de IA y NumPy**: Análisis estadístico interactivo de minutos de reproducción de 12 usuarios, alternancia dinámica para excluir el valor atípico (U7: 300 min), visualización de métricas (Media, Mediana, Desviación Estándar con ddof=0) y descarga de scripts de solución en Python y cuadernos Jupyter.

### 3. Persistencia de Datos
- Sincronización continua de inventario, pedidos, movimientos de almacén (kardex), notificaciones y carritos en `localStorage`.
- Exportación directa de pedidos, inventario e historial de movimientos a formato CSV.
