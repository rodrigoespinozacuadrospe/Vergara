/* Persistencia en el navegador: los datos sobreviven al recargar la página. */
Vergara.storage = {
  CLAVE: "vergara-prototipo-mejorado-v1",

  guardar() {
    try {
      const s = Vergara.state;
      localStorage.setItem(this.CLAVE, JSON.stringify({
        productos: s.productos, pedidos: s.pedidos, movimientos: s.movimientos,
        notificaciones: s.notificaciones, siguienteId: s.siguienteId
      }));
    } catch (e) { /* si el navegador bloquea el almacenamiento, la app sigue funcionando */ }
  },

  cargar() {
    try {
      const datos = JSON.parse(localStorage.getItem(this.CLAVE));
      if (datos && datos.productos) Object.assign(Vergara.state, datos);
    } catch (e) { /* datos inválidos: se usan los de fábrica */ }
  },

  reiniciar() {
    try { localStorage.removeItem(this.CLAVE); } catch (e) {}
    Vergara.state.reiniciar();
  }
};
