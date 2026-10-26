import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/Icon';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const {
    clients,
    selectedClientIndex,
    setSelectedClientIndex,
    showToast,
    currentUser,
    loginWithGoogle,
    logout
  } = useApp();
  const [tempIndex, setTempIndex] = useState(selectedClientIndex);

  if (!isOpen) return null;

  const handleSave = () => {
    setSelectedClientIndex(tempIndex);
    showToast(`Listo. Estás comprando para ${clients[tempIndex].nombre}.`);
    onClose();
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Tu negocio en Vergara</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          {/* Firebase Authentication Section */}
          <div
            style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0'
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '1px',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              AUTENTICACIÓN GOOGLE &amp; FIREBASE
            </span>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Usuario'}
                      style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#385e50',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <b style={{ fontSize: '13px', display: 'block', color: 'var(--teal)' }}>
                      {currentUser.displayName || 'Usuario autenticado'}
                    </b>
                    <small style={{ color: '#64748b', fontSize: '11px' }}>{currentUser.email}</small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="btn secundario pequeno"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', lineHeight: 1.5 }}>
                  Inicia sesión con tu cuenta de Google para vincular tus pedidos a Firestore.
                </p>
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="button button-primary"
                  style={{ width: '100%', gap: '10px', fontSize: '12px', minHeight: '38px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Iniciar sesión con Google
                </button>
              </div>
            )}
          </div>

          <p className="dialog-intro">
            Elige uno de nuestros negocios de demostración para preparar pedidos y consultar su seguimiento.
          </p>

          <label className="form-label" htmlFor="account-client-select">
            Selecciona tu negocio
          </label>
          <select
            id="account-client-select"
            className="form-select"
            value={tempIndex}
            onChange={e => setTempIndex(Number(e.target.value))}
          >
            {clients.map((c, i) => (
              <option key={i} value={i}>
                {c.nombre}
              </option>
            ))}
          </select>

          <button className="button button-primary dialog-button" onClick={handleSave}>
            Usar este negocio <Icon name="arrow-right" />
          </button>

          <p className="fine-print">
            Esta selección te permite asignar pedidos a puntos de venta en Lima con persistencia sincronizada.
          </p>
        </div>
      </div>
    </div>
  );
};
