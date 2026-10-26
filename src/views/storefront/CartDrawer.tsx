import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { formatMoney } from '../../utils/format';
import { PRODUCT_META } from '../../data/initialData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderConfirmed: () => void;
  onExplore: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderConfirmed,
  onExplore
}) => {
  const {
    cart,
    products,
    clients,
    selectedClientIndex,
    setSelectedClientIndex,
    addToCart,
    removeFromCart,
    cartTotalQuantity,
    cartTotalPrice,
    confirmOrder
  } = useApp();

  if (!isOpen) return null;

  const cartLines = products.filter(p => (cart[p.codigo] || 0) > 0);

  const handleCheckout = () => {
    const res = confirmOrder();
    if (res.ok) {
      onOrderConfirmed();
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container drawer" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Mi carrito ({cartTotalQuantity})</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar carrito">
            <Icon name="close" />
          </button>
        </div>

        <div className="dialog-body">
          {cartLines.length > 0 ? (
            <>
              <p className="dialog-intro">
                Lo que tu negocio necesita, listo para tu próximo pedido.
              </p>
              <div className="cart-list">
                {cartLines.map(p => {
                  const meta = PRODUCT_META[p.codigo];
                  const qty = cart[p.codigo] || 0;
                  return (
                    <div className="cart-row" key={p.codigo}>
                      <img
                        src={`/assets/${meta?.image || 'arroz'}.svg`}
                        alt={meta?.label || p.nombre}
                      />
                      <div className="cart-item-info">
                        <h3>{meta?.label || p.nombre}</h3>
                        <p>{formatMoney(p.precio)} por unidad</p>
                        <div className="quantity-controls">
                          <button
                            onClick={() => addToCart(p.codigo, -1)}
                            aria-label={`Quitar una unidad de ${p.nombre}`}
                          >
                            −
                          </button>
                          <span>{qty}</span>
                          <button
                            onClick={() => addToCart(p.codigo, 1)}
                            aria-label={`Agregar una unidad de ${p.nombre}`}
                          >
                            +
                          </button>
                          <button
                            className="remove-item"
                            onClick={() => removeFromCart(p.codigo)}
                            aria-label={`Eliminar ${p.nombre} del carrito`}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <span className="cart-line-total">{formatMoney(p.precio * qty)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Entrega</span>
                  <span>Por coordinar</span>
                </div>
                <div className="summary-row summary-total">
                  <span>Total de productos</span>
                  <span>{formatMoney(cartTotalPrice)}</span>
                </div>

                <label className="form-label" htmlFor="checkout-client">
                  Pedido para
                </label>
                <select
                  id="checkout-client"
                  className="form-select"
                  value={selectedClientIndex}
                  onChange={e => setSelectedClientIndex(Number(e.target.value))}
                >
                  {clients.map((c, i) => (
                    <option key={i} value={i}>
                      {c.nombre}
                    </option>
                  ))}
                </select>

                <p className="demo-checkout-note">
                  Este es un pedido de demostración. No se realizará ningún cobro ni envío real.
                </p>

                <button
                  className="button button-primary dialog-button"
                  onClick={handleCheckout}
                >
                  Confirmar pedido de demostración <Icon name="arrow-right" />
                </button>
                <p className="fine-print">
                  El total incluye solo productos. La disponibilidad se vuelve a validar al confirmar.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Icon name="cart" />
              <h3>Tu próximo pedido empieza aquí.</h3>
              <p>Explora el catálogo y agrega tus productos al carrito.</p>
              <button
                className="button button-primary"
                onClick={() => {
                  onClose();
                  onExplore();
                }}
              >
                Explorar productos <Icon name="arrow-right" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
