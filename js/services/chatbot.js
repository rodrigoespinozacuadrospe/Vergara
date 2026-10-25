/* Asistente virtual (simula el chatbot de WhatsApp con reconocimiento simple de palabras clave). */
Vergara.chatbot = {
  responder(texto) {
    const t = Vergara.ui.normalizar(texto);
    const s = Vergara.state;
    const producto = s.productos.find(p => t.includes(Vergara.ui.normalizar(p.nombre.split(" ")[0])));

    if (/hola|buenas|buenos/.test(t)) return "¡Hola! Soy el asistente de Vergara. Puedo informarle sobre disponibilidad, precios, el estado de su pedido y los horarios de entrega.";

    if (/precio|cuesta|cuanto/.test(t) && producto)
      return `${producto.nombre} cuesta ${Vergara.ui.moneda(producto.precio)} por unidad.`;

    if (producto) {
      const e = Vergara.ui.estadoStock(producto);
      return e.texto === "Agotado" ? `Por ahora ${producto.nombre} está agotado.`
        : `${producto.nombre}: ${e.texto.toLowerCase()} (${producto.stock} unidades). Precio ${Vergara.ui.moneda(producto.precio)}.`;
    }

    if (/pedido|estado|seguimiento|mi orden/.test(t)) {
      const propios = s.pedidos.filter(p => p.clienteIdx === s.clienteSeleccionado);
      if (!propios.length) return "Aún no tiene pedidos registrados. Puede crear uno en el Portal de Clientes.";
      const u = propios[propios.length - 1];
      return `Su último pedido es el #${u.id} por ${Vergara.ui.moneda(u.total)}. Estado: ${u.estado}.`;
    }

    if (/horario|entrega|envio|cuando|demora/.test(t))
      return "Entregamos al día siguiente de confirmado el pedido, de lunes a sábado. Recibirá avisos del avance de su entrega.";

    return "No entendí su consulta. Puede preguntarme, por ejemplo: \"¿Hay arroz?\", \"Estado de mi pedido\" u \"Horario de entrega\".";
  }
};
