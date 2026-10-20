
import { obtenerProductosApi } from './productoApi';
import { obtenerCategoriasApi } from './categoriaApi';
import type { Product } from '../types/pos';

const imagenesProductos: Record<string, string> = {
  'PRD-001': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
  'PRD-002': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80',
  'PRD-003': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',
  'PRD-004': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=500&q=80',
  'PRD-005': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80'
};

export async function obtenerProductosPosApi(): Promise<Product[]> {
  const [productos, categorias] = await Promise.all([
    obtenerProductosApi(),
    obtenerCategoriasApi()
  ]);

  return productos.map((producto) => {
    const categoria = categorias.find(
      (item) => item.idCategoria === producto.idCategoria
    );

    return {
      id: producto.idProducto,
      nombre: producto.nombre,
      categoria: categoria?.nombreCategoria ?? 'Sin categoría',
      precio: Number(producto.precio),
      stock: producto.stock,
      imagen: imagenesProductos[producto.codigo]
        ?? producto.imagenUrl
        ?? ''
    };
  });
}
