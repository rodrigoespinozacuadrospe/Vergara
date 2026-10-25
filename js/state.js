/* Estado global de la aplicación. Se guarda en el navegador (localStorage). */
Vergara.ESTADO = { PENDIENTE: "Pendiente", LISTO: "Listo", ENTREGADO: "Entregado" };

Vergara.state = {
  // --- Datos persistentes ---
  productos: [], pedidos: [], movimientos: [], notificaciones: [], siguienteId: 1,
  // --- Estado de la sesión (no se guarda) ---
  rol: null, pestana: null, clienteSeleccionado: 0, carrito: {},
  filtroEstado: "Todos", chat: [],

  // Restaura los datos de fábrica
  reiniciar() {
    this.productos = JSON.parse(JSON.stringify(Vergara.data.productos));
    this.pedidos = []; this.movimientos = []; this.notificaciones = [];
    this.siguienteId = 1; this.carrito = {}; this.chat = []; this.filtroEstado = "Todos";
  }
};
Vergara.state.reiniciar();
