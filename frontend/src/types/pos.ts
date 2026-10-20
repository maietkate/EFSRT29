export interface Product {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  imagen: string;
}

export interface CartItem {
  producto: Product;
  cantidad: number;
}