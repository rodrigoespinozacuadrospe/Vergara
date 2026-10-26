import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const AsistenteModule: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    clients,
    selectedClientIndex
  } = useApp();

  const [inputText, setInputText] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const clientName = clients[selectedClientIndex]?.nombre || 'Cliente';

  const shortcuts = [
    '¿Hay arroz?',
    '¿Cuánto cuesta el aceite?',
    'Estado de mi pedido',
    'Horario de entrega'
  ];

  return (
    <section className="card">
      <h2>Asistente virtual</h2>
      <p className="muted">
        Simula el chatbot de WhatsApp: responde disponibilidad, precios y estado del pedido de{' '}
        <b>{clientName}</b>.
      </p>

      <div className="chat" id="chat" ref={chatRef}>
        {chatMessages.length > 0 ? (
          chatMessages.map((m, idx) => (
            <div key={idx} className={`burbuja ${m.autor}`}>
              {m.texto}
            </div>
          ))
        ) : (
          <p className="muted">Escriba una consulta o use los atajos.</p>
        )}
      </div>

      <form onSubmit={handleSend} className="fila" style={{ border: 0, padding: 0 }}>
        <input
          id="chat-input"
          placeholder="Escriba su consulta..."
          style={{ flex: 1 }}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button className="btn" type="submit">
          Enviar
        </button>
      </form>

      <div className="acciones" style={{ marginTop: '12px' }}>
        {shortcuts.map(t => (
          <button
            key={t}
            className="btn secundario pequeno"
            type="button"
            onClick={() => sendChatMessage(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </section>
  );
};
