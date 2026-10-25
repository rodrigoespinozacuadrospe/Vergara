/* Punto de entrada: sesión por rol, menú, render y manejo de eventos (delegación). */
(function () {
  const s = Vergara.state, ui = Vergara.ui, D = Vergara.data;
  const $ = id => document.getElementById(id);

  function render() {
    // Cabecera y menú según el rol
    const titles = {dashboard:"Resumen general", cliente:"Nuevo pedido", ventas:"Pedidos y ventas", almacen:"Control de inventario", distribucion:"Distribución", asistente:"Asistente virtual", laboratorio:"Laboratorio de IA y NumPy"};
    const descriptions = {dashboard:"Todo lo que necesitas saber de tu operación, en un solo lugar.", cliente:"Conecta a tus clientes con los productos que necesitan.", ventas:"Consulta tus pedidos y acompaña cada etapa de la venta.", almacen:"Stock disponible, reposición y preparación de pedidos.", distribucion:"Organiza las entregas desde el almacén hasta tu cliente.", asistente:"Respuestas rápidas sobre tus productos y pedidos. Simulación por palabras clave.", laboratorio:"Del dato a la decisión: análisis del caso de streaming con NumPy."};
    const icons = {dashboard:"▦",cliente:"＋",ventas:"▤",almacen:"▣",distribucion:"◇",asistente:"◌",laboratorio:"⌁"};
    $("sesion").innerHTML = s.rol ? `<span class="avatar">${s.rol.slice(0,1).toUpperCase()}</span><span><b>${D.roles[s.rol].titulo}</b><small>Sesión de demostración</small></span><button class="btn secundario pequeno" data-action="salir">Cambiar rol</button>` : "";
    $("menu").innerHTML = s.rol ? D.roles[s.rol].pestanas.map(id => `<button class="${s.pestana === id ? "activo" : ""}" data-action="pestana" data-id="${id}" ${s.pestana===id?'aria-current="page"':''}><span class="nav-icon">${icons[id]}</span>${D.pestanas[id]}${id==='laboratorio'?'<small class="new-tag">NUEVO</small>':''}</button>`).join("") : "";
    $("page-label").textContent = s.rol ? titles[s.pestana] : "Seleccionar rol";
    $("page-heading").innerHTML = s.rol ? `<div class="page-heading"><div><div class="eyebrow">CENTRO DE OPERACIONES</div><h1>${titles[s.pestana]}</h1><p class="muted">${descriptions[s.pestana]}</p></div><div class="acciones">${s.pestana==='dashboard'?'<button class="btn secundario" data-action="exportar-pedidos">↓ Exportar reporte</button><button class="btn" data-action="pestana" data-id="cliente">＋ Nuevo pedido</button>':''}</div></div>` : "";
    $("contenido").innerHTML = Vergara.views[s.rol ? s.pestana : "login"]();
    const chat = $("chat"); if (chat) chat.scrollTop = chat.scrollHeight;
  }

  // Ejecuta una acción de servicio, muestra el mensaje, guarda y vuelve a dibujar
  function ejecutar(resultado) {
    if (resultado && resultado.mensaje) ui.toast(resultado.mensaje);
    Vergara.storage.guardar();
    render();
  }

  function enviarChat(texto) {
    texto = texto.trim();
    if (!texto) return;
    s.chat.push({ autor: "yo", texto }, { autor: "bot", texto: Vergara.chatbot.responder(texto) });
    render();
  }

  // Cada data-action del HTML corresponde a una función de este mapa
  const acciones = {
    "entrar":     d => { s.rol = d.rol; s.pestana = D.roles[d.rol].pestanas[0]; render(); },
    "salir":      () => { s.rol = null; render(); },
    "reiniciar":  () => { if (confirm("¿Borrar todos los datos y volver al estado inicial?")) { Vergara.storage.reiniciar(); ejecutar({ mensaje: "Datos reiniciados" }); } },
    "pestana":    d => { if (D.roles[s.rol]?.pestanas.includes(d.id)) { s.pestana = d.id; render(); } },
    "cantidad":   d => { Vergara.pedidos.cambiarCantidad(d.codigo, Number(d.delta)); render(); },
    "confirmar-pedido": () => ejecutar(Vergara.pedidos.confirmar()),
    "registrar":  () => ejecutar(Vergara.inventario.registrarMovimiento($("codigo").value, Number($("cantidad").value))),
    "reponer":    () => ejecutar({ mensaje: Vergara.inventario.reponer() + " productos repuestos (EOQ)" }),
    "preparar":   d => ejecutar(Vergara.pedidos.marcarPreparado(Number(d.id))),
    "entregar":   d => ejecutar(Vergara.pedidos.confirmarEntrega(Number(d.id), $("firma-" + d.id).value, $("foto-" + d.id).checked)),
    "chat-enviar": () => enviarChat($("chat-input").value),
    "chat-rapido": d => enviarChat(d.texto),
    "exportar-pedidos":     () => Vergara.exportar.pedidos(),
    "exportar-inventario":  () => Vergara.exportar.inventario(),
    "exportar-movimientos": () => Vergara.exportar.movimientos()
  };

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-action]");
    if (el && acciones[el.dataset.action]) acciones[el.dataset.action](el.dataset);
  });

  document.addEventListener("change", e => {
    const tipo = e.target.dataset.change;
    if (tipo === "cliente") { s.clienteSeleccionado = Number(e.target.value); render(); }
    if (tipo === "filtro")  { s.filtroEstado = e.target.value; render(); }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.id === "chat-input") enviarChat(e.target.value);
  });

  Vergara.storage.cargar();
  s.rol = "gerencia"; s.pestana = new URLSearchParams(location.search).get("modulo") === "laboratorio" ? "laboratorio" : "dashboard";
  render();
})();
