/* Vista: Panel de Ventas (todos los pedidos, filtros y reporte) */
Vergara.views.ventas = function () {
  const s = Vergara.state, ui = Vergara.ui, ESTADO = Vergara.ESTADO;
  const lista = s.pedidos.filter(o => s.filtroEstado === "Todos" || o.estado === s.filtroEstado).slice().reverse();
  const total = lista.reduce((a, o) => a + o.total, 0);

  const filtro = ["Todos", ESTADO.PENDIENTE, ESTADO.LISTO, ESTADO.ENTREGADO]
    .map(e => `<option ${e === s.filtroEstado ? "selected" : ""}>${e}</option>`).join("");

  const filas = lista.map(o => `<div class="fila">
      <div class="col-nombre"><b>#${o.id} · ${Vergara.pedidos.cliente(o).nombre}</b><br>
        <span class="muted">${o.items.map(i => i.cantidad + "× " + i.nombre).join(", ")} · ${ui.fecha(o.creado)}</span></div>
      <b>${ui.moneda(o.total)}</b><span>${o.estado}</span></div>`).join("")
    || '<p class="muted">No hay pedidos con ese filtro.</p>';

  const porCliente = Vergara.data.clientes.map((c, i) => {
    const suma = s.pedidos.filter(o => o.clienteIdx === i).reduce((a, o) => a + o.total, 0);
    return `<div class="fila"><span>${c.nombre}</span><b>${ui.moneda(suma)}</b></div>`;
  }).join("");

  return `<div class="dos-columnas">
    <section class="card">
      <h2>Pedidos</h2>
      <div class="fila"><span>Filtrar por estado</span><select data-change="filtro">${filtro}</select></div>
      ${filas}
      <div class="fila"><b>Total mostrado</b><b>${ui.moneda(total)}</b></div>
      <div class="acciones"><button class="btn secundario" data-action="exportar-pedidos">Exportar pedidos (CSV)</button></div>
    </section>
    <aside class="card"><h2>Ventas por cliente</h2>${porCliente}</aside></div>`;
};
