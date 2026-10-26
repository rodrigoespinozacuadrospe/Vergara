import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { StorefrontView } from './views/storefront/StorefrontView';
import { OperationsCenter } from './views/gestion/OperationsCenter';

export const App: React.FC = () => {
  const { activeView, setActiveView, toastMessage } = useApp();

  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'gestion' || window.location.pathname.includes('gestion')) {
        setActiveView('gestion');
      } else {
        setActiveView('tienda');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveView]);

  return (
    <div className="app-root">
      {activeView === 'tienda' ? <StorefrontView /> : <OperationsCenter />}
      {toastMessage && (
        <div id="toast" className="shop-toast visible" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
