export interface Product {
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
  reorden: number;
  historial: number[];
  // Catalog metadata
  imagen?: string;
  categoria?: string;
  etiqueta?: string;
  formato?: string;
  tag?: string;
}

export interface Client {
  nombre: string;
  x: number;
  y: number;
}

export interface OrderItem {
  codigo: string;
  nombre: string;
  cantidad: number;
  precio: number;
}

export type OrderStatus = 'Pendiente' | 'Listo' | 'Entregado';

export interface Order {
  id: number;
  clienteIdx: number;
  items: OrderItem[];
  total: number;
  estado: OrderStatus;
  creado: number;
  preparado?: number;
  entregado?: number;
  firmadoPor?: string;
  kmTramo?: number;
  km?: number;
}

export interface InventoryMovement {
  fecha: number;
  codigo: string;
  nombre: string;
  motivo: string;
  cantidad: number;
  saldo: number;
}

export interface NotificationItem {
  clienteIdx: number;
  texto: string;
  fecha: number;
}

export interface ChatMessage {
  autor: 'yo' | 'bot';
  texto: string;
}

export type RoleId = 'cliente' | 'ventas' | 'almacen' | 'repartidor' | 'gerencia';

export type ModuleId = 'dashboard' | 'cliente' | 'ventas' | 'almacen' | 'distribucion' | 'asistente' | 'laboratorio';
