import { Product, Client, RoleId, ModuleId } from '../types';

export const PRODUCT_META: Record<string, { image: string; category: string; label: string; format: string; tag: string }> = {
  '7750001': { image: 'arroz', category: 'Abarrotes', label: 'Arroz extra', format: 'Bolsa de 5 kg', tag: 'ESENCIAL DE TU NEGOCIO' },
  '7750002': { image: 'aceite', category: 'Abarrotes', label: 'Aceite vegetal', format: 'Botella de 1 L', tag: 'PARA CADA DÍA' },
  '7750003': { image: 'azucar', category: 'Abarrotes', label: 'Azúcar rubia', format: 'Bolsa de 1 kg', tag: '' },
  '7750004': { image: 'fideos', category: 'Abarrotes', label: 'Fideos spaghetti', format: 'Paquete de 500 g', tag: '' },
  '7750005': { image: 'leche', category: 'Desayunos', label: 'Leche evaporada', format: 'Lata de 400 g', tag: 'SELECCIÓN VERGARA' },
  '7750006': { image: 'cafe', category: 'Desayunos', label: 'Café tostado y molido', format: 'Bolsa de 250 g', tag: '' },
  '7750007': { image: 'detergente', category: 'Limpieza', label: 'Detergente en polvo', format: 'Bolsa de 800 g', tag: 'PARA TU HOGAR' },
  '7750008': { image: 'galletas', category: 'Desayunos', label: 'Galletas de vainilla', format: 'Paquete de 6 unidades', tag: '' }
};

export const INITIAL_PRODUCTS: Product[] = [
  { codigo: '7750001', nombre: 'Arroz 5 kg', precio: 24.0, stock: 120, reorden: 60, historial: [30, 34, 28, 36, 40, 38] },
  { codigo: '7750002', nombre: 'Aceite 1 L', precio: 9.5, stock: 34, reorden: 40, historial: [22, 25, 24, 30, 28, 33] },
  { codigo: '7750003', nombre: 'Azúcar 1 kg', precio: 4.2, stock: 90, reorden: 50, historial: [40, 38, 45, 42, 47, 44] },
  { codigo: '7750004', nombre: 'Fideos 500 g', precio: 3.1, stock: 55, reorden: 50, historial: [50, 48, 52, 55, 53, 60] },
  { codigo: '7750005', nombre: 'Leche 400 g', precio: 4.8, stock: 18, reorden: 30, historial: [35, 30, 34, 38, 36, 40] },
  { codigo: '7750006', nombre: 'Café 250 g', precio: 12.5, stock: 64, reorden: 20, historial: [14, 17, 15, 18, 21, 19] },
  { codigo: '7750007', nombre: 'Detergente 800 g', precio: 8.9, stock: 80, reorden: 25, historial: [20, 22, 25, 24, 21, 28] },
  { codigo: '7750008', nombre: 'Galletas 6 unidades', precio: 6.5, stock: 96, reorden: 30, historial: [25, 28, 30, 27, 32, 34] }
];

export const INITIAL_CLIENTS: Client[] = [
  { nombre: 'Bodega Los Olivos', x: 2, y: 3 },
  { nombre: 'Minimarket Aurora', x: 5, y: 1 },
  { nombre: 'Bodega San José', x: 1, y: 6 },
  { nombre: 'Tienda Doña Rosa', x: 6, y: 5 }
];

export const MODULE_TITLES: Record<ModuleId, string> = {
  dashboard: 'Resumen general',
  cliente: 'Nuevo pedido',
  ventas: 'Pedidos y ventas',
  almacen: 'Control de inventario',
  distribucion: 'Distribución',
  asistente: 'Asistente virtual',
  laboratorio: 'Laboratorio de IA y NumPy'
};

export const MODULE_DESCRIPTIONS: Record<ModuleId, string> = {
  dashboard: 'Todo lo que necesitas saber de tu operación, en un solo lugar.',
  cliente: 'Conecta a tus clientes con los productos que necesitan.',
  ventas: 'Consulta tus pedidos y acompaña cada etapa de la venta.',
  almacen: 'Stock disponible, reposición y preparación de pedidos.',
  distribucion: 'Organiza las entregas desde el almacén hasta tu cliente.',
  asistente: 'Respuestas rápidas sobre tus productos y pedidos. Simulación por palabras clave.',
  laboratorio: 'Del dato a la decisión: análisis del caso de streaming con NumPy.'
};

export const MODULE_ICONS: Record<ModuleId, string> = {
  dashboard: '▦',
  cliente: '＋',
  ventas: '▤',
  almacen: '▣',
  distribucion: '◇',
  asistente: '◌',
  laboratorio: '⌁'
};

export interface RoleInfo {
  titulo: string;
  descripcion: string;
  pestanas: ModuleId[];
}

export const ROLES_CONFIG: Record<RoleId, RoleInfo> = {
  cliente: {
    titulo: 'Cliente',
    descripcion: 'Realiza pedidos y consulta su estado',
    pestanas: ['cliente', 'asistente']
  },
  ventas: {
    titulo: 'Ventas',
    descripcion: 'Registra pedidos y revisa ventas',
    pestanas: ['cliente', 'ventas']
  },
  almacen: {
    titulo: 'Almacén',
    descripcion: 'Controla inventario y prepara pedidos',
    pestanas: ['almacen']
  },
  repartidor: {
    titulo: 'Repartidor',
    descripcion: 'Sigue la ruta y confirma entregas',
    pestanas: ['distribucion']
  },
  gerencia: {
    titulo: 'Gerencia',
    descripcion: 'Ve todos los módulos y los indicadores',
    pestanas: ['dashboard', 'cliente', 'ventas', 'almacen', 'distribucion', 'asistente', 'laboratorio']
  }
};

export const APP_CONFIG = {
  costoPorPedido: 40,
  factorMantenimiento: 0.25,
  costoPorKm: 2.5
};
