import { Order, Product, InventoryMovement, Client } from '../types';
import { formatDateTime } from '../utils/format';

function downloadCSV(fileName: string, rows: (string | number)[][]): void {
  const cell = (v: string | number) => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = '\ufeff' + rows.map(r => r.map(cell).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportOrdersCSV(orders: Order[], clients: Client[]): void {
  const rows: (string | number)[][] = [['ID', 'Cliente', 'Productos', 'Total (S/)', 'Estado', 'Fecha']];
  orders.forEach(o => {
    const clientName = clients[o.clienteIdx]?.nombre || `Cliente #${o.clienteIdx}`;
    const productList = o.items.map(i => `${i.cantidad} ${i.nombre}`).join(', ');
    rows.push([o.id, clientName, productList, o.total.toFixed(2), o.estado, formatDateTime(o.creado)]);
  });
  downloadCSV('pedidos_vergara.csv', rows);
}

export function exportInventoryCSV(products: Product[], calculateEOQ: (p: Product) => number): void {
  const rows: (string | number)[][] = [['Código', 'Producto', 'Stock', 'Punto de reorden', 'EOQ sugerido']];
  products.forEach(p => {
    rows.push([p.codigo, p.nombre, p.stock, p.reorden, calculateEOQ(p)]);
  });
  downloadCSV('inventario_vergara.csv', rows);
}

export function exportMovementsCSV(movements: InventoryMovement[]): void {
  const rows: (string | number)[][] = [['Fecha', 'Código', 'Producto', 'Motivo', 'Cantidad', 'Saldo']];
  movements.forEach(m => {
    rows.push([formatDateTime(m.fecha), m.codigo, m.nombre, m.motivo, m.cantidad, m.saldo]);
  });
  downloadCSV('movimientos_vergara.csv', rows);
}
