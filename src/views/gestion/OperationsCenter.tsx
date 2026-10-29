import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ROLES_CONFIG,
  MODULE_TITLES,
  MODULE_DESCRIPTIONS,
  MODULE_ICONS
} from '../../data/initialData';
import { RoleId, ModuleId } from '../../types';
import { DashboardModule } from './DashboardModule';
import { ClienteOrderModule } from './ClienteOrderModule';
import { VentasModule } from './VentasModule';
import { AlmacenModule } from './AlmacenModule';
import { DistribucionModule } from './DistribucionModule';
import { AsistenteModule } from './AsistenteModule';
import { LaboratorioModule } from './LaboratorioModule';

export const OperationsCenter: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    activeModule,
    setActiveModule,
    setActiveView,
    exportOrders,
    currentUser,
    loginWithGoogle,
    logout
  } = useApp();

  // If no role selected, render login view
  if (!currentRole) {
    return (
      <div className="gestion-page" style={{ padding: '40px 20px', minHeight: '100vh', background: 'var(--bg)' }}>
        <section className="card login">
          <div className="login-identity"><span className="brand-icon">V</span><span>VERGARA <small>CENTRO DE OPERACIONES</small></span></div>
          <div className="eyebrow">UN SOLO EQUIPO. TODO CONECTADO.</div>
          <h2>Tu operación empieza aquí</h2>
          <p className="muted">
            Elige tu espacio de trabajo y ten a la mano todo lo que necesitas para avanzar.
          </p>
          {(Object.entries(ROLES_CONFIG) as [RoleId, typeof ROLES_CONFIG[RoleId]][]).map(
            ([roleId, info]) => (
              <button
                key={roleId}
                className="btn secundario ancho"
                style={{ marginBottom: '10px', textAlign: 'left', display: 'block' }}
                onClick={() => {
                  setCurrentRole(roleId);
                  setActiveModule(info.pestanas[0]);
                }}
              >
                <b>{info.titulo}</b>
                <br />
                <span className="muted">{info.descripcion}</span>
              </button>
            )
          )}
          <button
            className="btn secundario ancho"
            style={{ marginTop: '15px' }}
            onClick={() => setActiveView('tienda')}
          >
            ← Volver a la tienda
          </button>
        </section>
      </div>
    );
  }

  const roleInfo = ROLES_CONFIG[currentRole];
  const allowedTabs = roleInfo ? roleInfo.pestanas : [];

  // Make sure active module is allowed for role
  const effectiveModule: ModuleId = allowedTabs.includes(activeModule)
    ? activeModule
    : allowedTabs[0] || 'dashboard';

  return (
    <div className="gestion-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={e => {
            e.preventDefault();
            setActiveView('tienda');
          }}
          aria-label="Volver a la tienda Vergara Logística"
        >
          <span className="brand-icon">V</span>
          <span>
            vergara<small>INTELLIGENT LOGISTICS</small>
          </span>
        </a>

        <div className="workspace-label">ESPACIO DE TRABAJO</div>

        <nav id="menu" className="menu" aria-label="Navegación principal">
          {allowedTabs.map(tabId => {
            const isActive = effectiveModule === tabId;
            return (
              <button
                key={tabId}
                className={isActive ? 'activo' : ''}
                onClick={() => setActiveModule(tabId)}
                aria-current={isActive ? 'page' : undefined}
                type="button"
              >
                <span className="nav-icon">{MODULE_ICONS[tabId]}</span>
                {MODULE_TITLES[tabId]}
                {tabId === 'laboratorio' && <small className="new-tag">NUEVO</small>}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setActiveView('tienda')}
          style={{
            fontSize: '12px',
            margin: '20px 10px 0',
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0
          }}
        >
          ← Volver a la tienda
        </button>

        <div className="sidebar-bottom">
          <span className="online-dot" /> Entorno de demostración
          <p>
            Distribuidora Vergara S.A.C.<br />
            Datos guardados en este navegador
          </p>
        </div>
      </aside>

      {/* Main app shell */}
      <div className="app-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Espacio de trabajo <span>/</span> <b>{MODULE_TITLES[effectiveModule]}</b>
          </div>
          <div className="sesion" id="sesion">
            <span className="avatar">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                currentRole.slice(0, 1).toUpperCase()
              )}
            </span>
            <span>
              <b>{currentUser?.displayName || roleInfo.titulo}</b>
              <small>{currentUser?.email || 'Sesión de demostración'}</small>
            </span>
            {currentUser ? (
              <button
                className="btn secundario pequeno"
                type="button"
                onClick={logout}
              >
                Salir
              </button>
            ) : (
              <button
                className="btn secundario pequeno"
                type="button"
                onClick={loginWithGoogle}
              >
                Google Auth
              </button>
            )}
            <button
              className="btn secundario pequeno"
              type="button"
              onClick={() => setCurrentRole(null)}
            >
              Cambiar rol
            </button>
          </div>
        </header>

        <main className="contenido">
          <div className="page-heading">
            <div>
              <div className="eyebrow">CENTRO DE OPERACIONES</div>
              <h1>{MODULE_TITLES[effectiveModule]}</h1>
              <p className="muted">{MODULE_DESCRIPTIONS[effectiveModule]}</p>
            </div>
            <div className="acciones">
              {effectiveModule === 'dashboard' && (
                <>
                  <button
                    className="btn secundario"
                    type="button"
                    onClick={exportOrders}
                  >
                    ↓ Exportar reporte
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setActiveModule('cliente')}
                  >
                    ＋ Nuevo pedido
                  </button>
                </>
              )}
            </div>
          </div>

          <div id="contenido">
            {effectiveModule === 'dashboard' && <DashboardModule />}
            {effectiveModule === 'cliente' && <ClienteOrderModule />}
            {effectiveModule === 'ventas' && <VentasModule />}
            {effectiveModule === 'almacen' && <AlmacenModule />}
            {effectiveModule === 'distribucion' && <DistribucionModule />}
            {effectiveModule === 'asistente' && <AsistenteModule />}
            {effectiveModule === 'laboratorio' && <LaboratorioModule />}
          </div>

          <footer>
            VERGARA <span>Operaciones más simples. Decisiones mejor informadas.</span>
            <small>Prototipo académico · Sin servicios externos</small>
          </footer>
        </main>
      </div>
    </div>
  );
};
