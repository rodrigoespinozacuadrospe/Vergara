/* Vista: Portal de Clientes (nuevo pedido, seguimiento y notificaciones) */
Vergara.views.cliente = function () {
  const s = Vergara.state, ui = Vergara.ui, ped = Vergara.pedidos;
  const opciones = Vergara.data.clientes
    .map((c, i) => `<option value="${i}" ${i === s.clienteSeleccionado ? "selected" : ""}>${c.nombre}</option>`).join("");

  const filas = s.productos.map(p => {
    const e = ui.estadoStock(p);
    return `<div class="fila">
      <div class="col-nombre"><b>${p.nombre}</b><br><span class="muted">${ui.moneda(p.precio)} · ${p.stock} und</span></div>
      <span class="${e.clase}">${e.texto}</span>
      <div class="cantidad">
        <button data-action="cantidad" data-codigo="${p.codigo}" data-delta="-1">−</button>
        <span>${s.carrito[p.codigo] || 0}</span>
        <button data-action="cantidad" data-codigo="${p.codigo}" data-delta="1">+</button>
        <button data-action="cantidad" data-codigo="${p.codigo}" data-delta="10">+10</button>
      </div></div>`;
  }).join("");

  const misPedidos = s.pedidos.filter(o => o.clienteIdx === s.clienteSeleccionado).slice().reverse().map(o =>
    `<div class="fila"><div class="col-nombre">#${o.id} · ${ui.moneda(o.total)}${ui.pasosPedido(o.estado)}</div></div>`).join("")
    || '<p class="muted">Aún no hay pedidos.</p>';

  const notifs = Vergara.notificaciones.deCliente(s.clienteSeleccionado, 5).map(n =>
    `<div class="notif">${ui.escapar(n.texto)}<br><span class="muted">${ui.fecha(n.fecha)}</span></div>`).join("")
    || '<p class="muted">Sin notificaciones.</p>';

  return `<div class="dos-columnas">
    <section class="card">
      <h2>Nuevo pedido</h2>
      <p class="muted">Elija el cliente y agregue productos. La disponibilidad se valida automáticamente.</p>
      <div class="fila"><span>Cliente</span><select data-change="cliente">${opciones}</select></div>
      ${filas}
    </section>
    <aside>
      <div class="card">
        <h2>Resumen</h2>
        <div class="fila"><span>Ítems</span><b>${ped.cantidadCarrito()}</b></div>
        <div class="fila"><span>Total</span><b>${ui.moneda(ped.totalCarrito())}</b></div>
        <div class="fila"><span>Entrega estimada</span><span>Por coordinar</span></div>
        <button class="btn ancho" data-action="confirmar-pedido">Confirmar pedido</button>
      </div>
      <div class="card"><h2>Mis pedidos</h2>${misPedidos}</div>
      <div class="card"><h2>Notificaciones</h2>${notifs}</div>
    </aside></div>`;
};
