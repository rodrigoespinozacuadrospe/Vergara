/* Ejecutar: node tests/admin-smoke.cjs (servidor estático en puerto 8000).
 * Requiere Playwright y Chromium. PLAYWRIGHT_MODULE / CHROMIUM_PATH son opcionales.
 */
const assert = require('node:assert/strict');
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { playwright = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const base = process.env.SITE_URL || 'http://127.0.0.1:8000';

(async () => {
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/gestion.html`);
    await page.getByRole('heading', { name: 'Resumen general', exact: true }).waitFor();
    const initialStock = await page.evaluate(() => Vergara.state.productos.find(p => p.codigo === '7750001').stock);
    await page.locator('#menu [data-id="cliente"]').click();
    await page.locator('[data-codigo="7750001"][data-delta="10"]').click();
    await page.locator('[data-action="confirmar-pedido"]').click();
    await page.getByText('#1 · S/ 240.00').waitFor();
    assert.equal(await page.evaluate(() => Vergara.state.productos.find(p => p.codigo === '7750001').stock), initialStock - 10);

    await page.locator('#menu [data-id="almacen"]').click();
    await page.locator('[data-action="preparar"][data-id="1"]').click();
    await page.locator('#menu [data-id="distribucion"]').click();
    await page.locator('#firma-1').fill('María Pérez');
    await page.locator('#foto-1').check();
    await page.locator('[data-action="entregar"][data-id="1"]').click();
    await page.getByText('Firmó: María Pérez', { exact: true }).waitFor();

    await page.reload();
    await page.locator('#menu [data-id="ventas"]').click();
    await page.locator('.fila span').filter({ hasText: /^Entregado$/ }).waitFor();
    await page.locator('#menu [data-id="almacen"]').click();
    await page.locator('#codigo').fill('7750001');
    await page.locator('#cantidad').fill('-9999');
    await page.locator('[data-action="registrar"]').click();
    await page.getByText('La salida supera el stock disponible', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => Vergara.state.productos.find(p => p.codigo === '7750001').stock), initialStock - 10);

    await page.locator('#menu [data-id="laboratorio"]').click();
    await page.getByText('95.00 min', { exact: true }).waitFor();
    await page.locator('#exclude-outlier').check();
    await page.getByText('76.36 min', { exact: true }).waitFor();
    await page.locator('#menu [data-id="asistente"]').click();
    await page.locator('[data-action="chat-rapido"]').first().click();
    assert.equal(await page.locator('.burbuja.bot').count(), 1);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#menu [data-id="dashboard"]').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('[data-action="salir"]').click();
    await page.locator('[data-rol="cliente"]').click();
    assert.equal(await page.locator('#menu [data-id="almacen"]').count(), 0);
    assert.equal(await page.locator('a[href="index.html"]').count() >= 1, true);
    assert.deepEqual(errors, []);
    console.log('PASS gestión: pedido → stock → preparación → entrega; persistencia; validación de salida; laboratorio; asistente; roles; móvil; sin errores JS.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
