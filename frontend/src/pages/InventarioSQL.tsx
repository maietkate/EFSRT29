import { apiFetch } from '../services/apiClient';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  Database,
  AlertTriangle,
  Plus,
  X,
  Save,
  Pencil
} from 'lucide-react';

import { obtenerProductosApi } from '../services/productoApi';
import type { ProductoApi } from '../services/productoApi';
import { obtenerCategoriasApi } from '../services/categoriaApi';
import type { CategoriaApi } from '../services/categoriaApi';

type FormularioProducto = {
  codigo: string;
  nombre: string;
  idCategoria: string;
  stock: string;
  stockMinimo: string;
  precio: string;
  imagenUrl: string;
};

const formularioInicial: FormularioProducto = {
  codigo: '',
  nombre: '',
  idCategoria: '',
  stock: '0',
  stockMinimo: '5',
  precio: '',
  imagenUrl: ''
};

export default function InventarioSQL({ soloLectura = false }: { soloLectura?: boolean }) {
  const [productos, setProductos] = useState<ProductoApi[]>([]);
  const [categorias, setCategorias] = useState<CategoriaApi[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<FormularioProducto>({
    ...formularioInicial
  });
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    setError('');

    try {
      const [datosProductos, datosCategorias] = await Promise.all([
        obtenerProductosApi(),
        obtenerCategoriasApi()
      ]);

      setProductos(datosProductos);
      setCategorias(datosCategorias);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreCategoria = (idCategoria: number | null) => {
    const encontrada = categorias.find(
      (categoria) => categoria.idCategoria === idCategoria
    );

    return encontrada?.nombreCategoria || 'Sin categoría';
  };

  const abrirFormulario = () => {
    setProductoEditando(null);
    setFormulario({ ...formularioInicial });
    setErrorFormulario('');
    setMensajeExito('');
    setMostrarFormulario(true);
  };

  const abrirEdicion = (producto: ProductoApi) => {
    setProductoEditando(producto.idProducto);

    setFormulario({
      codigo: producto.codigo,
      nombre: producto.nombre,
      idCategoria: String(producto.idCategoria ?? ''),
      stock: String(producto.stock),
      stockMinimo: String(producto.stockMinimo ?? 5),
      precio: String(producto.precio),
      imagenUrl: producto.imagenUrl ?? ''
    });

    setErrorFormulario('');
    setMensajeExito('');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setMostrarFormulario(false);
    setProductoEditando(null);
    setErrorFormulario('');
  };

  const actualizarCampo = (
    campo: keyof FormularioProducto,
    valor: string
  ) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  };

  const guardarProducto = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorFormulario('');

    const codigo = formulario.codigo.trim();
    const nombre = formulario.nombre.trim();
    const categoria = Number(formulario.idCategoria);
    const stock = Number(formulario.stock);
    const stockMinimo = Number(formulario.stockMinimo);
    const precio = Number(formulario.precio);

    if (!codigo || !nombre || !formulario.idCategoria) {
      setErrorFormulario(
        'Completa el código, nombre y categoría.'
      );
      return;
    }

    if (codigo.length > 50) {
      setErrorFormulario(
        'El código no puede superar 50 caracteres.'
      );
      return;
    }

    if (
      formulario.stock.trim() === '' ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setErrorFormulario(
        'El stock debe ser un número entero mayor o igual a cero.'
      );
      return;
    }

    if (
      formulario.stockMinimo.trim() === '' ||
      !Number.isInteger(stockMinimo) ||
      stockMinimo < 0
    ) {
      setErrorFormulario(
        'El stock mínimo debe ser un número entero mayor o igual a cero.'
      );
      return;
    }

    if (
      formulario.precio.trim() === '' ||
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      setErrorFormulario('El precio debe ser mayor que cero.');
      return;
    }

    if (
      !categorias.some(
        (item) => item.idCategoria === categoria
      )
    ) {
      setErrorFormulario('Selecciona una categoría válida.');
      return;
    }

    setGuardando(true);

    const editando = productoEditando !== null;

    const url = editando
      ? `http://localhost:8080/api/productos/${productoEditando}`
      : 'http://localhost:8080/api/productos';

    try {
      const respuesta = await apiFetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          codigo,
          nombre,
          idCategoria: categoria,
          stock,
          stockMinimo,
          precio,
          imagenUrl: formulario.imagenUrl.trim() || null
        })
      });

      if (!respuesta.ok) {
        let mensaje = editando
          ? 'No se pudo actualizar el producto.'
          : 'No se pudo registrar el producto.';

        try {
          const datos = await respuesta.json();

          if (typeof datos.error === 'string') {
            mensaje = datos.error;
          } else if (typeof datos.message === 'string') {
            mensaje = datos.message;
          }
        } catch {

        }

        throw new Error(mensaje);
      }
    } catch (err) {
      setErrorFormulario(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con Spring Boot.'
      );
      setGuardando(false);
      return;
    }

    setMostrarFormulario(false);
    setProductoEditando(null);
    setFormulario({ ...formularioInicial });

    setMensajeExito(
      editando
        ? `El producto "${nombre}" se actualizó correctamente en SQL Server.`
        : `El producto "${nombre}" se registró correctamente en SQL Server.`
    );

    setGuardando(false);
    await cargarDatos();
  };

  const filtrados = productos.filter((producto) => {
    const texto = busqueda.trim().toLowerCase();

    return (
      producto.nombre.toLowerCase().includes(texto) ||
      producto.codigo.toLowerCase().includes(texto) ||
      nombreCategoria(producto.idCategoria)
        .toLowerCase()
        .includes(texto)
    );
  });

  const stockBajo = productos.filter(
    (producto) =>
      producto.stock > 0 &&
      producto.stock <= (producto.stockMinimo ?? 5)
  ).length;

  const sinStock = productos.filter(
    (producto) => producto.stock === 0
  ).length;

  const valorInventario = productos.reduce(
    (total, producto) =>
      total + producto.stock * Number(producto.precio),
    0
  );

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-1">
            Almacén e inventario
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Inventario SQL Server
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {soloLectura ? 'Consulta el stock actualizado desde SQL Server.' : 'Administra los productos almacenados en BD_AISELL.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={cargarDatos}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-50 text-slate-700 px-4 py-3 rounded-xl text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar datos
          </button>

          {!soloLectura && <button
            type="button"
            onClick={abrirFormulario}
            disabled={cargando || error !== ''}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
        <Database className="w-5 h-5 text-blue-600 shrink-0" />

        <div>
          <p className="text-sm font-semibold text-blue-800">
            Fuente de datos: SQL Server
          </p>

          <p className="text-xs text-blue-700 mt-1">
            Información conectada mediante Spring Boot.
            {soloLectura ? 'Consulta de solo lectura.' : 'Puedes consultar, registrar y editar productos.'}
          </p>
        </div>
      </div>

      {mensajeExito && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-medium text-emerald-700"
        >
          {mensajeExito}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Error de conexión: {error}
        </div>
      )}

      {cargando ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-500">
          Consultando inventario de SQL Server...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <Package className="w-6 h-6 text-blue-600 mb-3" />
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Productos
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {productos.length}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <Database className="w-6 h-6 text-slate-500 mb-3" />
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Categorías
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {categorias.length}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-amber-500 mb-3" />
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Stock bajo / agotado
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {stockBajo + sinStock}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <Package className="w-6 h-6 text-emerald-600 mb-3" />
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Valor de inventario
              </p>
              <p className="text-2xl font-bold text-slate-900">
                S/ {valorInventario.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-bold text-lg text-slate-900">
                Productos registrados
              </h2>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full sm:w-64 pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtrados.map((producto) => {
                    const minimo = producto.stockMinimo ?? 5;

                    const estado =
                      producto.stock === 0
                        ? 'Agotado'
                        : producto.stock <= minimo
                        ? 'Stock bajo'
                        : 'Disponible';

                    return (
                      <tr
                        key={producto.idProducto}
                        className="border-t border-slate-100"
                      >
                        <td className="p-4 font-semibold text-blue-600">
                          {producto.codigo}
                        </td>

                        <td className="p-4 font-semibold text-slate-900">
                          {producto.nombre}
                        </td>

                        <td className="p-4 text-slate-600">
                          {nombreCategoria(producto.idCategoria)}
                        </td>

                        <td className="p-4">
                          {producto.stock} und.
                        </td>

                        <td className="p-4 font-semibold">
                          S/ {Number(producto.precio).toFixed(2)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              estado === 'Disponible'
                                ? 'bg-emerald-100 text-emerald-700'
                                : estado === 'Agotado'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {estado}
                          </span>
                        </td>

                        <td className="p-4">
                          {!soloLectura && <button
                            type="button"
                            onClick={() => abrirEdicion(producto)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtrados.length === 0 && (
                <p className="text-center text-sm text-slate-500 p-8">
                  No se encontraron productos.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {!soloLectura && mostrarFormulario && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {productoEditando !== null
                    ? 'Editar producto'
                    : 'Nuevo producto'}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {productoEditando !== null
                    ? 'Actualizar producto en SQL Server'
                    : 'Registrar producto en SQL Server'}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={guardando}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-50"
                aria-label="Cerrar formulario"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={guardarProducto}
              className="p-5 space-y-4 overflow-y-auto"
            >
              {errorFormulario && (
                <div
                  role="alert"
                  className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm"
                >
                  {errorFormulario}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="sql-codigo"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Código *
                  </label>

                  <input
                    id="sql-codigo"
                    type="text"
                    required
                    maxLength={50}
                    value={formulario.codigo}
                    onChange={(e) =>
                      actualizarCampo('codigo', e.target.value)
                    }
                    placeholder="PRD-006"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sql-categoria"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Categoría *
                  </label>

                  <select
                    id="sql-categoria"
                    required
                    value={formulario.idCategoria}
                    onChange={(e) =>
                      actualizarCampo('idCategoria', e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="">
                      Selecciona una categoría
                    </option>

                    {categorias.map((categoria) => (
                      <option
                        key={categoria.idCategoria}
                        value={categoria.idCategoria}
                      >
                        {categoria.nombreCategoria}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sql-nombre"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Nombre del producto *
                </label>

                <input
                  id="sql-nombre"
                  type="text"
                  required
                  value={formulario.nombre}
                  onChange={(e) =>
                    actualizarCampo('nombre', e.target.value)
                  }
                  placeholder="Ejemplo: Teclado inalámbrico"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="sql-stock"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Stock *
                  </label>

                 
<input
  id="sql-stock"
  type="number"
  required
  min={0}
  step={1}
  value={formulario.stock}
  onChange={(e) =>
    actualizarCampo('stock', e.target.value)
  }
  readOnly={productoEditando !== null}
  className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm ${
    productoEditando !== null
      ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
      : 'bg-white'
  }`}
/>

                </div>

                <div>
                  <label
                    htmlFor="sql-minimo"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Stock mínimo *
                  </label>

                  <input
                    id="sql-minimo"
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={formulario.stockMinimo}
                    onChange={(e) =>
                      actualizarCampo('stockMinimo', e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sql-precio"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Precio (S/) *
                  </label>

                  <input
                    id="sql-precio"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formulario.precio}
                    onChange={(e) =>
                      actualizarCampo('precio', e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="sql-imagen"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Imagen (opcional)
                </label>

                <input
                  id="sql-imagen"
                  type="text"
                  value={formulario.imagenUrl}
                  onChange={(e) =>
                    actualizarCampo('imagenUrl', e.target.value)
                  }
                  placeholder="producto.jpg"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <p className="text-xs text-slate-500">
                Los campos marcados con * son obligatorios.
              </p>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />

                  {guardando
                    ? 'Guardando...'
                    : productoEditando !== null
                    ? 'Guardar cambios'
                    : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
