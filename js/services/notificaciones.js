/* Notificaciones automáticas al cliente (simulan correo / WhatsApp). */
Vergara.notificaciones = {
  agregar(clienteIdx, texto) {
    Vergara.state.notificaciones.push({ clienteIdx, texto, fecha: Date.now() });
  },
  deCliente(clienteIdx, cantidad) {
    return Vergara.state.notificaciones.filter(n => n.clienteIdx === clienteIdx).slice(-cantidad).reverse();
  }
};
