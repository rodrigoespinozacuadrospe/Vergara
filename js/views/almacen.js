/* Vista: Almacén (inventario, EOQ, historial y picking) */
Vergara.views.almacen = function () {
  const s = Vergara.state, ui = Vergara.ui, ESTADO = Vergara.ESTADO;
  const bajos = Vergara.inventario.productosBajos();

  const alerta = bajos.length ? `<div class="alerta">
      <b>⚠ ${bajos.length} producto(s) en o bajo el punto de reorden</b>
      <button class="btn" data-action="reponer">Generar reposición (EOQ)</button></div>` : "";

  const inventario = s.productos.map(p => {
    const e = ui.estadoStock(p);
    return `<div class="fila"><div class="col-nombre"><b>${p.nombre}</b><br><span class="muted">Código ${p.codigo}</span></div>
      <span>Stock <b>${p.stock}</b></span><span>Reorden ${p.reorden}</span>
      <span title="Cantidad Económica de Pedido">EOQ ${Vergara.inventario.eoq(p)}</span>
      <span class="${e.clase}">${e.texto}</span></div>`;
  }).join("");

  const picking = s.pedidos.filter(o => o.estado === ESTADO.PENDIENTE).map(o =>
    `<div class="fila"><div class="col-nombre">#${o.id} · ${Vergara.pedidos.cliente(o).nombre}<br>
      <span class="muted">${o.items.map(i => i.cantidad + "× " + i.nombre).join(", ")}</span></div>
      <button class="btn" data-action="preparar" data-id="${o.id}">Marcar preparado</button></div>`).join("")
    || '<p class="muted">Sin pedidos pendientes.</p>';

  const historial = s.movimientos.slice(-8).reverse().map(m =>
    `<div class="fila"><div class="col-nombre">${m.nombre}<br><span class="muted">${m.motivo} · ${ui.fecha(m.fecha)}</span></div>
      <b class="${m.cantidad > 0 ? "ok" : "bad"}">${m.cantidad > 0 ? "+" : ""}${m.cantidad}</b><span class="muted">saldo ${m.saldo}</span></div>`).join("")
    || '<p class="muted">Aún no hay movimientos.</p>';

  return `${alerta}
    <section class="card">
      <h2>Registro por código de barras</h2>
      <p class="muted">Cantidad positiva = recepción; negativa = salida. Códigos: ${s.productos.map(p => p.codigo).join(", ")}</p>
      <div class="fila">
        <input id="codigo" placeholder="Ej. 7750002" size="14">
        <input id="cantidad" type="number" value="-1" style="width:90px">
        <button class="btn" data-action="registrar">Registrar</button>
      </div>
    </section>
    <section class="card"><h2>Inventario en tiempo real</h2>
      <p class="muted">EOQ = cantidad económica de pedido sugerida según la demanda proyectada.</p>${inventario}
      <div class="acciones"><button class="btn secundario" data-action="exportar-inventario">Exportar inventario (CSV)</button></div></section>
    <section class="card"><h2>Picking de pedidos</h2>${picking}</section>
    <section class="card"><h2>Historial de movimientos</h2>${historial}
      <div class="acciones"><button class="btn secundario" data-action="exportar-movimientos">Exportar historial (CSV)</button></div></section>`;
};
