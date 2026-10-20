import { apiFetch } from './apiClient';

const API_URL = 'http://localhost:8080/api/categorias';

export interface CategoriaApi {
  idCategoria: number;
  nombreCategoria: string;
  descripcion: string | null;
}

export async function obtenerCategoriasApi(): Promise<CategoriaApi[]> {
  const respuesta = await apiFetch(API_URL);

  if (!respuesta.ok) {
    throw new Error(
      `Error al consultar categorías: ${respuesta.status}`
    );
  }

  const categorias: CategoriaApi[] = await respuesta.json();

  return categorias;
}
