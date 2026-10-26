import { Product, Order } from '../types';
import { normalizeText, formatMoney, getStockStatus } from '../utils/format';

export function getChatbotResponse(
  texto: string,
  products: Product[],
  orders: Order[],
  selectedClientIndex: number
): string {
  const t = normalizeText(texto);
  const producto = products.find(p => t.includes(normalizeText(p.nombre.split(' ')[0])));

  if (/hola|buenas|buenos/.test(t)) {
    return '¡Hola! Soy el asistente de Vergara. Puedo informarle sobre disponibilidad, precios, el estado de su pedido y los horarios de entrega.';
  }

  if (/precio|cuesta|cuanto/.test(t) && producto) {
    return `${producto.nombre} cuesta ${formatMoney(producto.precio)} por unidad.`;
  }

  if (producto) {
    const e = getStockStatus(producto.stock, producto.reorden);
    return e.texto === 'Agotado'
      ? `Por ahora ${producto.nombre} está agotado.`
      : `${producto.nombre}: ${e.texto.toLowerCase()} (${producto.stock} unidades). Precio ${formatMoney(producto.precio)}.`;
  }

  if (/pedido|estado|seguimiento|mi orden/.test(t)) {
    const propios = orders.filter(p => p.clienteIdx === selectedClientIndex);
    if (!propios.length) {
      return 'Aún no tiene pedidos registrados. Puede preparar uno en la tienda o en el Portal de Clientes.';
    }
    const u = propios[propios.length - 1];
    return `Su último pedido es el #${u.id} por ${formatMoney(u.total)}. Estado: ${u.estado}.`;
  }

  if (/horario|entrega|envio|cuando|demora/.test(t)) {
    return 'La fecha, cobertura y tarifa de entrega se coordinan con el distribuidor. Este prototipo permite simular pedidos y su seguimiento, pero no programa envíos reales.';
  }

  return 'No entendí su consulta. Puede preguntarme, por ejemplo: "¿Hay arroz?", "Estado de mi pedido" u "Horario de entrega".';
}
