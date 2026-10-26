import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { formatMoney, formatShortDate } from '../../utils/format';

interface OrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExplore: () => void;
}

export const OrdersDrawer: React.FC<OrdersDrawerProps> = ({ isOpen, onClose, onExplore }) => {
  const { orders, clients, selectedClientIndex } = useApp();

  if (!isOpen) return null;

  const clientName = clients[selectedClientIndex]?.nombre || 'tu negocio';
  const myOrders = orders
    .filter(o => o.clienteIdx === selectedClientIndex)
    .slice()
    .reverse();

  const STEPS = ['Pendiente', 'Listo', 'Entregado'] as const;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container drawer" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Mis pedidos</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar pedidos">
            <Icon name="close" />
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-intro">
            Pedidos de <b>{clientName}</b>. Los estados se actualizan desde el centro de operaciones.
          </p>

          {myOrders.length > 0 ? (
            myOrders.map(o => {
              const currentStepIndex = STEPS.indexOf(o.estado as any);
              return (
                <article className="order-card" key={o.id}>
                  <div className="order-card-top">
                    <h3>Pedido #{o.id}</h3>
                    <span className={`order-status ${o.estado === 'Entregado' ? 'complete' : ''}`}>
                      {o.estado}
                    </span>
                  </div>
                  <p>{formatShortDate(o.creado)}</p>
                  <p>
                    {o.items.map((it, idx) => (
                      <span key={idx} style={{ display: 'block' }}>
                        {it.cantidad} × {it.nombre}
                      </span>
                    ))}
                  </p>
                  <div className="summary-row" style={{ marginTop: '12px', marginBottom: 0 }}>
                    <span>Total de productos</span>
                    <b>{formatMoney(o.total)}</b>
                  </div>
                  <div className="order-steps">
                    {STEPS.map((step, idx) => (
                      <span key={step} className={idx <= currentStepIndex ? 'done' : ''}>
                        <Icon name="check" /> {step}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <Icon name="box" />
              <h3>Todavía no hay pedidos.</h3>
              <p>Cuando confirmes tu primera compra, podrás seguirla desde aquí.</p>
              <button
                className="button button-primary"
                onClick={() => {
                  onClose();
                  onExplore();
                }}
              >
                Preparar mi pedido <Icon name="arrow-right" />
              </button>
            </div>
          )}

          <p className="fine-print">
            Los pedidos se guardan solo en este navegador. La selección de negocio es una simulación, no un inicio de sesión.
          </p>
        </div>
      </div>
    </div>
  );
};
