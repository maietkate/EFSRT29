import { apiFetch } from './apiClient';

const API_URL = 'http://localhost:8080/api/productos';

export interface ProductoApi {
  idProducto: number;
  codigo: string;
  nombre: string;
  idCategoria: number | null;
  stock: number;
  stockMinimo: number | null;
  precio: number;
  imagenUrl: string | null;
}

export async function obtenerProductosApi(): Promise<ProductoApi[]> {
  const respuesta = await apiFetch(API_URL);

  if (!respuesta.ok) {
    throw new Error(
      `Error al consultar productos: ${respuesta.status}`
    );
  }

  const productos: ProductoApi[] = await respuesta.json();

  return productos;
}
