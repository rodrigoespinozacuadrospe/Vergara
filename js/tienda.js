/* Tienda estática Vergara. Reutiliza inventario y pedidos del centro de operaciones. */
(function () {
  'use strict';
  const V = window.Vergara, s = V.state, $ = id => document.getElementById(id), esc = V.ui.escapar;
  const money = n => new Intl.NumberFormat('es-PE', {style:'currency',currency:'PEN'}).format(n);
  const paths = {
    'search':'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    'user':'<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    'pin':'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    'box':'<path d="m12 3 9 5v10l-9 5-9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v10M7.5 5.5l9 5v5"/>',
    'cart':'<path d="M2 3h3l2.5 12.5h11L21 7H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/>',
    'menu':'<path d="M4 6h16M4 12h16M4 18h16"/>',
    'heart':'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    'truck':'<path d="M1 4h13v13H1zM14 9h4l4 4v4h-8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    'shield':'<path d="M12 2 3.5 5v6c0 6 8.5 11 8.5 11s8.5-5 8.5-11V5Z"/><path d="m8 11 3 3 5-6"/>',
    'chat':'<path d="M21 11.5a9 9 0 0 1-9 8.5 11 11 0 0 1-4-.7L3 21l1.7-5A8 8 0 0 1 3 11.5a9 9 0 0 1 18 0Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/>',
    'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    'external':'<path d="M14 3h7v7M21 3 10 14"/><path d="M21 14v6H4V3h6"/>',
    'spark':'<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>',
    'plus':'<path d="M12 5v14M5 12h14"/>',
    'close':'<path d="m6 6 12 12M6 18 18 6"/>',
    'check':'<path d="m5 12 4 4L19 6"/>'
  };
  const ico = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.box}</svg>`;
  function icons(root=document) { root.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML=ico(el.dataset.icon,el.className); }); }
  const meta = {
    '7750001':{image:'arroz',category:'Abarrotes',label:'Arroz extra',format:'Bolsa de 5 kg',tag:'ESENCIAL DE TU NEGOCIO'},
    '7750002':{image:'aceite',category:'Abarrotes',label:'Aceite vegetal',format:'Botella de 1 L',tag:'PARA CADA DÍA'},
    '7750003':{image:'azucar',category:'Abarrotes',label:'Azúcar rubia',format:'Bolsa de 1 kg',tag:''},
    '7750004':{image:'fideos',category:'Abarrotes',label:'Fideos spaghetti',format:'Paquete de 500 g',tag:''},
    '7750005':{image:'leche',category:'Desayunos',label:'Leche evaporada',format:'Lata de 400 g',tag:'SELECCIÓN VERGARA'},
    '7750006':{image:'cafe',category:'Desayunos',label:'Café tostado y molido',format:'Bolsa de 250 g',tag:''},
    '7750007':{image:'detergente',category:'Limpieza',label:'Detergente en polvo',format:'Bolsa de 800 g',tag:'PARA TU HOGAR'},
    '7750008':{image:'galletas',category:'Desayunos',label:'Galletas de vainilla',format:'Paquete de 6 unidades',tag:''}
  };
  const CART_KEY='vergara-tienda-carrito-v1', FAVORITES_KEY='vergara-tienda-favoritos-v1', CLIENT_KEY='vergara-tienda-cliente-v1';
  const read=(key,fallback)=>{try {return JSON.parse(localStorage.getItem(key))??fallback;} catch{return fallback;}};
  let storageWarning=false;
  function write(key,value) {try{localStorage.setItem(key,JSON.stringify(value));}catch{if(!storageWarning){toast('El navegador no permite guardar los cambios. Se conservarán durante esta sesión.');storageWarning=true;}}}
  const storedFav=read(FAVORITES_KEY,[]);
  const T={category:'Todos',search:'',sort:'recommended',favorites:new Set(Array.isArray(storedFav)?storedFav:[]),onlyFavorites:false,dialog:null,chat:[]};
  V.storage.cargar();
  const client=read(CLIENT_KEY,0); s.clienteSeleccionado=Number.isInteger(client)&&client>=0&&client<V.data.clientes.length?client:0;
  const draft=read(CART_KEY,{});
  s.carrito={};
  s.productos.forEach(p=>{const n=draft?.[p.codigo];if(Number.isSafeInteger(n)&&n>0)s.carrito[p.codigo]=Math.min(n,p.stock);});
  let toastTimer;
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
  function refreshCount(){const n=V.pedidos.cantidadCarrito();$('cart-count').textContent=n;document.querySelector('[data-shop="cart"]')?.setAttribute('aria-label',`Abrir carrito: ${n} unidades`);}
  function productCard(p){const m=meta[p.codigo];if(!m)return '';const favorite=T.favorites.has(p.codigo);const cents=p.precio.toFixed(2).split('.');return `<article class="product-card" data-product="${p.codigo}"><div class="product-visual">${m.tag?`<span class="product-tag">${m.tag}</span>`:''}<img src="assets/${m.image}.svg" alt="${esc(m.label)}, ${esc(m.format)}" loading="lazy" width="400" height="400"><button class="favorite-button" data-shop="favorite" data-code="${p.codigo}" aria-label="${favorite?'Quitar':'Guardar'} ${esc(m.label)} ${favorite?'de':'en'} mi lista" aria-pressed="${favorite}">${ico('heart')}</button></div><div class="product-info"><span class="product-brand">VERGARA · SELECCIÓN MAYORISTA</span><h3>${m.label}</h3><span class="product-format">${m.format}</span><span class="product-stock ${p.stock<=0?'out':p.stock<=p.reorden?'low':''}">${p.stock>0?`${p.stock} unidades disponibles`:'Agotado por el momento'}</span><div class="product-bottom"><span class="product-price" aria-label="${p.precio.toFixed(2)} soles"><small>S/</small>${cents[0]}<sup>${cents[1]}</sup></span><button class="add-button" data-shop="add" data-code="${p.codigo}" aria-label="Agregar ${esc(m.label)} al carrito" ${p.stock<=0?'disabled':''}>${ico('plus')} Agregar</button></div></div></article>`;}
  function renderProducts(){
    const normalized=V.ui.normalizar(T.search);
    let list=s.productos.filter(p=>meta[p.codigo]&&(T.category==='Todos'||meta[p.codigo].category===T.category)&&(!T.onlyFavorites||T.favorites.has(p.codigo))&&(!normalized||V.ui.normalizar(`${p.nombre} ${meta[p.codigo].label} ${meta[p.codigo].category} ${p.codigo}`).includes(normalized)));
    if(T.sort==='price-low')list.sort((a,b)=>a.precio-b.precio);
    if(T.sort==='price-high')list.sort((a,b)=>b.precio-a.precio);
    if(T.sort==='name')list.sort((a,b)=>meta[a.codigo].label.localeCompare(meta[b.codigo].label,'es'));
    $('product-grid').innerHTML=list.length?list.map(productCard).join(''):`<div class="empty-state">${ico(T.onlyFavorites?'heart':'search')}<h3>${T.onlyFavorites?'Tu lista está esperando tus favoritos':'No encontramos esos productos'}</h3><p>${T.onlyFavorites?'Toca el corazón de un producto para guardarlo aquí.':'Prueba con otro nombre o explora todas las categorías.'}</p><button class="button button-primary" data-shop="clear">Ver todos los productos ${ico('arrow-right')}</button></div>`;
    $('results-count').textContent=`${list.length} ${list.length===1?'producto':'productos'}`;
    $('catalog-title').textContent=T.onlyFavorites?'Tu lista, a tu gusto.':T.search?'Encontramos esto para ti.':T.category==='Todos'?'Lo esencial para tu negocio.':T.category==='Limpieza'?'Limpieza para cada espacio.':`${T.category}, bien seleccionado.`;
    $('active-search').innerHTML=T.search||T.onlyFavorites?`<div class="active-query"><span>${T.search?`Búsqueda: «${esc(T.search)}»`:''}${T.onlyFavorites?' · Solo favoritos':''}</span><button data-shop="clear">Limpiar filtros ×</button></div>`:'';
    document.querySelectorAll('.filter-tabs [data-shop="category"]').forEach(el=>{const selected=el.dataset.category===T.category;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
    document.querySelectorAll('.category-nav [data-shop="category"]').forEach(el=>el.classList.toggle('is-active',el.dataset.category===T.category));
  }
  function browse(category='Todos',onlyFavorites=false){T.category=category;T.onlyFavorites=onlyFavorites;T.search='';$('search-input').value='';$('search-category').value=category;renderProducts();$('catalogo').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  function openDialog(kind,title,html,drawer=false){T.dialog=kind;const dialog=$('shop-dialog');dialog.classList.toggle('drawer',drawer);$('dialog-title').textContent=title;$('dialog-body').innerHTML=html;if(!dialog.open)dialog.showModal();icons($('dialog-body'));}
  const clientOptions=()=>V.data.clientes.map((c,i)=>`<option value="${i}" ${i===s.clienteSeleccionado?'selected':''}>${esc(c.nombre)}</option>`).join('');
  function renderCart(){const lines=s.productos.filter(p=>(s.carrito[p.codigo]||0)>0);openDialog('cart',`Mi carrito (${V.pedidos.cantidadCarrito()})`,lines.length?`<p class="dialog-intro">Lo que tu negocio necesita, listo para tu próximo pedido.</p>${lines.map(p=>`<div class="cart-row"><img src="assets/${meta[p.codigo]?.image||'arroz'}.svg" alt=""><div class="cart-item-info"><h3>${esc(meta[p.codigo]?.label||p.nombre)}</h3><p>${money(p.precio)} por unidad</p><div class="quantity-controls"><button data-shop="quantity" data-code="${p.codigo}" data-delta="-1" aria-label="Quitar una unidad de ${esc(p.nombre)}">−</button><span>${s.carrito[p.codigo]}</span><button data-shop="quantity" data-code="${p.codigo}" data-delta="1" aria-label="Agregar una unidad de ${esc(p.nombre)}">+</button><button class="remove-item" data-shop="remove" data-code="${p.codigo}" aria-label="Eliminar ${esc(p.nombre)} del carrito">Eliminar</button></div></div><span class="cart-line-total">${money(p.precio*s.carrito[p.codigo])}</span></div>`).join('')}<div class="cart-summary"><div class="summary-row"><span>Entrega</span><span>Por coordinar</span></div><div class="summary-row summary-total"><span>Total de productos</span><span>${money(V.pedidos.totalCarrito())}</span></div><label class="form-label" for="checkout-client">Pedido para</label><select id="checkout-client" class="form-select">${clientOptions()}</select><p class="demo-checkout-note">Este es un pedido de demostración. No se realizará ningún cobro ni envío real.</p><button class="button button-primary dialog-button" data-shop="checkout">Confirmar pedido de demostración ${ico('arrow-right')}</button><p class="fine-print">El total incluye solo productos. La disponibilidad se vuelve a validar al confirmar.</p></div>`:`<div class="empty-state">${ico('cart')}<h3>Tu próximo pedido empieza aquí.</h3><p>Explora el catálogo y agrega tus productos al carrito.</p><button class="button button-primary" data-shop="shop-now">Explorar productos ${ico('arrow-right')}</button></div>`,true);}
  function updateCart(code,delta){const p=s.productos.find(p=>p.codigo===code);if(!p||!Number.isSafeInteger(delta))return;const before=s.carrito[code]||0;V.pedidos.cambiarCantidad(code,delta);if(before===s.carrito[code]&&delta>0){toast(`Solo hay ${p.stock} unidades disponibles de ${p.nombre}.`);return;}write(CART_KEY,s.carrito);refreshCount();if(T.dialog==='cart')renderCart();else toast(`${meta[code]?.label||p.nombre} agregado a tu carrito.`);}
  function renderOrders(){const orders=s.pedidos.filter(p=>p.clienteIdx===s.clienteSeleccionado).slice().reverse();openDialog('orders','Mis pedidos',`<p class="dialog-intro">Pedidos de ${esc(V.data.clientes[s.clienteSeleccionado].nombre)}. Los estados se actualizan desde el centro de operaciones.</p>${orders.length?orders.map(o=>`<article class="order-card"><div class="order-card-top"><h3>Pedido #${o.id}</h3><span class="order-status ${o.estado==='Entregado'?'complete':''}">${esc(o.estado)}</span></div><p>${new Date(o.creado).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p><p>${o.items.map(i=>`${i.cantidad} × ${esc(i.nombre)}`).join('<br>')}</p><div class="summary-row" style="margin-top:12px;margin-bottom:0"><span>Total de productos</span><b>${money(o.total)}</b></div><div class="order-steps">${['Pendiente','Listo','Entregado'].map((e,i)=>`<span class="${i<=['Pendiente','Listo','Entregado'].indexOf(o.estado)?'done':''}">${ico('check')} ${e}</span>`).join('')}</div></article>`).join(''):`<div class="empty-state">${ico('box')}<h3>Todavía no hay pedidos.</h3><p>Cuando confirmes tu primera compra, podrás seguirla desde aquí.</p><button class="button button-primary" data-shop="shop-now">Preparar mi pedido ${ico('arrow-right')}</button></div>`}<p class="fine-print">Los pedidos se guardan solo en este navegador. La selección de negocio es una simulación, no un inicio de sesión.</p>`,true);}
  function renderAccount(){openDialog('account','Tu negocio en Vergara',`<p class="dialog-intro">Elige uno de nuestros negocios de demostración para preparar pedidos y consultar su seguimiento.</p><label class="form-label" for="account-client">Selecciona tu negocio</label><select class="form-select" id="account-client">${clientOptions()}</select><button class="button button-primary dialog-button" data-shop="save-account">Usar este negocio ${ico('arrow-right')}</button><p class="fine-print">Esta selección no crea una cuenta ni verifica tu identidad. Es un prototipo académico con datos locales.</p>`);}
  function renderHelp(){openDialog('help','¿En qué te ayudamos?',`<p class="dialog-intro">Pregunta por disponibilidad, precios, horarios o el estado de tus pedidos.</p><div class="chat-log" id="chat-log">${T.chat.length?T.chat.map(m=>`<div class="chat-bubble ${m.me?'me':''}">${esc(m.text)}</div>`).join(''):'<div class="chat-bubble">¡Hola! Soy el asistente de Vergara. ¿Qué necesita tu negocio hoy?</div>'}</div><form class="chat-form" id="help-form"><label class="sr-only" for="help-input">Tu consulta</label><input id="help-input" placeholder="Ej. ¿Hay arroz?" maxlength="500" required><button type="submit" aria-label="Enviar consulta">${ico('arrow-right')}</button></form><div class="chat-shortcuts"><button data-shop="question" data-text="¿Hay arroz?">¿Hay arroz?</button><button data-shop="question" data-text="Estado de mi pedido">Mi pedido</button><button data-shop="question" data-text="Horario de entrega">Entregas</button></div><p class="fine-print">Asistente de demostración por palabras clave. No está conectado con WhatsApp ni con un agente humano.</p>`);const log=$('chat-log');log.scrollTop=log.scrollHeight;}
  function ask(text){text=text.trim().slice(0,500);if(!text)return;T.chat.push({me:true,text},{me:false,text:V.chatbot.responder(text)});renderHelp();$('help-input').focus();}
  const actions={
    category:d=>browse(d.category),
    favorites:()=>browse('Todos',true),
    favorite:d=>{T.favorites.has(d.code)?T.favorites.delete(d.code):T.favorites.add(d.code);write(FAVORITES_KEY,[...T.favorites]);renderProducts();document.querySelector(`[data-shop="favorite"][data-code="${d.code}"]`)?.focus({preventScroll:true});},
    clear:()=>browse(),
    add:d=>updateCart(d.code,1),
    quantity:d=>updateCart(d.code,Number(d.delta)),
    remove:d=>{delete s.carrito[d.code];write(CART_KEY,s.carrito);refreshCount();renderCart();},
    cart:renderCart,
    close:()=>$('shop-dialog').close(),
    'shop-now':()=>{$('shop-dialog').close();browse();},
    orders:renderOrders,
    account:renderAccount,
    'save-account':()=>{s.clienteSeleccionado=Number($('account-client').value);write(CLIENT_KEY,s.clienteSeleccionado);$('shop-dialog').close();toast(`Listo. Estás comprando para ${V.data.clientes[s.clienteSeleccionado].nombre}.`);},
    checkout:()=>{s.clienteSeleccionado=Number($('checkout-client').value);write(CLIENT_KEY,s.clienteSeleccionado);const result=V.pedidos.confirmar();if(!result.ok){toast(result.mensaje);renderProducts();renderCart();return;}V.storage.guardar();write(CART_KEY,{});refreshCount();renderProducts();const order=s.pedidos[s.pedidos.length-1];openDialog('confirmation','¡Pedido registrado!',`<div class="confirmation"><div class="confirmation-mark">${ico('check')}</div><h3>Un nuevo impulso para tu negocio.</h3><p>Pedido <b>#${order.id}</b> para ${esc(V.data.clientes[order.clienteIdx].nombre)}.<br>Total de productos: <b>${money(order.total)}</b>.</p><p class="demo-checkout-note">Pedido de demostración guardado en este navegador. No se ha realizado ningún pago ni se programará un envío real.</p><button class="button button-primary dialog-button" data-shop="orders">Ver seguimiento ${ico('arrow-right')}</button><button class="hero-secondary" style="margin-top:20px" data-shop="shop-now">Seguir explorando</button></div>`);},
    how:()=>{if($('shop-dialog').open)$('shop-dialog').close();$('como-funciona').scrollIntoView({behavior:'smooth'});},
    location:()=>openDialog('location','Entregas y cobertura',`<p class="dialog-intro">Vergara Logística está pensada para acompañar a negocios de Lima, Perú.</p><div class="modal-feature">${ico('pin')}<div><b>Coordinamos contigo</b>La dirección, cobertura, tarifa y fecha deben confirmarse con el distribuidor antes de una compra real.</div></div><div class="modal-feature">${ico('truck')}<div><b>Seguimiento de principio a fin</b>En este prototipo puedes probar los estados de preparación y entrega desde el centro de operaciones.</div></div><p class="demo-checkout-note">Esta web es una demostración. No ofrece servicio de despacho real ni confirma cobertura comercial.</p><button class="button button-primary dialog-button" data-shop="close">Entendido</button>`),
    help:renderHelp,
    question:d=>ask(d.text)
  };
  document.addEventListener('click',e=>{const el=e.target.closest('[data-shop]');if(el&&actions[el.dataset.shop])actions[el.dataset.shop](el.dataset);});
  $('search-form').addEventListener('submit',e=>{e.preventDefault();T.search=$('search-input').value.trim();T.category=$('search-category').value;T.onlyFavorites=false;renderProducts();$('catalogo').scrollIntoView({behavior:'smooth'});});
  $('search-input').addEventListener('search',e=>{if(!e.target.value&&T.search){T.search='';renderProducts();}});
  $('sort-products').addEventListener('change',e=>{T.sort=e.target.value;renderProducts();});
  document.addEventListener('submit',e=>{if(e.target.id==='help-form'){e.preventDefault();ask($('help-input').value);}});
  $('shop-dialog').addEventListener('close',()=>{T.dialog=null;});
  $('shop-dialog').addEventListener('click',e=>{if(e.target===$('shop-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  window.addEventListener('storage',e=>{if(e.key===V.storage.CLAVE){V.storage.cargar();renderProducts();if(T.dialog==='orders')renderOrders();}});
  // Sólo se presentan productos del catálogo. No se envía ninguna información a servicios externos.
  $('year').textContent=new Date().getFullYear();icons();refreshCount();renderProducts();
})();
