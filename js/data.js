/* Datos iniciales y configuración. Edita aquí para usar datos reales de la empresa. */
window.Vergara = window.Vergara || {};

Vergara.data = {
  // stock = unidades actuales | reorden = punto de reorden | historial = ventas de las últimas 6 semanas
  productos: [
    { codigo: "7750001", nombre: "Arroz 5 kg",   precio: 24.0, stock: 120, reorden: 60, historial: [30, 34, 28, 36, 40, 38] },
    { codigo: "7750002", nombre: "Aceite 1 L",   precio: 9.5,  stock: 34,  reorden: 40, historial: [22, 25, 24, 30, 28, 33] },
    { codigo: "7750003", nombre: "Azúcar 1 kg",  precio: 4.2,  stock: 90,  reorden: 50, historial: [40, 38, 45, 42, 47, 44] },
    { codigo: "7750004", nombre: "Fideos 500 g", precio: 3.1,  stock: 55,  reorden: 50, historial: [50, 48, 52, 55, 53, 60] },
    { codigo: "7750005", nombre: "Leche 400 g",  precio: 4.8,  stock: 18,  reorden: 30, historial: [35, 30, 34, 38, 36, 40] }
  ],
  // x, y = coordenadas ficticias en km respecto al almacén (0,0)
  clientes: [
    { nombre: "Bodega Los Olivos", x: 2, y: 3 },
    { nombre: "Minimarket Aurora", x: 5, y: 1 },
    { nombre: "Bodega San José",   x: 1, y: 6 },
    { nombre: "Tienda Doña Rosa",  x: 6, y: 5 }
  ],
  pestanas: {
    laboratorio: "Laboratorio IA",
    cliente:      "Nuevo pedido",
    asistente:    "Asistente (WhatsApp)",
    ventas:       "Panel de Ventas",
    almacen:      "Almacén",
    distribucion: "Distribución",
    dashboard:    "Dashboard"
  },
  // Control de acceso: cada rol solo ve las pantallas de su función
  roles: {
    cliente:    { titulo: "Cliente",    descripcion: "Realiza pedidos y consulta su estado",       pestanas: ["cliente", "asistente"] },
    ventas:     { titulo: "Ventas",     descripcion: "Registra pedidos y revisa ventas",           pestanas: ["cliente", "ventas"] },
    almacen:    { titulo: "Almacén",    descripcion: "Controla inventario y prepara pedidos",      pestanas: ["almacen"] },
    repartidor: { titulo: "Repartidor", descripcion: "Sigue la ruta y confirma entregas",          pestanas: ["distribucion"] },
    gerencia:   { titulo: "Gerencia",   descripcion: "Ve todos los módulos y los indicadores",     pestanas: ["dashboard", "cliente", "ventas", "almacen", "distribucion", "asistente", "laboratorio"] }
  },
  // Parámetros de cálculo (EOQ y costos)
  config: { costoPorPedido: 40, factorMantenimiento: 0.25, costoPorKm: 2.5 }
};
