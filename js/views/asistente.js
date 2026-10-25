/* Vista: Asistente virtual estilo WhatsApp */
Vergara.views.asistente = function () {
  const ui = Vergara.ui, s = Vergara.state;
  const mensajes = s.chat.length
    ? s.chat.map(m => `<div class="burbuja ${m.autor}">${ui.escapar(m.texto)}</div>`).join("")
    : '<p class="muted">Escriba una consulta o use los atajos.</p>';
  const atajos = ["¿Hay arroz?", "¿Cuánto cuesta el aceite?", "Estado de mi pedido", "Horario de entrega"]
    .map(t => `<button class="btn secundario pequeno" data-action="chat-rapido" data-texto="${t}">${t}</button>`).join("");

  return `<section class="card">
    <h2>Asistente virtual</h2>
    <p class="muted">Simula el chatbot de WhatsApp: responde disponibilidad, precios y estado del pedido de <b>${Vergara.data.clientes[s.clienteSeleccionado].nombre}</b>.</p>
    <div class="chat" id="chat">${mensajes}</div>
    <div class="fila" style="border:0;padding:0"><input id="chat-input" placeholder="Escriba su consulta..." style="flex:1">
      <button class="btn" data-action="chat-enviar">Enviar</button></div>
    <div class="acciones">${atajos}</div></section>`;
};
