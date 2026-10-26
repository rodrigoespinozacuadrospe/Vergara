import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, getStockStatus } from '../../utils/format';

export const AlmacenModule: React.FC = () => {
  const {
    products,
    orders,
    movements,
    clients,
    replenishEOQ,
    calculateEOQ,
    registerMovement,
    markPrepared,
    exportInventory,
    exportMovements
  } = useApp();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState<number>(-1);

  const lowStock = products.filter(p => p.stock <= p.reorden);
  const pendingOrders = orders.filter(o => o.estado === 'Pendiente');
  const recentMovements = movements.slice(-8).reverse();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const res = registerMovement(barcodeInput, quantityInput);
    if (res.ok) {
      setBarcodeInput('');
      setQuantityInput(-1);
    }
  };

  return (
    <>
      {lowStock.length > 0 && (
        <div className="alerta">
          <b>⚠ {lowStock.length} producto(s) en o bajo el punto de reorden</b>
          <button className="btn" type="button" onClick={() => replenishEOQ()}>
            Generar reposición (EOQ)
          </button>
        </div>
      )}

      <section className="card">
        <h2>Registro por código de barras</h2>
        <p className="muted">
          Cantidad positiva = recepción; negativa = salida. Códigos:{' '}
          {products.map(p => p.codigo).join(', ')}
        </p>
        <form onSubmit={handleRegister} className="fila" style={{ border: 0, padding: 0 }}>
          <input
            id="codigo"
            placeholder="Ej. 7750002"
            size={14}
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
          />
          <input
            id="cantidad"
            type="number"
            value={quantityInput}
            onChange={e => setQuantityInput(Number(e.target.value))}
            style={{ width: '90px' }}
          />
          <button className="btn" type="submit">
            Registrar
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Inventario en tiempo real</h2>
        <p className="muted">
          EOQ = cantidad económica de pedido sugerida según la demanda proyectada.
        </p>
        {products.map(p => {
          const status = getStockStatus(p.stock, p.reorden);
          return (
            <div className="fila" key={p.codigo}>
              <div className="col-nombre">
                <b>{p.nombre}</b>
                <br />
                <span className="muted">Código {p.codigo}</span>
              </div>
              <span>
                Stock <b>{p.stock}</b>
              </span>
              <span>Reorden {p.reorden}</span>
              <span title="Cantidad Económica de Pedido">EOQ {calculateEOQ(p)}</span>
              <span className={status.clase}>{status.texto}</span>
            </div>
          );
        })}
        <div className="acciones">
          <button
            className="btn secundario"
            type="button"
            onClick={exportInventory}
          >
            Exportar inventario (CSV)
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Picking de pedidos</h2>
        {pendingOrders.length > 0 ? (
          pendingOrders.map(o => {
            const clientName = clients[o.clienteIdx]?.nombre || `Cliente #${o.clienteIdx}`;
            return (
              <div className="fila" key={o.id}>
                <div className="col-nombre">
                  #{o.id} · {clientName}
                  <br />
                  <span className="muted">
                    {o.items.map(it => `${it.cantidad}× ${it.nombre}`).join(', ')}
                  </span>
                </div>
                <button
                  className="btn"
                  type="button"
                  onClick={() => markPrepared(o.id)}
                >
                  Marcar preparado
                </button>
              </div>
            );
          })
        ) : (
          <p className="muted">Sin pedidos pendientes.</p>
        )}
      </section>

      <section className="card">
        <h2>Historial de movimientos</h2>
        {recentMovements.length > 0 ? (
          recentMovements.map((m, idx) => (
            <div className="fila" key={idx}>
              <div className="col-nombre">
                {m.nombre}
                <br />
                <span className="muted">
                  {m.motivo} · {formatDateTime(m.fecha)}
                </span>
              </div>
              <b className={m.cantidad > 0 ? 'ok' : 'bad'}>
                {m.cantidad > 0 ? '+' : ''}
                {m.cantidad}
              </b>
              <span className="muted">saldo {m.saldo}</span>
            </div>
          ))
        ) : (
          <p className="muted">Aún no hay movimientos.</p>
        )}
        <div className="acciones">
          <button
            className="btn secundario"
            type="button"
            onClick={exportMovements}
          >
            Exportar historial (CSV)
          </button>
        </div>
      </section>
    </>
  );
};
