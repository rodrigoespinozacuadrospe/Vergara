/* Vista: Distribución (mapa de ruta, GPS simulado y confirmación de entregas) */
Vergara.views.distribucion = function () {
  const ui = Vergara.ui, s = Vergara.state;
  const ruta = Vergara.rutas.calcular();
  const entregados = s.pedidos.filter(o => o.estado === Vergara.ESTADO.ENTREGADO);
  const kmTotal = ruta.reduce((a, o) => a + o.kmTramo, 0);

  const paradas = ruta.map((o, i) => `<div class="fila">
      <div class="col-nombre"><b>${i + 1}. ${Vergara.pedidos.cliente(o).nombre}</b><br>
        <span class="muted">Pedido #${o.id} · tramo ${o.kmTramo.toFixed(1)} km · acumulado ${o.km.toFixed(1)} km</span></div>
      <input id="firma-${o.id}" placeholder="Nombre de quien recibe" size="18">
      <label class="muted"><input type="checkbox" id="foto-${o.id}"> Foto tomada</label>
      <button class="btn" data-action="entregar" data-id="${o.id}">Confirmar entrega</button></div>`).join("")
    || '<p class="muted">No hay pedidos listos. Márquelos como preparados en Almacén.</p>';

  const hechos = entregados.map(o => `<div class="fila"><span>#${o.id} · ${Vergara.pedidos.cliente(o).nombre}</span>
      <span class="ok">Firmó: ${ui.escapar(o.firmadoPor)}</span></div>`).join("") || '<p class="muted">Ninguna aún.</p>';

  return `<section class="card"><h2>Ruta optimizada del día</h2>
      <p class="muted">Vecino más cercano desde el almacén (simula la optimización de rutas con GPS). ${ruta.length ? "Distancia total: <b>" + kmTotal.toFixed(1) + " km</b>." : ""}</p>
      ${mapa(ruta)}</section>
    <section class="card"><h2>Paradas</h2>${paradas}</section>
    <section class="card"><h2>Entregas realizadas</h2>${hechos}</section>`;

  // Dibuja el mapa esquemático con SVG
  function mapa(ruta) {
    const esc = 36, pad = 28, px = x => pad + x * esc, py = y => pad + y * esc;
    const puntos = Vergara.data.clientes.map(c =>
      `<circle cx="${px(c.x)}" cy="${py(c.y)}" r="4" fill="var(--muted)"/>
       <text x="${px(c.x) + 8}" y="${py(c.y) + 4}" font-size="10" fill="var(--muted)">${c.nombre}</text>`).join("");
    const trazo = [Vergara.rutas.ALMACEN, ...ruta.map(o => Vergara.pedidos.cliente(o))].map(c => `${px(c.x)},${py(c.y)}`).join(" ");
    const numeros = ruta.map((o, i) => { const c = Vergara.pedidos.cliente(o);
      return `<circle cx="${px(c.x)}" cy="${py(c.y)}" r="10" fill="var(--accent)"/>
              <text x="${px(c.x)}" y="${py(c.y) + 4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${i + 1}</text>`; }).join("");
    return `<svg class="mapa" viewBox="0 0 380 280" role="img" aria-label="Mapa de la ruta">
      ${ruta.length ? `<polyline points="${trazo}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 4"/>` : ""}
      ${puntos}${numeros}
      <rect x="${px(0) - 9}" y="${py(0) - 9}" width="18" height="18" rx="3" fill="var(--ok)"/>
      <text x="${px(0) + 14}" y="${py(0) + 4}" font-size="10" font-weight="700" fill="var(--ok)">Almacén</text></svg>`;
  }
};
