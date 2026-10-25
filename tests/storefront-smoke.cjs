/* Prueba funcional de tienda + inventario compartido.
 * node tests/storefront-smoke.cjs (servidor estático iniciado, puerto 8000 por defecto).
 * Opcionales: SITE_URL, PLAYWRIGHT_MODULE, CHROMIUM_PATH.
 */
const assert = require('node:assert/strict');
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { playwright = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const base = (process.env.SITE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce', acceptDownloads: true });
  const errors = [], failedRequests = [], failedResponses = [];
  const watch = page => {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', r => failedRequests.push(`${r.method()} ${r.url()}: ${r.failure()?.errorText}`));
    page.on('response', r => { if (r.status() >= 400) failedResponses.push(`${r.status()} ${r.url()}`); });
  };
  const page = await context.newPage(); watch(page); page.setDefaultTimeout(15000);
  const cards = page.locator('#product-grid .product-card');
  const code = value => page.locator(`[data-shop="${value}"]`);
  const closeDialog = () => page.locator('#shop-dialog .dialog-header [data-shop="close"]').click();
  try {
    await page.goto(base + '/index.html');
    await page.locator('[data-product="7750008"]').waitFor();
    assert.equal(await cards.count(), 8, 'Eight products render');
    await page.evaluate(async () => { await document.fonts.ready; document.querySelectorAll('img').forEach(i => i.loading = 'eager'); await Promise.all([...document.images].map(i => i.decode().catch(() => {})));  });
    assert.equal(await page.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)), true, 'All images load');

    console.log('Ready: 8 products and images');
    for (const [category, count] of [['Abarrotes', 4], ['Desayunos', 3], ['Limpieza', 1], ['Todos', 8]]) {
      await page.locator(`.filter-tabs [data-category="${category}"]`).click();
      assert.equal(await cards.count(), count, `${category} category`);
    }
    await page.locator('#search-input').fill('arroz');
    await page.locator('#search-form').evaluate(f => f.requestSubmit());
    assert.equal(await cards.count(), 1, 'Search rice');
    assert.equal(await cards.first().getAttribute('data-product'), '7750001');
    await page.locator('#search-input').fill('producto inexistente 98765');
    await page.locator('#search-form').evaluate(f => f.requestSubmit());
    await page.getByRole('heading', { name: 'No encontramos esos productos' }).waitFor();
    assert.equal(await cards.count(), 0);
    await page.locator('#product-grid [data-shop="clear"]').click();
    assert.equal(await cards.count(), 8);

    console.log('PASS search and categories');
    for (const [sort, ascending] of [['price-low', true], ['price-high', false]]) {
      await page.locator('#sort-products').selectOption(sort);
      const prices = await page.locator('#product-grid .product-card').evaluateAll(nodes => nodes.map(n => Vergara.state.productos.find(p => p.codigo === n.dataset.product).precio));
      const sorted = [...prices].sort((a, b) => ascending ? a - b : b - a);
      assert.deepEqual(prices, sorted, sort);
    }
    await page.locator('#sort-products').selectOption('recommended');
    await page.locator('[data-shop="favorite"][data-code="7750001"]').click();
    assert.equal(await page.locator('[data-shop="favorite"][data-code="7750001"]').getAttribute('aria-pressed'), 'true');
    await page.locator('.category-nav [data-shop="favorites"]').click();
    assert.equal(await cards.count(), 1);
    await page.reload();
    assert.equal(await page.locator('[data-shop="favorite"][data-code="7750001"]').getAttribute('aria-pressed'), 'true', 'Favorite persists');

    console.log('PASS sorting and favorites');
    await page.locator('.account-button').click();
    await page.locator('#account-client').selectOption('1');
    await page.locator('[data-shop="save-account"]').click();
    assert.equal(await page.evaluate(() => Vergara.state.clienteSeleccionado), 1);
    const initialStock = await page.evaluate(() => Vergara.state.productos.find(p => p.codigo === '7750001').stock);
    await page.locator('[data-shop="add"][data-code="7750001"]').click();
    await page.locator('[data-shop="add"][data-code="7750002"]').click();
    await page.locator('.header-cart').click();
    assert.equal(await page.locator('#shop-dialog .cart-row').count(), 2);
    await page.locator('[data-shop="quantity"][data-code="7750001"][data-delta="1"]').click();
    assert.equal(await page.evaluate(() => Vergara.state.carrito['7750001']), 2);
    await page.locator('[data-shop="quantity"][data-code="7750001"][data-delta="-1"]').click();
    assert.equal(await page.evaluate(() => Vergara.state.carrito['7750001']), 1);
    await page.locator('[data-shop="quantity"][data-code="7750001"][data-delta="1"]').click();
    await page.locator('[data-shop="remove"][data-code="7750002"]').click();
    assert.equal(await page.locator('#shop-dialog .cart-row').count(), 1);
    assert.equal(await page.locator('#cart-count').innerText(), '2');
    await closeDialog();
    await page.reload();
    assert.equal(await page.locator('#cart-count').innerText(), '2', 'Cart persists');
    assert.equal(await page.evaluate(() => Vergara.state.clienteSeleccionado), 1, 'Selected business persists');
    await page.locator('.header-cart').click();
    await page.locator('#checkout-client').selectOption('2');
    await page.locator('[data-shop="checkout"]').click();
    await page.getByRole('heading', { name: '¡Pedido registrado!' }).waitFor();
    assert.equal(await page.evaluate(() => Vergara.state.productos.find(p => p.codigo === '7750001').stock), initialStock - 2);
    const order = await page.evaluate(() => Vergara.state.pedidos.at(-1));
    assert.equal(order.total, 48); assert.equal(order.clienteIdx, 2); assert.equal(order.estado, 'Pendiente');
    assert.equal(await page.locator('#cart-count').innerText(), '0');
    await page.locator('#shop-dialog [data-shop="orders"]').click();
    await page.getByRole('heading', { name: `Pedido #${order.id}`, exact: true }).waitFor();
    assert.equal(await page.locator('.order-status').innerText(), 'Pendiente');

    console.log('PASS cart and checkout');
    const admin = await context.newPage(); watch(admin);
    await admin.goto(base + '/gestion.html');
    assert.equal(await admin.evaluate(() => Vergara.state.productos.find(p => p.codigo === '7750001').stock), initialStock - 2, 'Admin stock shared');
    const adminOrder = await admin.evaluate(() => Vergara.state.pedidos.at(-1));
    assert.equal(adminOrder.id, order.id); assert.equal(adminOrder.clienteIdx, 2);
    await admin.locator('#menu [data-id="almacen"]').click();
    await admin.locator(`[data-action="preparar"][data-id="${order.id}"]`).click();
    await page.waitForFunction(() => document.querySelector('.order-status')?.textContent === 'Listo');
    await closeDialog();
    await page.reload();
    await page.locator('.orders-button').click();
    assert.equal(await page.locator('.order-status').innerText(), 'Listo', 'Updated order persists');
    await closeDialog();

    console.log('PASS shared order and persistence');
    await page.locator('.help-float').click();
    await page.locator('[data-shop="question"][data-text="¿Hay arroz?"]').click();
    assert.equal(await page.locator('.chat-bubble').count(), 2);
    const helpAnswer = await page.locator('.chat-bubble:not(.me)').innerText();
    assert.match(helpAnswer, new RegExp(`${initialStock - 2} unidades`));
    await closeDialog();
    await page.locator('.delivery-button').click();
    await page.getByRole('heading', { name: 'Entregas y cobertura' }).waitFor();
    await closeDialog();

    console.log('PASS help and coverage');
    const downloadLogo = page.waitForEvent('download');
    await page.locator('a[download="vergara-logistica-logo.svg"]').click();
    const logo = await downloadLogo; assert.equal(logo.suggestedFilename(), 'vergara-logistica-logo.svg'); assert.equal(await logo.failure(), null);
    console.log('PASS logo download');
    await admin.goto(base + '/gestion.html?modulo=laboratorio');
    await admin.getByRole('heading', { name: 'Laboratorio de IA y NumPy' }).waitFor();
    for (const file of ['analisis_numpy.py', 'Laboratorio_IA_NumPy.ipynb']) {
      const download = admin.waitForEvent('download');
      await admin.locator(`a[href="laboratorio/${file}"]`).click();
      const d = await download; assert.equal(d.suggestedFilename(), file); assert.equal(await d.failure(), null);
    }
    console.log('PASS Python and notebook downloads');
    for (const width of [768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No horizontal overflow at ${width}px`);
      await page.locator('.header-cart').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Cart no overflow at ${width}px`);
      await closeDialog();
      await page.locator('[data-shop="add"][data-code="7750001"]').click();
    }
    assert.deepEqual(failedResponses, [], 'No HTTP error responses');
    assert.deepEqual(failedRequests, [], 'No failed resource requests');
    assert.deepEqual(errors, [], 'No console / JavaScript errors');
    console.log('PASS storefront: 8 productos; categorías; búsqueda y vacío; orden; favoritos; carrito +/−/eliminar; cliente; pedido; stock/seguimiento compartido con gestión; persistencia; ayuda; logo/Python/cuaderno descargables; 768/390 px sin overflow; sin errores JS, consola o recursos.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
