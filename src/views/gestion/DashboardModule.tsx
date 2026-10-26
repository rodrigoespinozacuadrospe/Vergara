import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/format';

export const DashboardModule: React.FC = () => {
  const {
    products,
    orders,
    demand30Days,
    setActiveModule,
    resetAllData
  } = useApp();

  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const deliveredCount = orders.filter(o => o.estado === 'Entregado').length;
  const pendingPrepCount = orders.filter(o => o.estado === 'Pendiente').length;
  const lowStockProducts = products.filter(p => p.stock <= p.reorden);

  const productDemandData = products.map(p => ({
    product: p,
    demand: demand30Days(p)
  }));

  const maxDemand = Math.max(...productDemandData.map(d => d.demand), 1);

  const productSymbols = ['▥', '◒', '▧', '≋', '▤', '◈', '▦', '◎'];

  return (
    <>
      <div className="welcome-banner">
        <div>
          <span className="live-label">
            <i /> TU OPERACIÓN, CONECTADA
          </span>
          <h2>Más control. Mejores decisiones.</h2>
          <p>Gestiona pedidos, anticipa la demanda y mantén tu negocio en movimiento.</p>
          <button type="button" onClick={() => setActiveModule('laboratorio')}>
            Explorar laboratorio de IA <span>↗</span>
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit" />
          <div className="art-box box-one">▥</div>
          <div className="art-box box-two">V</div>
          <div className="art-chip">✓ Inventario conectado</div>
          <span className="art-spark">✧</span>
        </div>
      </div>

      <div className="kpis dashboard-kpis">
        <div className="card metric">
          <div className="metric-top">
            Ventas registradas
            <span className="metric-icon">↗</span>
          </div>
          <strong>{formatMoney(totalSales)}</strong>
          <small>Total de pedidos del prototipo</small>
        </div>

        <div className="card metric">
          <div className="metric-top">
            Pedidos totales
            <span className="metric-icon">▤</span>
          </div>
          <strong>{orders.length}</strong>
          <small>{pendingPrepCount} pendientes de preparar</small>
        </div>

        <div className="card metric">
          <div className="metric-top">
            Entregas completadas
            <span className="metric-icon">◇</span>
          </div>
          <strong>
            {orders.length ? Math.round((deliveredCount / orders.length) * 100) + '%' : '—'}
          </strong>
          <small>
            {orders.length
              ? `${deliveredCount} de ${orders.length} pedidos`
              : 'Aún no hay pedidos'}
          </small>
        </div>

        <div className="card metric">
          <div className="metric-top">
            Alertas de inventario
            <span className="metric-icon warning">!</span>
          </div>
          <strong>{lowStockProducts.length}</strong>
          <small>Productos que necesitan reposición</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="card demand-card">
          <div className="section-title">
            <div>
              <h2>Demanda proyectada</h2>
              <p className="muted">Próximos 30 días · unidades por producto</p>
            </div>
            <span className="badge purple">Estimación</span>
          </div>
          <div className="legend">
            <i /> Promedio móvil de 6 semanas
          </div>
          <div className="bar-chart">
            <div className="axis">
              <span>{maxDemand}</span>
              <span>{Math.round(maxDemand * 0.75)}</span>
              <span>{Math.round(maxDemand * 0.5)}</span>
              <span>{Math.round(maxDemand * 0.25)}</span>
              <span>0</span>
            </div>
            <div className="chart-columns">
              {productDemandData.map((d, i) => (
                <div className="chart-column" key={d.product.codigo}>
                  <b>{d.demand}</b>
                  <div
                    style={{ height: `${(d.demand / maxDemand) * 160}px` }}
                    className={`chart-bar bar-${i % 4}`}
                    title={`${d.product.nombre}: ${d.demand} unidades`}
                  />
                  <span>{d.product.nombre.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-foot">
            ⓘ Proyección simulada; no es un modelo de aprendizaje automático.
          </div>
        </section>

        <section className="card alerts-card">
          <div className="section-title">
            <h2>Necesita tu atención</h2>
            <span className="count">{lowStockProducts.length}</span>
          </div>
          {lowStockProducts.length ? (
            lowStockProducts.map(p => (
              <div className="alert-item" key={p.codigo}>
                <span className="alert-symbol">!</span>
                <div>
                  <b>{p.nombre}</b>
                  <p>Quedan {p.stock} unidades</p>
                  <small>Punto de reorden: {p.reorden} und.</small>
                </div>
                <span className="badge amber">Stock bajo</span>
              </div>
            ))
          ) : (
            <div className="empty-state">✓ Todos los productos sobre el punto de reorden.</div>
          )}
          <button
            className="btn secundario ancho"
            type="button"
            onClick={() => setActiveModule('almacen')}
          >
            Revisar inventario <span>→</span>
          </button>
          <div className="tip">
            <b>Una operación más inteligente</b>
            <p>Revisa las sugerencias de reposición antes de que tus productos se agoten.</p>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="section-title">
          <div>
            <h2>Estado del inventario</h2>
            <p className="muted">Disponibilidad actual de tus productos</p>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={() => setActiveModule('almacen')}
          >
            Ver inventario completo →
          </button>
        </div>
        <div className="inventory-head">
          <span>PRODUCTO</span>
          <span>COBERTURA PROYECTADA</span>
          <span>STOCK ACTUAL</span>
          <span>ESTADO</span>
        </div>
        {products.map((p, i) => {
          const demand = demand30Days(p);
          const percent = Math.min(100, (p.stock / (demand || 1)) * 100);
          return (
            <div className="product-row" key={p.codigo}>
              <span className={`product-symbol p${i % 5}`}>
                {productSymbols[i % productSymbols.length]}
              </span>
              <div className="product-name">
                <b>{p.nombre}</b>
                <small>{p.codigo}</small>
              </div>
              <div className="stock-track">
                <span
                  style={{ width: `${percent}%` }}
                  className={p.stock < demand ? 'orange' : ''}
                />
              </div>
              <b>
                {p.stock} <small>und.</small>
              </b>
              <span className={`badge ${p.stock <= p.reorden ? 'amber' : 'green'}`}>
                {p.stock <= p.reorden ? 'Stock bajo' : 'Disponible'}
              </span>
            </div>
          );
        })}
      </section>

      <div className="demo-note">
        ⓘ Datos de demostración guardados localmente. La selección de roles no constituye autenticación de seguridad.{' '}
        <button
          className="text-button"
          type="button"
          onClick={() => {
            if (window.confirm('¿Borrar todos los datos y volver al estado inicial?')) {
              resetAllData();
            }
          }}
        >
          Reiniciar datos
        </button>
      </div>
    </>
  );
};
