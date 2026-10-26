export function formatMoney(valor: number): string {
  return 'S/ ' + valor.toFixed(2);
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function normalizeText(texto: string): string {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getStockStatus(stock: number, reorden: number): { texto: string; clase: string } {
  if (stock <= 0) return { texto: 'Agotado', clase: 'bad' };
  if (stock <= reorden) return { texto: 'Stock bajo', clase: 'warn' };
  return { texto: 'Disponible', clase: 'ok' };
}
