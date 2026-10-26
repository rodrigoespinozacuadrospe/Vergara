import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { formatMoney } from '../../utils/format';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrders: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onViewOrders
}) => {
  const { orders, clients } = useApp();

  if (!isOpen) return null;

  const lastOrder = orders[orders.length - 1];
  if (!lastOrder) return null;

  const clientName = clients[lastOrder.clienteIdx]?.nombre || 'tu negocio';

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>¡Pedido registrado!</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          <div className="confirmation">
            <div className="confirmation-mark">
              <Icon name="check" />
            </div>
            <h3>Un nuevo impulso para tu negocio.</h3>
            <p>
              Pedido <b>#{lastOrder.id}</b> para {clientName}.<br />
              Total de productos: <b>{formatMoney(lastOrder.total)}</b>.
            </p>
            <p className="demo-checkout-note">
              Pedido de demostración guardado en este navegador. No se ha realizado ningún pago ni se programará un envío real.
            </p>
            <button
              className="button button-primary dialog-button"
              onClick={() => {
                onClose();
                onViewOrders();
              }}
            >
              Ver seguimiento <Icon name="arrow-right" />
            </button>
            <button
              className="hero-secondary"
              style={{ marginTop: '20px', display: 'block', width: '100%', textAlign: 'center' }}
              onClick={onClose}
            >
              Seguir explorando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
