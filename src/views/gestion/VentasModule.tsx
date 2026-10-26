import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/format';

export const VentasModule: React.FC = () => {
  const {
    orders,
    clients,
    statusFilter,
    setStatusFilter,
    exportOrders
  } = useApp();

  const filteredOrders = orders
    .filter(o => statusFilter === 'Todos' || o.estado === statusFilter)
    .slice()
    .reverse();

  const displayedTotal = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="dos-columnas">
      <section className="card">
        <h2>Pedidos</h2>
        <div className="fila">
          <span>Filtrar por estado</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Listo">Listo</option>
            <option value="Entregado">Entregado</option>
          </select>
        </div>

        {filteredOrders.length > 0 ? (
          filteredOrders.map(o => {
            const clientName = clients[o.clienteIdx]?.nombre || `Cliente #${o.clienteIdx}`;
            return (
              <div className="fila" key={o.id}>
                <div className="col-nombre">
                  <b>#{o.id} · {clientName}</b>
                  <br />
                  <span className="muted">
                    {o.items.map(it => `${it.cantidad}× ${it.nombre}`).join(', ')} · {formatDateTime(o.creado)}
                  </span>
                </div>
                <b>{formatMoney(o.total)}</b>
                <span>{o.estado}</span>
              </div>
            );
          })
        ) : (
          <p className="muted">No hay pedidos con ese filtro.</p>
        )}

        <div className="fila">
          <b>Total mostrado</b>
          <b>{formatMoney(displayedTotal)}</b>
        </div>

        <div className="acciones">
          <button
            className="btn secundario"
            type="button"
            onClick={exportOrders}
          >
            Exportar pedidos (CSV)
          </button>
        </div>
      </section>

      <aside className="card">
        <h2>Ventas por cliente</h2>
        {clients.map((c, i) => {
          const clientTotal = orders
            .filter(o => o.clienteIdx === i)
            .reduce((sum, o) => sum + o.total, 0);
          return (
            <div className="fila" key={i}>
              <span>{c.nombre}</span>
              <b>{formatMoney(clientTotal)}</b>
            </div>
          );
        })}
      </aside>
    </div>
  );
};
