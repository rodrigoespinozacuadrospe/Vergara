/* Lógica de pedidos: carrito, confirmación, preparación y entrega. */
Vergara.pedidos = {
  buscarPorId(id) { return Vergara.state.pedidos.find(p => p.id === id); },
  cliente(pedido) { return Vergara.data.clientes[pedido.clienteIdx]; },

  totalCarrito() {
    const { productos, carrito } = Vergara.state;
    return productos.reduce((suma, p) => suma + (carrito[p.codigo] || 0) * p.precio, 0);
  },

  cantidadCarrito() {
    return Object.values(Vergara.state.carrito).reduce((a, b) => a + b, 0);
  },

  // Cambia la cantidad sin superar el stock disponible
  cambiarCantidad(codigo, delta) {
    const p = Vergara.state.productos.find(x => x.codigo === codigo);
    const actual = Vergara.state.carrito[codigo] || 0;
    Vergara.state.carrito[codigo] = Math.max(0, Math.min(p.stock, actual + delta));
  },

  // Valida stock, crea el pedido, descuenta inventario y notifica al cliente
  confirmar() {
    const s = Vergara.state;
    const items = s.productos.filter(p => (s.carrito[p.codigo] || 0) > 0);
    if (!items.length) return { ok: false, mensaje: "Agregue productos al pedido" };

    const sinStock = items.find(p => s.carrito[p.codigo] > p.stock);
    if (sinStock) return { ok: false, mensaje: "Sin stock suficiente: " + sinStock.nombre };

    const pedido = {
      id: s.siguienteId++, clienteIdx: s.clienteSeleccionado,
      items: items.map(p => ({ codigo: p.codigo, nombre: p.nombre, cantidad: s.carrito[p.codigo], precio: p.precio })),
      total: this.totalCarrito(), estado: Vergara.ESTADO.PENDIENTE, creado: Date.now()
    };
    pedido.items.forEach(i => Vergara.inventario.mover(s.productos.find(p => p.codigo === i.codigo), -i.cantidad, "Venta pedido #" + pedido.id));
    s.pedidos.push(pedido);
    s.carrito = {};
    Vergara.notificaciones.agregar(pedido.clienteIdx, `Pedido #${pedido.id} confirmado (${Vergara.ui.moneda(pedido.total)}). Entrega estimada: mañana.`);
    return { ok: true, mensaje: `Pedido #${pedido.id} confirmado. Stock actualizado.` };
  },

  marcarPreparado(id) {
    const p = this.buscarPorId(id);
    if (!p || p.estado !== Vergara.ESTADO.PENDIENTE) return {ok:false,mensaje:"El pedido no está pendiente"};
    p.estado = Vergara.ESTADO.LISTO;
    p.preparado = Date.now();
    Vergara.notificaciones.agregar(p.clienteIdx, `Pedido #${id} preparado. Saldrá en la próxima ruta de reparto.`);
    return { ok: true, mensaje: `Pedido #${id} listo para despacho` };
  },

  confirmarEntrega(id, firma, foto) {
    if (!firma.trim()) return { ok: false, mensaje: "Ingrese el nombre de quien recibe (firma digital)" };
    if (!foto) return { ok: false, mensaje: "Marque que se tomó la foto de entrega" };
    const p = this.buscarPorId(id);
    if (!p || p.estado !== Vergara.ESTADO.LISTO) return {ok:false,mensaje:"El pedido debe estar preparado"};
    p.estado = Vergara.ESTADO.ENTREGADO;
    p.firmadoPor = firma.trim();
    p.entregado = Date.now();
    Vergara.notificaciones.agregar(p.clienteIdx, `Pedido #${id} entregado. Recibió: ${p.firmadoPor}.`);
    return { ok: true, mensaje: `Entrega #${id} confirmada` };
  }
};
