import type { Product } from '../types/pos';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    nombre: 'Audífonos Nova',
    categoria: 'Tecnología',
    precio: 129.90,
    stock: 18,
    imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
  },
  {
    id: 2,
    nombre: 'Agenda Ejecutiva',
    categoria: 'Oficina',
    precio: 45.50,
    stock: 24,
    imagen: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80'
  },
  {
    id: 3,
    nombre: 'Mug Térmico',
    categoria: 'Accesorios',
    precio: 58.90,
    stock: 8,
    imagen: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80'
  },
  {
    id: 4,
    nombre: 'Kit Home Office',
    categoria: 'Oficina',
    precio: 189.00,
    stock: 12,
    imagen: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=500&q=80'
  },
  {
    id: 5,
    nombre: 'Audífonos Air',
    categoria: 'Tecnología',
    precio: 99.90,
    stock: 4,
    imagen: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80'
  },
  {
    id: 6,
    nombre: 'Cuaderno Premium',
    categoria: 'Oficina',
    precio: 32.00,
    stock: 30,
    imagen: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&q=80'
  }
];

const PRODUCTS_KEY = 'efsrt_products_v1';
const SALES_KEY = 'efsrt_sales_v1';
const MOVEMENTS_KEY = 'efsrt_stock_movements_v1';
export interface StockMovement { id: string; fecha: string; productId: number; producto: string; tipo: 'Entrada' | 'Salida' | 'Stock inicial'; cantidad: number; stockAnterior: number; stockResultante: number; motivo: string; }
export function getStockMovements(): StockMovement[] { try { return JSON.parse(localStorage.getItem(MOVEMENTS_KEY) || '[]') as StockMovement[]; } catch { return []; } }
function saveMovement(movement: StockMovement) { localStorage.setItem(MOVEMENTS_KEY, JSON.stringify([movement, ...getStockMovements()])); }
export interface SaleRecord { id: string; date: string; items: { productId: number; nombre: string; cantidad: number; precio: number }[]; total: number; }
export function getProducts(): Product[] {
  try { const saved = localStorage.getItem(PRODUCTS_KEY); if (saved) return JSON.parse(saved) as Product[]; } catch { /* use defaults */ }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS.map(p => ({...p}));
}
export function saveProducts(products: Product[]) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }
export function getSales(): SaleRecord[] { try { return JSON.parse(localStorage.getItem(SALES_KEY) || '[]') as SaleRecord[]; } catch { return []; } }
export function saveSale(items: { productId: number; nombre: string; cantidad: number; precio: number }[], total: number): SaleRecord {
  const products = getProducts();
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new Error(`No se encontró el producto ${item.nombre}.`);
    if (item.cantidad < 1 || product.stock < item.cantidad) throw new Error(`Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}.`);
  }
  items.forEach(item => { const product = products.find(p => p.id === item.productId)!; const before = product.stock; product.stock -= item.cantidad; saveMovement({ id: `MOV-${Date.now()}-${item.productId}`, fecha: new Date().toISOString(), productId: product.id, producto: product.nombre, tipo: 'Salida', cantidad: item.cantidad, stockAnterior: before, stockResultante: product.stock, motivo: 'Venta registrada' }); });
  saveProducts(products);
  const sale: SaleRecord = { id: `V-${Date.now()}`, date: new Date().toISOString(), items, total };
  localStorage.setItem(SALES_KEY, JSON.stringify([sale, ...getSales()]));
  return sale;
}
export function addProduct(input: Omit<Product, 'id'>): Product {
  const products = getProducts();
  const product: Product = { ...input, id: Math.max(0, ...products.map(p => p.id)) + 1 };
  saveProducts([...products, product]);
  if (product.stock > 0) saveMovement({ id: `MOV-${Date.now()}-${product.id}`, fecha: new Date().toISOString(), productId: product.id, producto: product.nombre, tipo: 'Stock inicial', cantidad: product.stock, stockAnterior: 0, stockResultante: product.stock, motivo: 'Registro de producto' });
  return product;
}

export function addStock(productId: number, cantidad: number, motivo: string): Product {
  if (!Number.isInteger(cantidad) || cantidad <= 0) throw new Error('La cantidad debe ser un entero mayor que cero.');
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) throw new Error('No se encontró el producto seleccionado.');
  const anterior = product.stock;
  product.stock += cantidad;
  saveProducts(products);
  saveMovement({ id: `MOV-${Date.now()}-${product.id}`, fecha: new Date().toISOString(), productId: product.id, producto: product.nombre, tipo: 'Entrada', cantidad, stockAnterior: anterior, stockResultante: product.stock, motivo: motivo.trim() || 'Ingreso de mercadería' });
  return product;
}

