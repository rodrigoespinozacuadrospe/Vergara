import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Order,
  InventoryMovement,
  NotificationItem,
  ChatMessage,
  RoleId,
  ModuleId
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CLIENTS,
  APP_CONFIG
} from '../data/initialData';
import { getChatbotResponse } from '../services/chatbot';
import { exportOrdersCSV, exportInventoryCSV, exportMovementsCSV } from '../services/exportar';
import {
  auth,
  db,
  signInWithGoogle,
  logOut,
  handleFirestoreError,
  OperationType
} from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';

interface AppContextType {
  currentUser: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  products: Product[];
  orders: Order[];
  movements: InventoryMovement[];
  notifications: NotificationItem[];
  clients: typeof INITIAL_CLIENTS;
  selectedClientIndex: number;
  setSelectedClientIndex: (index: number) => void;
  cart: Record<string, number>;
  favorites: Set<string>;
  toggleFavorite: (codigo: string) => void;
  addToCart: (codigo: string, delta: number) => { ok: boolean; message?: string };
  removeFromCart: (codigo: string) => void;
  clearCart: () => void;
  cartTotalQuantity: number;
  cartTotalPrice: number;
  confirmOrder: (clientIndexOverride?: number) => { ok: boolean; mensaje: string; order?: Order };
  markPrepared: (orderId: number) => { ok: boolean; mensaje: string };
  confirmDelivery: (orderId: number, firma: string, foto: boolean) => { ok: boolean; mensaje: string };
  registerMovement: (codigoOrName: string, cantidad: number) => { ok: boolean; mensaje: string };
  calculateEOQ: (product: Product) => number;
  demand30Days: (product: Product) => number;
  replenishEOQ: () => number;
  calculateRoutes: () => Order[];
  activeView: 'tienda' | 'gestion';
  setActiveView: (view: 'tienda' | 'gestion') => void;
  currentRole: RoleId | null;
  setCurrentRole: (role: RoleId | null) => void;
  activeModule: ModuleId;
  setActiveModule: (mod: ModuleId) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  shopChatMessages: ChatMessage[];
  sendShopChatMessage: (text: string) => void;
  excludeOutlier: boolean;
  setExcludeOutlier: (exclude: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  resetAllData: () => void;
  exportOrders: () => void;
  exportInventory: () => void;
  exportMovements: () => void;
}

const STORAGE_KEY = 'vergara-prototipo-mejorado-v1';
const CART_KEY = 'vergara-tienda-carrito-v1';
const FAVORITES_KEY = 'vergara-tienda-favoritos-v1';
const CLIENT_KEY = 'vergara-tienda-cliente-v1';

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      showToast(`Sesión iniciada como ${user.displayName || user.email}`);
      // Also store user profile in firestore if authenticated
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn('Could not sync user profile to firestore', err);
        }
      }
    } catch (e) {
      console.error('Google Sign-in failed', e);
      showToast('Error al iniciar sesión con Google.');
    }
  };

  const logout = async () => {
    try {
      await logOut();
      showToast('Sesión cerrada');
    } catch (e) {
      console.error('Log out failed', e);
    }
  };

  // Load persistent data
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.productos)) {
          const merged = [...parsed.productos];
          INITIAL_PRODUCTS.forEach(p => {
            if (!merged.some(m => m.codigo === p.codigo)) {
              merged.push({ ...p });
            }
          });
          return merged;
        }
      }
    } catch (e) {
      console.warn('Failed to load products from localStorage', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.pedidos)) return parsed.pedidos;
      }
    } catch {}
    return [];
  });

  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.movimientos)) return parsed.movimientos;
      }
    } catch {}
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.notificaciones)) return parsed.notificaciones;
      }
    } catch {}
    return [];
  });

  const [nextId, setNextId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Number.isInteger(parsed.siguienteId)) return parsed.siguienteId;
      }
    } catch {}
    return 1;
  });

  // Client selection
  const [selectedClientIndex, setSelectedClientIndexState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CLIENT_KEY);
      const val = Number(saved);
      if (Number.isInteger(val) && val >= 0 && val < INITIAL_CLIENTS.length) {
        return val;
      }
    } catch {}
    return 0;
  });

  const setSelectedClientIndex = (idx: number) => {
    setSelectedClientIndexState(idx);
    try {
      localStorage.setItem(CLIENT_KEY, JSON.stringify(idx));
    } catch {}
  };

  // Cart state
  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          const validated: Record<string, number> = {};
          products.forEach(p => {
            const count = parsed[p.codigo];
            if (Number.isSafeInteger(count) && count > 0) {
              validated[p.codigo] = Math.min(count, p.stock);
            }
          });
          return validated;
        }
      }
    } catch {}
    return {};
  });

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set<string>();
  });

  // Navigation & session state
  const [activeView, setActiveViewState] = useState<'tienda' | 'gestion'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.pathname.includes('gestion') || urlParams.has('gestion') || urlParams.has('modulo')) {
      return 'gestion';
    }
    return 'tienda';
  });

  const [activeModule, setActiveModule] = useState<ModuleId>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('modulo') === 'laboratorio') return 'laboratorio';
    return 'dashboard';
  });

  const [currentRole, setCurrentRole] = useState<RoleId | null>('gerencia');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Chatbot conversation states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [shopChatMessages, setShopChatMessages] = useState<ChatMessage[]>([]);

  // Lab view outlier exclusion
  const [excludeOutlier, setExcludeOutlier] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  // Sync active view with browser URL history
  const setActiveView = (view: 'tienda' | 'gestion') => {
    setActiveViewState(view);
    const url = new URL(window.location.href);
    if (view === 'gestion') {
      url.searchParams.set('view', 'gestion');
    } else {
      url.searchParams.delete('view');
      url.searchParams.delete('modulo');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Persist storage whenever primary state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          productos: products,
          pedidos: orders,
          movimientos: movements,
          notificaciones: notifications,
          siguienteId: nextId
        })
      );
    } catch (e) {
      console.warn('Storage quota exceeded or disabled', e);
    }
  }, [products, orders, movements, notifications, nextId]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Persist favorites
  const toggleFavorite = (codigo: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(codigo)) {
        next.delete(codigo);
      } else {
        next.add(codigo);
      }
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Cart operations
  const addToCart = (codigo: string, delta: number): { ok: boolean; message?: string } => {
    const product = products.find(p => p.codigo === codigo);
    if (!product) return { ok: false, message: 'Producto no encontrado' };

    const currentQty = cart[codigo] || 0;
    const newQty = Math.max(0, Math.min(product.stock, currentQty + delta));

    if (delta > 0 && currentQty === newQty) {
      const msg = `Solo hay ${product.stock} unidades disponibles de ${product.nombre}.`;
      showToast(msg);
      return { ok: false, message: msg };
    }

    setCart(prev => {
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[codigo];
      } else {
        updated[codigo] = newQty;
      }
      return updated;
    });

    if (delta > 0) {
      showToast(`${product.nombre} agregado al carrito.`);
    }
    return { ok: true };
  };

  const removeFromCart = (codigo: string) => {
    setCart(prev => {
      const updated = { ...prev };
      delete updated[codigo];
      return updated;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const cartTotalQuantity = Object.values(cart).reduce((a, b) => a + b, 0);

  const cartTotalPrice = products.reduce((acc, p) => acc + (cart[p.codigo] || 0) * p.precio, 0);

  // Demand projection in 30 days (moving average)
  const demand30Days = (product: Product): number => {
    const last3 = product.historial.slice(-3);
    const soldInSession = orders.reduce((acc, order) => {
      const found = order.items.find(i => i.codigo === product.codigo);
      return acc + (found ? found.cantidad : 0);
    }, 0);

    const samples = last3.length + (soldInSession ? 1 : 0);
    const sum = last3.reduce((a, b) => a + b, 0) + soldInSession;
    const average = sum / samples;
    return Math.round(average * 4.3);
  };

  // Economic Order Quantity (EOQ): sqrt(2 * D * S / H)
  const calculateEOQ = (product: Product): number => {
    const annualDemand = demand30Days(product) * 12;
    const holdingCost = product.precio * APP_CONFIG.factorMantenimiento;
    if (holdingCost <= 0) return 50;
    return Math.round(Math.sqrt((2 * annualDemand * APP_CONFIG.costoPorPedido) / holdingCost));
  };

  // Reorder all low-stock products
  const replenishEOQ = (): number => {
    const lowStockProducts = products.filter(p => p.stock <= p.reorden);
    if (!lowStockProducts.length) return 0;

    const newMovements: InventoryMovement[] = [];
    const now = Date.now();

    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.stock <= p.reorden) {
          const eoqQty = calculateEOQ(p);
          const newStock = p.stock + eoqQty;
          const movementObj: InventoryMovement = {
            fecha: now,
            codigo: p.codigo,
            nombre: p.nombre,
            motivo: 'Reposición automática (EOQ)',
            cantidad: eoqQty,
            saldo: newStock
          };
          newMovements.push(movementObj);
          // Sync movement to firestore
          setDoc(doc(db, 'movements', `${p.codigo}_${now}`), movementObj).catch(err => {
            console.warn('Could not sync movement to Firestore', err);
          });
          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    setMovements(prev => [...prev, ...newMovements]);
    showToast(`${lowStockProducts.length} productos repuestos (EOQ)`);
    return lowStockProducts.length;
  };

  // Confirm order
  const confirmOrder = (clientIndexOverride?: number) => {
    const clientIdx = clientIndexOverride !== undefined ? clientIndexOverride : selectedClientIndex;
    const itemsToOrder = products.filter(p => (cart[p.codigo] || 0) > 0);

    if (!itemsToOrder.length) {
      const msg = 'Agregue productos al pedido';
      showToast(msg);
      return { ok: false, mensaje: msg };
    }

    const outOfStock = itemsToOrder.find(p => (cart[p.codigo] || 0) > p.stock);
    if (outOfStock) {
      const msg = `Sin stock suficiente: ${outOfStock.nombre}`;
      showToast(msg);
      return { ok: false, mensaje: msg };
    }

    const currentOrderId = nextId;
    const now = Date.now();
    const orderItems = itemsToOrder.map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      cantidad: cart[p.codigo],
      precio: p.precio
    }));

    const total = itemsToOrder.reduce((acc, p) => acc + cart[p.codigo] * p.precio, 0);

    const newOrder: Order = {
      id: currentOrderId,
      clienteIdx: clientIdx,
      items: orderItems,
      total,
      estado: 'Pendiente',
      creado: now
    };

    const newMovements: InventoryMovement[] = [];
    setProducts(prev =>
      prev.map(p => {
        const orderedQty = cart[p.codigo];
        if (orderedQty && orderedQty > 0) {
          const newStock = Math.max(0, p.stock - orderedQty);
          newMovements.push({
            fecha: now,
            codigo: p.codigo,
            nombre: p.nombre,
            motivo: `Venta pedido #${currentOrderId}`,
            cantidad: -orderedQty,
            saldo: newStock
          });
          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    setMovements(prev => [...prev, ...newMovements]);
    setOrders(prev => [...prev, newOrder]);
    setNextId(prev => prev + 1);
    setCart({});

    // Write to Firestore
    setDoc(doc(db, 'orders', String(currentOrderId)), {
      ...newOrder,
      userId: currentUser?.uid || null,
      userEmail: currentUser?.email || null
    }).catch(err => {
      console.warn('Could not sync order to Firestore', err);
    });

    const clientName = INITIAL_CLIENTS[clientIdx]?.nombre || 'Cliente';
    const notifText = `Pedido #${currentOrderId} confirmado (S/ ${total.toFixed(2)}). Entrega: por coordinar (demostración).`;
    setNotifications(prev => [{ clienteIdx: clientIdx, texto: notifText, fecha: now }, ...prev]);

    const successMsg = `Pedido #${currentOrderId} confirmado para ${clientName}. Stock actualizado.`;
    showToast(successMsg);
    return { ok: true, mensaje: successMsg, order: newOrder };
  };

  const markPrepared = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.estado !== 'Pendiente') {
      const msg = 'El pedido no está pendiente';
      showToast(msg);
      return { ok: false, mensaje: msg };
    }

    const now = Date.now();
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, estado: 'Listo', preparado: now } : o))
    );

    // Sync to Firestore
    setDoc(doc(db, 'orders', String(orderId)), { estado: 'Listo', preparado: now }, { merge: true }).catch(err => {
      console.warn('Could not sync order to Firestore', err);
    });

    const notifText = `Pedido #${orderId} preparado. Saldrá en la próxima ruta de reparto.`;
    setNotifications(prev => [{ clienteIdx: order.clienteIdx, texto: notifText, fecha: now }, ...prev]);

    const msg = `Pedido #${orderId} listo para despacho`;
    showToast(msg);
    return { ok: true, mensaje: msg };
  };

  const confirmDelivery = (orderId: number, firma: string, foto: boolean) => {
    if (!firma.trim()) {
      const msg = 'Ingrese el nombre de quien recibe (firma digital)';
      showToast(msg);
      return { ok: false, mensaje: msg };
    }
    if (!foto) {
      const msg = 'Marque que se tomó la foto de entrega';
      showToast(msg);
      return { ok: false, mensaje: msg };
    }

    const order = orders.find(o => o.id === orderId);
    if (!order || order.estado !== 'Listo') {
      const msg = 'El pedido debe estar preparado';
      showToast(msg);
      return { ok: false, mensaje: msg };
    }

    const now = Date.now();
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              estado: 'Entregado',
              firmadoPor: firma.trim(),
              entregado: now
            }
          : o
      )
    );

    // Sync to Firestore
    setDoc(doc(db, 'orders', String(orderId)), {
      estado: 'Entregado',
      firmadoPor: firma.trim(),
      entregado: now
    }, { merge: true }).catch(err => {
      console.warn('Could not sync order to Firestore', err);
    });

    const notifText = `Pedido #${orderId} entregado. Recibió: ${firma.trim()}.`;
    setNotifications(prev => [{ clienteIdx: order.clienteIdx, texto: notifText, fecha: now }, ...prev]);

    const msg = `Entrega #${orderId} confirmada`;
    showToast(msg);
    return { ok: true, mensaje: msg };
  };

  const registerMovement = (codigoOrName: string, cantidad: number) => {
    const clean = codigoOrName.trim().toLowerCase();
    const product = products.find(
      p => p.codigo === clean || p.nombre.toLowerCase().includes(clean)
    );

    if (!product) {
      const msg = 'Código o producto no encontrado';
      showToast(msg);
      return { ok: false, mensaje: msg };
    }

    if (!Number.isSafeInteger(cantidad) || cantidad === 0) {
      const msg = 'Ingrese una cantidad distinta de cero';
      showToast(msg);
      return { ok: false, mensaje: msg };
    }

    if (product.stock + cantidad < 0) {
      const msg = 'La salida supera el stock disponible';
      showToast(msg);
      return { ok: false, mensaje: msg };
    }

    const now = Date.now();
    const newStock = product.stock + cantidad;

    setProducts(prev =>
      prev.map(p => (p.codigo === product.codigo ? { ...p, stock: newStock } : p))
    );

    const movementObj: InventoryMovement = {
      fecha: now,
      codigo: product.codigo,
      nombre: product.nombre,
      motivo: cantidad > 0 ? 'Entrada manual' : 'Salida manual',
      cantidad,
      saldo: newStock
    };

    setMovements(prev => [...prev, movementObj]);

    // Sync to Firestore
    setDoc(doc(db, 'movements', `${product.codigo}_${now}`), movementObj).catch(err => {
      console.warn('Could not sync movement to Firestore', err);
    });

    const msg = `Movimiento registrado: ${product.nombre} ${cantidad > 0 ? '+' : ''}${cantidad}`;
    showToast(msg);
    return { ok: true, mensaje: msg };
  };

  // Route calculation using Nearest Neighbor algorithm
  const calculateRoutes = (): Order[] => {
    const readyOrders = orders.filter(o => o.estado === 'Listo').map(o => ({ ...o }));
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);

    const route: Order[] = [];
    let currentPos = { x: 0, y: 0 };
    let cumulative = 0;

    const remaining = [...readyOrders];

    while (remaining.length) {
      remaining.sort(
        (a, b) =>
          dist(INITIAL_CLIENTS[a.clienteIdx], currentPos) -
          dist(INITIAL_CLIENTS[b.clienteIdx], currentPos)
      );
      const nextOrder = remaining.shift()!;
      const dest = INITIAL_CLIENTS[nextOrder.clienteIdx];
      const legKm = dist(dest, currentPos);
      cumulative += legKm;
      nextOrder.kmTramo = legKm;
      nextOrder.km = cumulative;
      route.push(nextOrder);
      currentPos = dest;
    }

    return route;
  };

  // Chatbot helpers
  const sendChatMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const botReply = getChatbotResponse(trimmed, products, orders, selectedClientIndex);
    setChatMessages(prev => [
      ...prev,
      { autor: 'yo', texto: trimmed },
      { autor: 'bot', texto: botReply }
    ]);
  };

  const sendShopChatMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const botReply = getChatbotResponse(trimmed, products, orders, selectedClientIndex);
    setShopChatMessages(prev => [
      ...prev,
      { autor: 'yo', texto: trimmed },
      { autor: 'bot', texto: botReply }
    ]);
  };

  const resetAllData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(FAVORITES_KEY);
    } catch {}
    setProducts(JSON.parse(JSON.stringify(INITIAL_PRODUCTS)));
    setOrders([]);
    setMovements([]);
    setNotifications([]);
    setNextId(1);
    setCart({});
    setFavorites(new Set());
    setChatMessages([]);
    setShopChatMessages([]);
    showToast('Datos reiniciados con éxito');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        loginWithGoogle,
        logout,
        products,
        orders,
        movements,
        notifications,
        clients: INITIAL_CLIENTS,
        selectedClientIndex,
        setSelectedClientIndex,
        cart,
        favorites,
        toggleFavorite,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotalQuantity,
        cartTotalPrice,
        confirmOrder,
        markPrepared,
        confirmDelivery,
        registerMovement,
        calculateEOQ,
        demand30Days,
        replenishEOQ,
        calculateRoutes,
        activeView,
        setActiveView,
        currentRole,
        setCurrentRole,
        activeModule,
        setActiveModule,
        statusFilter,
        setStatusFilter,
        chatMessages,
        sendChatMessage,
        shopChatMessages,
        sendShopChatMessage,
        excludeOutlier,
        setExcludeOutlier,
        toastMessage,
        showToast,
        resetAllData,
        exportOrders: () => exportOrdersCSV(orders, INITIAL_CLIENTS),
        exportInventory: () => exportInventoryCSV(products, calculateEOQ),
        exportMovements: () => exportMovementsCSV(movements)
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
