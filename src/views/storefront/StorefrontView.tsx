import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PRODUCT_META } from '../../data/initialData';
import { normalizeText } from '../../utils/format';
import { CartDrawer } from './CartDrawer';
import { OrdersDrawer } from './OrdersDrawer';
import { AccountModal } from './AccountModal';
import { LocationModal } from './LocationModal';
import { HelpModal } from './HelpModal';
import { ConfirmationModal } from './ConfirmationModal';

export const StorefrontView: React.FC = () => {
  const {
    products,
    favorites,
    toggleFavorite,
    addToCart,
    cartTotalQuantity,
    setActiveView,
    setActiveModule,
    clients,
    selectedClientIndex,
    currentUser
  } = useApp();

  // Search & Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchCategory, setSearchCategory] = useState<string>('Todos');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('recommended');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const clientName = clients[selectedClientIndex]?.nombre || 'Lima, Perú';

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHow = () => {
    const el = document.getElementById('como-funciona');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
    setSelectedCategory(searchCategory);
    setOnlyFavorites(false);
    scrollToCatalog();
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setSearchCategory(cat);
    setOnlyFavorites(false);
    setActiveQuery('');
    setSearchInput('');
    scrollToCatalog();
  };

  const handleFavoritesClick = () => {
    setSelectedCategory('Todos');
    setOnlyFavorites(true);
    setActiveQuery('');
    setSearchInput('');
    scrollToCatalog();
  };

  const handleClearFilters = () => {
    setSelectedCategory('Todos');
    setSearchCategory('Todos');
    setOnlyFavorites(false);
    setActiveQuery('');
    setSearchInput('');
  };

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    const queryNorm = normalizeText(activeQuery);

    let list = products.filter(p => {
      const meta = PRODUCT_META[p.codigo];
      if (!meta) return false;

      // Category filter
      if (selectedCategory !== 'Todos' && meta.category !== selectedCategory) {
        return false;
      }

      // Favorites filter
      if (onlyFavorites && !favorites.has(p.codigo)) {
        return false;
      }

      // Text search
      if (queryNorm) {
        const fullString = `${p.nombre} ${meta.label} ${meta.category} ${p.codigo}`;
        if (!normalizeText(fullString).includes(queryNorm)) {
          return false;
        }
      }

      return true;
    });

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.precio - b.precio);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.precio - a.precio);
    } else if (sortBy === 'name') {
      list.sort((a, b) => {
        const nameA = PRODUCT_META[a.codigo]?.label || a.nombre;
        const nameB = PRODUCT_META[b.codigo]?.label || b.nombre;
        return nameA.localeCompare(nameB, 'es');
      });
    }

    return list;
  }, [products, selectedCategory, onlyFavorites, activeQuery, sortBy, favorites]);

  return (
    <div className="storefront-page">
      <a href="#catalogo" className="skip-link">
        Ir al catálogo
      </a>

      {/* Utility Bar */}
      <div className="utility-bar">
        <div className="container">
          <span>Tu negocio crece. Nosotros lo movemos.</span>
          <span>
            Compra fácil · Precios en soles{' '}
            <span className="utility-divider">|</span>{' '}
            <button
              onClick={() => setActiveView('gestion')}
              className="text-link-button"
              style={{ background: 'none', border: 'none', color: '#3f5d50', cursor: 'pointer', padding: 0 }}
            >
              Centro de operaciones <Icon name="external" />
            </button>
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="shop-header">
        <div className="container header-main">
          <a
            className="shop-brand"
            href="#"
            onClick={e => {
              e.preventDefault();
              handleClearFilters();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="Vergara Logística, inicio"
          >
            <img src="/assets/logo-light.svg" width="190" height="54" alt="Vergara Logística" />
          </a>

          <button
            className="delivery-button"
            onClick={() => setIsLocationOpen(true)}
            type="button"
          >
            <Icon name="pin" />
            <span>
              <small>Estamos cerca de ti</small>
              <b>
                Lima, Perú <span className="tiny-chevron">⌄</span>
              </b>
            </span>
          </button>

          <form className="search-form" role="search" onSubmit={handleSearchSubmit}>
            <label className="sr-only" htmlFor="search-category">
              Categoría de búsqueda
            </label>
            <select
              id="search-category"
              value={searchCategory}
              onChange={e => setSearchCategory(e.target.value)}
            >
              <option value="Todos">Todo</option>
              <option value="Abarrotes">Abarrotes</option>
              <option value="Desayunos">Desayunos</option>
              <option value="Limpieza">Limpieza</option>
            </select>
            <label className="sr-only" htmlFor="search-input">
              Buscar productos
            </label>
            <input
              id="search-input"
              type="search"
              placeholder="¿Qué necesita tu negocio hoy?"
              autoComplete="off"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" aria-label="Buscar productos">
              <Icon name="search" />
            </button>
          </form>

          <button
            className="header-button account-button"
            onClick={() => setIsAccountOpen(true)}
            type="button"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt=""
                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <Icon name="user" />
            )}
            <span>
              <small>{currentUser ? 'Cuenta conectada' : 'Hola, bienvenido'}</small>
              <b>
                {currentUser?.displayName
                  ? currentUser.displayName.split(' ')[0]
                  : clients[selectedClientIndex]?.nombre.split(' ')[0] || 'Mi negocio'}
              </b>
            </span>
          </button>

          <button
            className="header-button orders-button"
            onClick={() => setIsOrdersOpen(true)}
            type="button"
          >
            <Icon name="box" />
            <span>
              <small>Consulta tus</small>
              <b>Pedidos</b>
            </span>
          </button>

          <button
            className="header-cart"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Abrir carrito: ${cartTotalQuantity} unidades`}
            type="button"
          >
            <span className="cart-icon">
              <Icon name="cart" />
              <b id="cart-count">{cartTotalQuantity}</b>
            </span>
            <span>Mi carrito</span>
          </button>
        </div>
      </header>

      {/* Category Navigation */}
      <div className="category-nav">
        <nav className="container" aria-label="Categorías">
          <button
            className={`all-categories ${selectedCategory === 'Todos' && !onlyFavorites ? 'is-active' : ''}`}
            onClick={() => handleCategoryClick('Todos')}
          >
            <Icon name="menu" /> Todas las categorías
          </button>
          <span className="nav-separator" />
          <button
            className={selectedCategory === 'Abarrotes' && !onlyFavorites ? 'is-active' : ''}
            onClick={() => handleCategoryClick('Abarrotes')}
          >
            Abarrotes
          </button>
          <button
            className={selectedCategory === 'Desayunos' && !onlyFavorites ? 'is-active' : ''}
            onClick={() => handleCategoryClick('Desayunos')}
          >
            Desayunos
          </button>
          <button
            className={selectedCategory === 'Limpieza' && !onlyFavorites ? 'is-active' : ''}
            onClick={() => handleCategoryClick('Limpieza')}
          >
            Limpieza y hogar
          </button>
          <button
            className={onlyFavorites ? 'is-active' : ''}
            onClick={handleFavoritesClick}
          >
            <Icon name="heart" /> Mi lista
          </button>
          <button onClick={() => setIsOrdersOpen(true)}>
            Sigue tu pedido
          </button>
          <span className="nav-message">
            <span className="status-dot" /> Tu aliado mayorista
          </span>
        </nav>
      </div>

      <main>
        {/* Hero Section */}
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> DE NUESTRO ALMACÉN A TU NEGOCIO
            </span>
            <h1 id="hero-title">
              Todo lo que necesitas.<br />
              <em>Mucho más cerca.</em>
            </h1>
            <p>
              Abastece tu negocio con tus productos de siempre.<br />
              Elige, agrega y deja la logística en nuestras manos.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#catalogo" onClick={scrollToCatalog}>
                Explorar productos <Icon name="arrow-right" />
              </a>
              <button className="hero-secondary" onClick={scrollToHow}>
                Así de fácil funciona <Icon name="external" />
              </button>
            </div>
            <div className="hero-note">
              <Icon name="shield" /> Precios claros. Stock a la vista. Pedidos sin complicaciones.
            </div>
          </div>
          <div
            className="hero-scene"
            aria-label="Selección de productos Vergara: arroz, aceite, café y leche"
            role="img"
          >
            <div className="scene-circle" />
            <div className="scene-orbit" />
            <div className="scene-plinth back-plinth" />
            <div className="scene-plinth front-plinth" />
            <img className="hero-pack hero-rice" src="/assets/arroz.svg" alt="" />
            <img className="hero-pack hero-oil" src="/assets/aceite.svg" alt="" />
            <img className="hero-pack hero-coffee" src="/assets/cafe.svg" alt="" />
            <img className="hero-pack hero-milk" src="/assets/leche.svg" alt="" />
            <div className="hero-sticker">
              <Icon name="box" />
              <span>
                Tu próximo pedido.<b>Un nuevo impulso.</b>
              </span>
            </div>
            <div className="scene-spark spark-one">
              <Icon name="spark" />
            </div>
            <div className="scene-spark spark-two">
              <Icon name="spark" />
            </div>
            <span className="scene-caption">SELECCIÓN VERGARA · CALIDAD PARA TU DÍA A DÍA</span>
          </div>
        </section>

        {/* Benefits */}
        <section className="benefits container" aria-label="Ventajas de comprar en Vergara">
          <div>
            <Icon name="truck" className="benefit-icon" />
            <span>
              <b>Logística que te acompaña</b>
              <small>Coordina la entrega de tu pedido</small>
            </span>
          </div>
          <div>
            <Icon name="box" className="benefit-icon" />
            <span>
              <b>Compra a tu medida</b>
              <small>Por unidad o para todo tu negocio</small>
            </span>
          </div>
          <div>
            <Icon name="shield" className="benefit-icon" />
            <span>
              <b>Todo bajo control</b>
              <small>Disponibilidad antes de comprar</small>
            </span>
          </div>
          <div>
            <Icon name="chat" className="benefit-icon" />
            <span>
              <b>Estamos para ayudarte</b>
              <small>Consulta productos y pedidos</small>
            </span>
          </div>
        </section>

        {/* Categories Tiles */}
        <section className="category-section container" aria-labelledby="category-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ENCUENTRA LO QUE BUSCAS</span>
              <h2 id="category-title">Cada negocio, una necesidad.</h2>
            </div>
            <a href="#catalogo" className="text-link" onClick={scrollToCatalog}>
              Ver todo el catálogo <Icon name="arrow-right" />
            </a>
          </div>
          <div className="category-tiles">
            <button
              onClick={() => handleCategoryClick('Abarrotes')}
              className="category-tile tile-grocery"
            >
              <div>
                <small>LO QUE NUNCA DEBE FALTAR</small>
                <h3>Abarrotes</h3>
                <span>
                  Para llenar tus estantes <Icon name="arrow-right" />
                </span>
              </div>
              <img src="/assets/arroz.svg" alt="" loading="lazy" />
              <img src="/assets/fideos.svg" alt="" loading="lazy" />
            </button>
            <button
              onClick={() => handleCategoryClick('Desayunos')}
              className="category-tile tile-breakfast"
            >
              <div>
                <small>UN BUEN COMIENZO</small>
                <h3>Desayunos</h3>
                <span>
                  Esenciales de cada mañana <Icon name="arrow-right" />
                </span>
              </div>
              <img src="/assets/cafe.svg" alt="" loading="lazy" />
              <img src="/assets/leche.svg" alt="" loading="lazy" />
            </button>
            <button
              onClick={() => handleCategoryClick('Limpieza')}
              className="category-tile tile-cleaning"
            >
              <div>
                <small>TODO EN SU LUGAR</small>
                <h3>Limpieza y hogar</h3>
                <span>
                  Cuida cada espacio <Icon name="arrow-right" />
                </span>
              </div>
              <img src="/assets/detergente.svg" alt="" loading="lazy" />
            </button>
          </div>
        </section>

        {/* Catalog Section */}
        <section id="catalogo" className="catalog-section container" aria-labelledby="catalog-title">
          <div className="section-heading catalog-heading">
            <div>
              <span className="eyebrow">BIEN ELEGIDO. BIEN ABASTECIDO.</span>
              <h2 id="catalog-title">
                {onlyFavorites
                  ? 'Tu lista, a tu gusto.'
                  : activeQuery
                  ? 'Encontramos esto para ti.'
                  : selectedCategory === 'Todos'
                  ? 'Lo esencial para tu negocio.'
                  : selectedCategory === 'Limpieza'
                  ? 'Limpieza para cada espacio.'
                  : `${selectedCategory}, bien seleccionado.`}
              </h2>
              <p id="catalog-description">
                Una selección práctica, con precios que puedes ver desde el primer momento.
              </p>
            </div>
            <label className="sort-label" htmlFor="sort-products">
              Ordenar por{' '}
              <select
                id="sort-products"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="recommended">Recomendados</option>
                <option value="price-low">Menor precio</option>
                <option value="price-high">Mayor precio</option>
                <option value="name">Nombre: A–Z</option>
              </select>
            </label>
          </div>

          <div className="catalog-toolbar">
            <div className="filter-tabs" role="group" aria-label="Filtrar productos">
              <button
                className={selectedCategory === 'Todos' && !onlyFavorites ? 'selected' : ''}
                onClick={() => handleCategoryClick('Todos')}
                aria-pressed={selectedCategory === 'Todos' && !onlyFavorites}
              >
                Todos los productos
              </button>
              <button
                className={selectedCategory === 'Abarrotes' && !onlyFavorites ? 'selected' : ''}
                onClick={() => handleCategoryClick('Abarrotes')}
                aria-pressed={selectedCategory === 'Abarrotes'}
              >
                Abarrotes
              </button>
              <button
                className={selectedCategory === 'Desayunos' && !onlyFavorites ? 'selected' : ''}
                onClick={() => handleCategoryClick('Desayunos')}
                aria-pressed={selectedCategory === 'Desayunos'}
              >
                Desayunos
              </button>
              <button
                className={selectedCategory === 'Limpieza' && !onlyFavorites ? 'selected' : ''}
                onClick={() => handleCategoryClick('Limpieza')}
                aria-pressed={selectedCategory === 'Limpieza'}
              >
                Limpieza
              </button>
            </div>
            <span id="results-count" aria-live="polite">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {(activeQuery || onlyFavorites) && (
            <div className="active-query">
              <span>
                {activeQuery ? `Búsqueda: «${activeQuery}»` : ''}
                {onlyFavorites ? ' · Solo favoritos' : ''}
              </span>
              <button onClick={handleClearFilters}>Limpiar filtros ×</button>
            </div>
          )}

          <div className="product-grid" id="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => {
                const meta = PRODUCT_META[p.codigo];
                if (!meta) return null;
                const isFav = favorites.has(p.codigo);
                const priceParts = p.precio.toFixed(2).split('.');

                return (
                  <article className="product-card" key={p.codigo} data-product={p.codigo}>
                    <div className="product-visual">
                      {meta.tag && <span className="product-tag">{meta.tag}</span>}
                      <img
                        src={`/assets/${meta.image}.svg`}
                        alt={`${meta.label}, ${meta.format}`}
                        loading="lazy"
                        width="400"
                        height="400"
                      />
                      <button
                        className="favorite-button"
                        onClick={() => toggleFavorite(p.codigo)}
                        aria-label={`${isFav ? 'Quitar' : 'Guardar'} ${meta.label} ${isFav ? 'de' : 'en'} mi lista`}
                        aria-pressed={isFav}
                      >
                        <Icon name="heart" />
                      </button>
                    </div>
                    <div className="product-info">
                      <span className="product-brand">VERGARA · SELECCIÓN MAYORISTA</span>
                      <h3>{meta.label}</h3>
                      <span className="product-format">{meta.format}</span>
                      <span className={`product-stock ${p.stock <= 0 ? 'out' : p.stock <= p.reorden ? 'low' : ''}`}>
                        {p.stock > 0 ? `${p.stock} unidades disponibles` : 'Agotado por el momento'}
                      </span>
                      <div className="product-bottom">
                        <span className="product-price" aria-label={`${p.precio.toFixed(2)} soles`}>
                          <small>S/</small>
                          {priceParts[0]}
                          <sup>{priceParts[1]}</sup>
                        </span>
                        <button
                          className="add-button"
                          onClick={() => addToCart(p.codigo, 1)}
                          disabled={p.stock <= 0}
                          aria-label={`Agregar ${meta.label} al carrito`}
                        >
                          <Icon name="plus" /> Agregar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">
                <Icon name={onlyFavorites ? 'heart' : 'search'} />
                <h3>
                  {onlyFavorites
                    ? 'Tu lista está esperando tus favoritos'
                    : 'No encontramos esos productos'}
                </h3>
                <p>
                  {onlyFavorites
                    ? 'Toca el corazón de un producto para guardarlo aquí.'
                    : 'Prueba con otro nombre o explora todas las categorías.'}
                </p>
                <button className="button button-primary" onClick={handleClearFilters}>
                  Ver todos los productos <Icon name="arrow-right" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Business Banner */}
        <section className="business-banner container">
          <div className="banner-monogram" aria-hidden="true">
            V
            <span>
              <Icon name="arrow-right" />
            </span>
          </div>
          <div>
            <span className="eyebrow">TÚ PONES LAS GANAS. NOSOTROS, EL ABASTECIMIENTO.</span>
            <h2>Un gran aliado para tu pequeño gran negocio.</h2>
            <p>Desde tu primera compra hasta tu próximo gran pedido. Hagámoslo juntos.</p>
          </div>
          <button
            className="button button-light"
            onClick={() => setIsAccountOpen(true)}
          >
            Mi negocio en Vergara <Icon name="arrow-right" />
          </button>
        </section>

        {/* How it works */}
        <section className="how-section container" id="como-funciona">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MENOS VUELTAS. MÁS NEGOCIO.</span>
              <h2>Tu pedido, en tres pasos.</h2>
            </div>
            <span className="how-caption">Así de simple, así de Vergara.</span>
          </div>
          <div className="how-grid">
            <article>
              <span className="step-number">01</span>
              <div>
                <h3>Encuentra tus productos</h3>
                <p>Explora el catálogo o busca lo que necesitas para reponer tus estantes.</p>
              </div>
            </article>
            <article>
              <span className="step-number">02</span>
              <div>
                <h3>Arma tu pedido</h3>
                <p>Agrega las cantidades y revisa tu total antes de confirmar.</p>
              </div>
            </article>
            <article>
              <span className="step-number">03</span>
              <div>
                <h3>Sigue cada paso</h3>
                <p>Consulta la preparación y entrega desde la sección de pedidos.</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="shop-footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <img src="/assets/logo-light.svg" width="190" height="54" alt="Vergara Logística" />
            <p>
              Movemos productos.<br />
              Impulsamos negocios.
            </p>
            <span>Lima, Perú</span>
          </div>
          <div>
            <h3>Tu compra</h3>
            <a href="#catalogo" onClick={scrollToCatalog}>
              Explorar catálogo
            </a>
            <button onClick={() => setIsCartOpen(true)}>Mi carrito</button>
            <button onClick={() => setIsOrdersOpen(true)}>Seguimiento de pedidos</button>
          </div>
          <div>
            <h3>Estamos contigo</h3>
            <button onClick={scrollToHow}>Cómo comprar</button>
            <button onClick={() => setIsHelpOpen(true)}>Centro de ayuda</button>
            <button onClick={() => setIsLocationOpen(true)}>Entregas y cobertura</button>
          </div>
          <div>
            <h3>Vergara por dentro</h3>
            <button
              onClick={() => {
                setActiveView('gestion');
                setActiveModule('dashboard');
              }}
            >
              Centro de operaciones <Icon name="external" />
            </button>
            <button
              onClick={() => {
                setActiveView('gestion');
                setActiveModule('laboratorio');
              }}
            >
              Laboratorio de IA y NumPy <Icon name="external" />
            </button>
            <a href="/assets/logo.svg" download="vergara-logistica-logo.svg">
              Descargar nuestro logo <Icon name="arrow-right" className="download-arrow" />
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Vergara Logística · Distribuidora Vergara S.A.C.</span>
          <span>Prototipo académico · Precios y productos de demostración · Sin cobros ni envíos reales</span>
        </div>
      </footer>

      {/* Floating help button */}
      <button
        className="help-float"
        onClick={() => setIsHelpOpen(true)}
        aria-label="Abrir asistente de ayuda"
      >
        <Icon name="chat" />
      </button>

      {/* Dialogs and Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderConfirmed={() => {
          setIsCartOpen(false);
          setIsConfirmationOpen(true);
        }}
        onExplore={scrollToCatalog}
      />

      <OrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        onExplore={scrollToCatalog}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onViewOrders={() => setIsOrdersOpen(true)}
      />
    </div>
  );
};
