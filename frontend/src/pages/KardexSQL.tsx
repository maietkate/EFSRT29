
import { useEffect, useState } from 'react';

import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  History,
  Database,
  Plus
} from 'lucide-react';



import {
  obtenerKardexApi,
  registrarMovimientoApi
} from '../services/inventarioApi';

import type { MovimientoKardexApi } from '../services/inventarioApi';

import { obtenerProductosApi } from '../services/productoApi';
import type { ProductoApi } from '../services/productoApi';

export default function KardexSQL() {
  const [movimientos, setMovimientos] = useState<MovimientoKardexApi[]>([]);
  const [productos, setProductos] = useState<ProductoApi[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  
const [idProductoSeleccionado, setIdProductoSeleccionado] = useState('');
const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
const [cantidadMovimiento, setCantidadMovimiento] = useState('');
const [motivoMovimiento, setMotivoMovimiento] = useState('');
const [guardandoMovimiento, setGuardandoMovimiento] = useState(false);
const [errorFormulario, setErrorFormulario] = useState('');

const [, setMensajeExito] = useState('');


const cerrarFormulario = () => {
  if (guardandoMovimiento) return;

  setMostrarFormulario(false);
  setIdProductoSeleccionado('');
  setTipoMovimiento('ENTRADA');
  setCantidadMovimiento('');
  setMotivoMovimiento('');
  setErrorFormulario('');
};

const guardarMovimiento = async () => {
  setErrorFormulario('');

  const idProducto = Number(idProductoSeleccionado);
  const cantidad = Number(cantidadMovimiento);

  if (!idProductoSeleccionado || !Number.isInteger(idProducto)) {
    setErrorFormulario('Selecciona un producto.');
    return;
  }

  if (
    !cantidadMovimiento.trim() ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {
    setErrorFormulario('Ingresa una cantidad válida mayor que cero.');
    return;
  }

  const producto = productos.find(
    (item) => item.idProducto === idProducto
  );

  if (!producto) {
    setErrorFormulario('El producto seleccionado no existe.');
    return;
  }

  if (tipoMovimiento === 'SALIDA' && cantidad > producto.stock) {
    setErrorFormulario('No hay stock suficiente para esta salida.');
    return;
  }

  if (!motivoMovimiento.trim()) {
    setErrorFormulario('Escribe el motivo del movimiento.');
    return;
  }

  setGuardandoMovimiento(true);

  try {
    await registrarMovimientoApi({
      idProducto,
      tipoMovimiento,
      cantidad,
      motivo: motivoMovimiento.trim()
    });
  } catch (err) {
    setErrorFormulario(
      err instanceof Error
        ? err.message
        : 'No se pudo registrar el movimiento.'
    );
    setGuardandoMovimiento(false);
    return;
  }

  
setMensajeExito('Movimiento registrado correctamente en SQL Server.');
setGuardandoMovimiento(false);
setMostrarFormulario(false);
setIdProductoSeleccionado('');
setTipoMovimiento('ENTRADA');
setCantidadMovimiento('');
setMotivoMovimiento('');
setErrorFormulario('');
await cargarDatos();

};





  const cargarDatos = async () => {
    setCargando(true);
    setError('');

    try {
      const [datosKardex, datosProductos] = await Promise.all([
        obtenerKardexApi(),
        obtenerProductosApi()
      ]);

      setMovimientos(datosKardex);
      setProductos(datosProductos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con Spring Boot.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreProducto = (idProducto: number | null) => {
    const producto = productos.find(
      (item) => item.idProducto === idProducto
    );

    return producto?.nombre ?? `Producto #${idProducto ?? 'N/D'}`;
  };

  const filtrados = movimientos
    .filter((movimiento) => {
      const texto = busqueda.trim().toLowerCase();

      return (
        nombreProducto(movimiento.idProducto)
          .toLowerCase()
          .includes(texto) ||
        movimiento.tipoMovimiento.toLowerCase().includes(texto) ||
        (movimiento.motivo ?? '').toLowerCase().includes(texto)
      );
    })
    .sort((a, b) => b.idMovimiento - a.idMovimiento);

  const entradas = movimientos.filter(
    (item) => item.tipoMovimiento === 'ENTRADA'
  ).length;

  const salidas = movimientos.filter(
    (item) => item.tipoMovimiento === 'SALIDA'
  ).length;

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'Sin fecha';

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return fecha;
    }

    return fechaConvertida.toLocaleString('es-PE');
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-1">
            Almacén e inventario
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Kardex SQL Server
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Historial de entradas y salidas registradas en BD_AISELL.
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
    Actualizar movimientos
  </button>

  <button
    type="button"
    onClick={() => setMostrarFormulario(true)}
    disabled={cargando || error !== ''}
    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl text-sm font-semibold"
  >
    <Plus className="w-4 h-4" />
    Nuevo movimiento
  </button>
</div>

      </div>

      <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
        <Database className="w-5 h-5 text-blue-600 shrink-0" />

        <div>
          <p className="text-sm font-semibold text-blue-800">
            Historial conectado a SQL Server
          </p>

          <p className="text-xs text-blue-700 mt-1">
            Movimientos consultados mediante Spring Boot.
            Esta pantalla es de solo lectura.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Error de conexión: {error}
        </div>
      )}

      {cargando ? (
        <div className="bg-white rounded-2xl p-10 text-center text-sm text-slate-500">
          Consultando movimientos del Kardex...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <History className="w-6 h-6 text-blue-600 mb-3" />
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Movimientos
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {movimientos.length}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <ArrowDownLeft className="w-6 h-6 text-emerald-600 mb-3" />
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Entradas
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {entradas}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <ArrowUpRight className="w-6 h-6 text-amber-600 mb-3" />
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Salidas
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {salidas}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-bold text-lg text-slate-900">
                Historial de movimientos
              </h2>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar movimiento..."
                  className="w-full sm:w-64 pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Movimiento</th>
                    <th className="p-4">Cantidad</th>
                    <th className="p-4">Stock anterior</th>
                    <th className="p-4">Stock actual</th>
                    <th className="p-4">Motivo</th>
                    <th className="p-4">Fecha</th>
                  </tr>
                </thead>

                <tbody>
                  {filtrados.map((movimiento) => {
                    const esEntrada =
                      movimiento.tipoMovimiento === 'ENTRADA';

                    return (
                      <tr
                        key={movimiento.idMovimiento}
                        className="border-t border-slate-100"
                      >
                        <td className="p-4 text-slate-500">
                          #{movimiento.idMovimiento}
                        </td>

                        <td className="p-4 font-semibold text-slate-900">
                          {nombreProducto(movimiento.idProducto)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              esEntrada
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {esEntrada ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {movimiento.tipoMovimiento}
                          </span>
                        </td>

                        <td
                          className={`p-4 font-bold ${
                            esEntrada
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {esEntrada ? '+' : '-'}
                          {movimiento.cantidad}
                        </td>

                        <td className="p-4">
                          {movimiento.stockAnterior}
                        </td>

                        <td className="p-4 font-semibold">
                          {movimiento.stockActual}
                        </td>

                        <td className="p-4 text-slate-600">
                          {movimiento.motivo || 'Sin motivo'}
                        </td>

                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {formatearFecha(movimiento.fechaMovimiento)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtrados.length === 0 && (
                <p className="text-center text-sm text-slate-500 p-8">
                  No se encontraron movimientos.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    
{mostrarFormulario && (
  <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Nuevo movimiento
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Entrada o salida de productos
          </p>
        </div>

        <button
          type="button"
          onClick={cerrarFormulario}
          disabled={guardandoMovimiento}
          className="text-slate-400 hover:text-slate-700 disabled:opacity-50"
        >
          Cerrar
        </button>
      </div>

      <div className="p-5 space-y-4">
        {errorFormulario && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
            {errorFormulario}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Producto
          </label>

          <select
            value={idProductoSeleccionado}
            onChange={(e) => setIdProductoSeleccionado(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
          >
            <option value="">Selecciona un producto</option>

            {productos.map((producto) => (
              <option
                key={producto.idProducto}
                value={producto.idProducto}
              >
                {producto.nombre} - Stock: {producto.stock}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Tipo de movimiento
          </label>

          <select
            value={tipoMovimiento}
            onChange={(e) =>
              setTipoMovimiento(e.target.value as 'ENTRADA' | 'SALIDA')
            }
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
          >
            <option value="ENTRADA">Entrada de mercadería</option>
            <option value="SALIDA">Salida de mercadería</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Cantidad
          </label>

          <input
            type="number"
            min="1"
            step="1"
            value={cantidadMovimiento}
            onChange={(e) => setCantidadMovimiento(e.target.value)}
            placeholder="Ejemplo: 10"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Motivo
          </label>

          <textarea
            value={motivoMovimiento}
            onChange={(e) => setMotivoMovimiento(e.target.value)}
            maxLength={255}
            rows={3}
            placeholder="Ejemplo: Reposición de mercadería"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={cerrarFormulario}
            disabled={guardandoMovimiento}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold"
          >
            Cancelar
          </button>

          
<button
  type="button"
  onClick={guardarMovimiento}
  disabled={guardandoMovimiento}
  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
>
  {guardandoMovimiento ? 'Guardando...' : 'Guardar movimiento'}
</button>

        </div>
      </div>
    </div>
  </div>
)}

    </div> 
  );
}
