/* Lógica de inventario: búsqueda, movimientos (kardex), EOQ y reposición. */
Vergara.inventario = {
  buscar(texto) {
    const t = Vergara.ui.normalizar(texto.trim());
    if (!t) return null;
    return Vergara.state.productos.find(p => p.codigo === t || Vergara.ui.normalizar(p.nombre).includes(t)) || null;
  },

  // Aplica un movimiento al stock y lo registra en el historial
  mover(producto, cantidad, motivo) {
    producto.stock = Math.max(0, producto.stock + cantidad);
    Vergara.state.movimientos.push({
      fecha: Date.now(), codigo: producto.codigo, nombre: producto.nombre,
      motivo, cantidad, saldo: producto.stock
    });
  },

  // Registro manual por código de barras: cantidad > 0 entrada, < 0 salida
  registrarMovimiento(texto, cantidad) {
    const p = this.buscar(texto);
    if (!p) return { ok: false, mensaje: "Código o producto no encontrado" };
    if (!Number.isSafeInteger(cantidad) || !cantidad) return { ok: false, mensaje: "Ingrese una cantidad distinta de cero" };
    if (p.stock + cantidad < 0) return { ok: false, mensaje: "La salida supera el stock disponible" };
    this.mover(p, cantidad, cantidad > 0 ? "Entrada manual" : "Salida manual");
    return { ok: true, mensaje: `Movimiento registrado: ${p.nombre} ${cantidad > 0 ? "+" : ""}${cantidad}` };
  },

  productosBajos() {
    return Vergara.state.productos.filter(p => p.stock <= p.reorden);
  },

  // Cantidad Económica de Pedido: raíz( 2 · D · S / H )
  eoq(producto) {
    const c = Vergara.data.config;
    const D = Vergara.prediccion.demanda30Dias(producto) * 12;   // demanda anual estimada
    const H = producto.precio * c.factorMantenimiento;           // costo anual de mantener 1 unidad
    return Math.round(Math.sqrt((2 * D * c.costoPorPedido) / H));
  },

  // Repone con el EOQ cada producto en o bajo su punto de reorden
  reponer() {
    const bajos = this.productosBajos();
    bajos.forEach(p => this.mover(p, this.eoq(p), "Reposición automática (EOQ)"));
    return bajos.length;
  }
};
