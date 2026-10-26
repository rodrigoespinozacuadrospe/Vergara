import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const DistribucionModule: React.FC = () => {
  const {
    calculateRoutes,
    orders,
    clients,
    confirmDelivery
  } = useApp();

  const [signatures, setSignatures] = useState<Record<number, string>>({});
  const [photos, setPhotos] = useState<Record<number, boolean>>({});

  const route = calculateRoutes();
  const deliveredOrders = orders.filter(o => o.estado === 'Entregado');
  const totalKm = route.reduce((acc, o) => acc + (o.kmTramo || 0), 0);

  const handleDeliver = (orderId: number) => {
    const sig = signatures[orderId] || '';
    const photo = photos[orderId] || false;
    confirmDelivery(orderId, sig, photo);
  };

  // SVG coordinates setup
  const esc = 36;
  const pad = 28;
  const px = (x: number) => pad + x * esc;
  const py = (y: number) => pad + y * esc;

  const warehousePos = { x: 0, y: 0 };
  const routePoints = [warehousePos, ...route.map(o => clients[o.clienteIdx])];
  const polylinePoints = routePoints.map(pt => `${px(pt.x)},${py(pt.y)}`).join(' ');

  return (
    <>
      <section className="card">
        <h2>Ruta optimizada del día</h2>
        <p className="muted">
          Vecino más cercano desde el almacén (simula la optimización de rutas con GPS).{' '}
          {route.length > 0 && (
            <>
              Distancia total: <b>{totalKm.toFixed(1)} km</b>.
            </>
          )}
        </p>

        <svg
          className="mapa"
          viewBox="0 0 380 280"
          role="img"
          aria-label="Mapa de la ruta"
        >
          {route.length > 0 && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}

          {/* Client location dots */}
          {clients.map((c, i) => (
            <g key={i}>
              <circle cx={px(c.x)} cy={py(c.y)} r="4" fill="var(--muted)" />
              <text x={px(c.x) + 8} y={py(c.y) + 4} fontSize="10" fill="var(--muted)">
                {c.nombre}
              </text>
            </g>
          ))}

          {/* Stop numbers on route */}
          {route.map((o, i) => {
            const c = clients[o.clienteIdx];
            return (
              <g key={o.id}>
                <circle cx={px(c.x)} cy={py(c.y)} r="10" fill="var(--accent)" />
                <text
                  x={px(c.x)}
                  y={py(c.y) + 4}
                  fontSize="11"
                  fontWeight="700"
                  fill="#fff"
                  textAnchor="middle"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Warehouse */}
          <rect
            x={px(0) - 9}
            y={py(0) - 9}
            width="18"
            height="18"
            rx="3"
            fill="var(--ok)"
          />
          <text
            x={px(0) + 14}
            y={py(0) + 4}
            fontSize="10"
            fontWeight="700"
            fill="var(--ok)"
          >
            Almacén
          </text>
        </svg>
      </section>

      <section className="card">
        <h2>Paradas</h2>
        {route.length > 0 ? (
          route.map((o, i) => {
            const client = clients[o.clienteIdx];
            return (
              <div className="fila" key={o.id}>
                <div className="col-nombre">
                  <b>
                    {i + 1}. {client.nombre}
                  </b>
                  <br />
                  <span className="muted">
                    Pedido #{o.id} · tramo {(o.kmTramo || 0).toFixed(1)} km · acumulado{' '}
                    {(o.km || 0).toFixed(1)} km
                  </span>
                </div>
                <input
                  id={`firma-${o.id}`}
                  placeholder="Nombre de quien recibe"
                  size={18}
                  value={signatures[o.id] || ''}
                  onChange={e =>
                    setSignatures(prev => ({ ...prev, [o.id]: e.target.value }))
                  }
                />
                <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="checkbox"
                    id={`foto-${o.id}`}
                    checked={photos[o.id] || false}
                    onChange={e =>
                      setPhotos(prev => ({ ...prev, [o.id]: e.target.checked }))
                    }
                  />{' '}
                  Foto tomada
                </label>
                <button
                  className="btn"
                  type="button"
                  onClick={() => handleDeliver(o.id)}
                >
                  Confirmar entrega
                </button>
              </div>
            );
          })
        ) : (
          <p className="muted">
            No hay pedidos listos. Márquelos como preparados en Almacén.
          </p>
        )}
      </section>

      <section className="card">
        <h2>Entregas realizadas</h2>
        {deliveredOrders.length > 0 ? (
          deliveredOrders.map(o => {
            const client = clients[o.clienteIdx];
            return (
              <div className="fila" key={o.id}>
                <span>
                  #{o.id} · {client.nombre}
                </span>
                <span className="ok">Firmó: {o.firmadoPor}</span>
              </div>
            );
          })
        ) : (
          <p className="muted">Ninguna aún.</p>
        )}
      </section>
    </>
  );
};
