import React from 'react';
import { Icon } from '../../components/Icon';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Entregas y cobertura</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          <p className="dialog-intro">
            Vergara Logística está pensada para acompañar a negocios de Lima, Perú.
          </p>

          <div className="modal-feature">
            <Icon name="pin" />
            <div>
              <b>Coordinamos contigo</b>
              La dirección, cobertura, tarifa y fecha deben confirmarse con el distribuidor antes de una compra real.
            </div>
          </div>

          <div className="modal-feature">
            <Icon name="truck" />
            <div>
              <b>Seguimiento de principio a fin</b>
              En este prototipo puedes probar los estados de preparación y entrega desde el centro de operaciones.
            </div>
          </div>

          <p className="demo-checkout-note">
            Esta web es una demostración. No ofrece servicio de despacho real ni confirma cobertura comercial.
          </p>

          <button className="button button-primary dialog-button" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
