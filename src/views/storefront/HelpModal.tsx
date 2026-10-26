import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/Icon';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { shopChatMessages, sendShopChatMessage } = useApp();
  const [inputValue, setInputValue] = useState('');
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [shopChatMessages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendShopChatMessage(inputValue);
    setInputValue('');
  };

  const handleShortcut = (text: string) => {
    sendShopChatMessage(text);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>¿En qué te ayudamos?</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          <p className="dialog-intro">
            Pregunta por disponibilidad, precios, horarios o el estado de tus pedidos.
          </p>

          <div className="chat-log" ref={chatLogRef}>
            {shopChatMessages.length > 0 ? (
              shopChatMessages.map((m, idx) => (
                <div key={idx} className={`chat-bubble ${m.autor === 'yo' ? 'me' : ''}`}>
                  {m.texto}
                </div>
              ))
            ) : (
              <div className="chat-bubble">
                ¡Hola! Soy el asistente de Vergara. ¿Qué necesita tu negocio hoy?
              </div>
            )}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              placeholder="Ej. ¿Hay arroz?"
              maxLength={500}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              autoFocus
            />
            <button type="submit" aria-label="Enviar consulta">
              <Icon name="arrow-right" />
            </button>
          </form>

          <div className="chat-shortcuts">
            <button type="button" onClick={() => handleShortcut('¿Hay arroz?')}>
              ¿Hay arroz?
            </button>
            <button type="button" onClick={() => handleShortcut('Estado de mi pedido')}>
              Mi pedido
            </button>
            <button type="button" onClick={() => handleShortcut('Horario de entrega')}>
              Entregas
            </button>
          </div>

          <p className="fine-print">
            Asistente de demostración por palabras clave. No está conectado con WhatsApp ni con un agente humano.
          </p>
        </div>
      </div>
    </div>
  );
};
