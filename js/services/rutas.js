/* Optimización de rutas (simulada con el algoritmo del vecino más cercano). */
Vergara.rutas = {
  ALMACEN: { x: 0, y: 0 },

  calcular() {
    const pendientes = Vergara.state.pedidos.filter(p => p.estado === Vergara.ESTADO.LISTO);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const ruta = [];
    let actual = this.ALMACEN;
    let acumulado = 0;

    while (pendientes.length) {
      pendientes.sort((a, b) => dist(Vergara.pedidos.cliente(a), actual) - dist(Vergara.pedidos.cliente(b), actual));
      const sig = pendientes.shift();
      const destino = Vergara.pedidos.cliente(sig);
      sig.kmTramo = dist(destino, actual);
      acumulado += sig.kmTramo;
      sig.km = acumulado;
      ruta.push(sig);
      actual = destino;
    }
    return ruta;
  }
};
