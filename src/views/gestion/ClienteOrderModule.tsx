import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime, getStockStatus } from '../../utils/format';

export const ClienteOrderModule: React.FC = () => {
  const {
    products,
    clients,
    selectedClientIndex,
    setSelectedClientIndex,
    cart,
    addToCart,
    cartTotalQuantity,
    cartTotalPrice,
    confirmOrder,
    orders,
    notifications
  } = useApp();

  const clientOrders = orders
    .filter(o => o.clienteIdx === selectedClientIndex)
    .slice()
    .reverse();

  const clientNotifications = notifications
    .filter(n => n.clienteIdx === selectedClientIndex)
    .slice(0, 5);

  const steps = ['Pendiente', 'Listo', 'Entregado'] as const;

  return (
    <div className="dos-columnas">
      <section className="card">
        <h2>Nuevo pedido</h2>
        <p className="muted">
          Elija el cliente y agregue productos. La disponibilidad se valida automáticamente.
        </p>

        <div className="fila">
          <span>Cliente</span>
          <select
            value={selectedClientIndex}
            onChange={e => setSelectedClientIndex(Number(e.target.value))}
          >
            {clients.map((c, i) => (
              <option key={i} value={i}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {products.map(p => {
          const status = getStockStatus(p.stock, p.reorden);
          const inCart = cart[p.codigo] || 0;
          return (
            <div className="fila" key={p.codigo}>
              <div className="col-nombre">
                <b>{p.nombre}</b>
                <br />
                <span className="muted">
                  {formatMoney(p.precio)} · {p.stock} und
                </span>
              </div>
              <span className={status.clase}>{status.texto}</span>
              <div className="cantidad">
                <button
                  type="button"
                  onClick={() => addToCart(p.codigo, -1)}
                  aria-label="Restar 1"
                >
                  −
                </button>
                <span>{inCart}</span>
                <button
                  type="button"
                  onClick={() => addToCart(p.codigo, 1)}
                  aria-label="Sumar 1"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(p.codigo, 10)}
                  aria-label="Sumar 10"
                >
                  +10
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <aside>
        <div className="card">
          <h2>Resumen</h2>
          <div className="fila">
            <span>Ítems</span>
            <b>{cartTotalQuantity}</b>
          </div>
          <div className="fila">
            <span>Total</span>
            <b>{formatMoney(cartTotalPrice)}</b>
          </div>
          <div className="fila">
            <span>Entrega estimada</span>
            <span>Por coordinar</span>
          </div>
          <button
            className="btn ancho"
            type="button"
            onClick={() => confirmOrder()}
          >
            Confirmar pedido
          </button>
        </div>

        <div className="card">
          <h2>Mis pedidos</h2>
          {clientOrders.length > 0 ? (
            clientOrders.map(o => {
              const currentStepIdx = steps.indexOf(o.estado as any);
              return (
                <div className="fila" key={o.id}>
                  <div className="col-nombre">
                    #{o.id} · {formatMoney(o.total)}
                    <div className="pasos" style={{ marginTop: '5px' }}>
                      {steps.map((st, i) => (
                        <span key={st} className={i <= currentStepIdx ? 'hecho' : ''}>
                          {i <= currentStepIdx ? '●' : '○'} {st}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="muted">Aún no hay pedidos.</p>
          )}
        </div>

        <div className="card">
          <h2>Notificaciones</h2>
          {clientNotifications.length > 0 ? (
            clientNotifications.map((n, idx) => (
              <div className="notif" key={idx}>
                {n.texto}
                <br />
                <span className="muted">{formatDateTime(n.fecha)}</span>
              </div>
            ))
          ) : (
            <p className="muted">Sin notificaciones.</p>
          )}
        </div>
      </aside>
    </div>
  );
};
