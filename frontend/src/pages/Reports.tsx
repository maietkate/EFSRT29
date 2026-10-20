
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, FileSpreadsheet, FileDown, Package } from 'lucide-react';
import { obtenerVentasApi, obtenerDetallesVentaApi } from '../services/ventaApi';
import type { DetalleVentaApi } from '../services/ventaApi';
import type { VentaApi } from '../services/ventaApi';
import { obtenerProductosApi } from '../services/productoApi';
import type { ProductoApi } from '../services/productoApi';

import { obtenerCategoriasApi } from '../services/categoriaApi';
import type { CategoriaApi } from '../services/categoriaApi';

export default function Reports() {
  const [kind, setKind] = useState<'ventas' | 'inventario'>('ventas');
  const [refresh, setRefresh] = useState(0);
  const [sales, setSales] = useState<VentaApi[]>([]);
  const [detalles, setDetalles] = useState<Record<number, DetalleVentaApi[]>>({});
  const [products, setProducts] = useState<ProductoApi[]>([]);
  
const [categories, setCategories] = useState<CategoriaApi[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      setLoading(true);
      setError('');

      try {
        
const [ventas, productos, categorias] = await Promise.all([
          obtenerVentasApi(),
          obtenerProductosApi(),
          obtenerCategoriasApi()
        ]);
        const pares = await Promise.all(
          ventas.map(async (venta) => [venta.idVenta, await obtenerDetallesVentaApi(venta.idVenta)] as const)
        );
        if (activo) {
          setSales(ventas);
          setProducts(productos);
          setCategories(categorias);
          setDetalles(Object.fromEntries(pares));
        }

      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar los reportes desde SQL Server.'
          );
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [refresh]);

  const money = (n: number) =>
    `S/ ${n.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const fechaActual = new Date();

  const mesActual = `${fechaActual.getFullYear()}-${String(
    fechaActual.getMonth() + 1
  ).padStart(2, '0')}`;

  const nombreMes = fechaActual.toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric'
  });

  const ventasMensuales = useMemo(
    () =>
      sales.filter(
        (venta) =>
          venta.fechaVenta?.substring(0, 7) === mesActual &&
          venta.estadoVenta?.toLowerCase() === 'completado'
      ),
    [sales, mesActual]
  );

  const totalSales = ventasMensuales.reduce(
    (sum, venta) => sum + venta.total,
    0
  );

  const ventasTotales = sales.filter(
    (venta) => venta.estadoVenta?.toLowerCase() === 'completado'
  ).length;

  const stockCritico = products.filter(
    (producto) =>
      producto.stock <= (producto.stockMinimo ?? 0)
  ).length;

  const valorInventario = products.reduce(
    (total, producto) =>
      total + producto.stock * producto.precio,
    0
  );

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'Sin fecha';

    const fechaNormalizada = fecha.includes('T')
      ? fecha
      : fecha.replace(' ', 'T');

    const fechaObjeto = new Date(fechaNormalizada);

    return Number.isNaN(fechaObjeto.getTime())
      ? fecha
      : fechaObjeto.toLocaleString('es-PE');
  };

  const exportCsv = () => {
    if (loading || error) return;

    const rows =
      kind === 'ventas'
        ? [
            ['Código de venta', 'Fecha', 'Producto', 'Cantidad', 'Precio unitario', 'Importe del producto', 'Total de venta'],
            ...ventasMensuales.flatMap((venta) =>
              (detalles[venta.idVenta] || []).map((detalle) => [
                venta.codigoVenta,
                formatearFecha(venta.fechaVenta),
                products.find((p) => p.idProducto === detalle.idProducto)?.nombre ?? `Producto ${detalle.idProducto}`,
                String(detalle.cantidad),
                String(detalle.precioUnitario),
                String(detalle.subtotal),
                String(venta.total)
              ])
            )
          ]
        : [
            
[
  'Código',
  'Producto',
  'Categoría',
  'Stock',
  'Stock mínimo',
  'Precio',
  'Valor'
],
...products.map((producto) => [
  producto.codigo,
  producto.nombre,
  categories.find(
    (categoria) => categoria.idCategoria === producto.idCategoria
  )?.nombreCategoria ?? 'Sin categoría',
  String(producto.stock),
  String(producto.stockMinimo ?? ''),
  String(producto.precio),
  String(producto.stock * producto.precio)
])

          ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(',')
      )
      .join('\r\n');

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = `reporte-${kind}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (loading || error) return;
    window.print();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
          ANÁLISIS
        </p>

        <h1 className="text-3xl font-bold text-slate-900">
          Reportes del negocio
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Reportes calculados con las ventas y existencias de SQL Server.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <button
          onClick={() => setKind('ventas')}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${
            kind === 'ventas'
              ? 'bg-blue-600 text-white'
              : 'bg-white border'
          }`}
        >
          Ventas mensuales
        </button>

        <button
          onClick={() => setKind('inventario')}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${
            kind === 'inventario'
              ? 'bg-blue-600 text-white'
              : 'bg-white border'
          }`}
        >
          Auditoría de inventario y stock
        </button>

        <button
          onClick={() => setRefresh((valor) => valor + 1)}
          disabled={loading}
          className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar datos'}
        </button>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 text-sm">
          Consultando información de SQL Server...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          No se pudieron cargar los datos: {error}
        </div>
      )}

      {!loading && !error && (
        <section className="bg-white rounded-2xl border p-6 space-y-4 print:border-0 print:p-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {kind === 'ventas' ? (
                <BarChart3 className="text-blue-600" />
              ) : (
                <Package className="text-blue-600" />
              )}

              <div>
                <h2 className="font-bold text-xl">
                  {kind === 'ventas'
                    ? 'Reporte de ventas mensuales'
                    : 'Auditoría de inventario y stock'}
                </h2>

                <p className="text-sm text-slate-500">
                  {kind === 'ventas'
                    ? `Periodo: ${nombreMes}`
                    : 'Existencias actuales'}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Generado: {new Date().toLocaleString('es-PE')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-white text-sm"
              >
                <FileSpreadsheet size={16} />
                Exportar CSV
              </button>

              <button
                onClick={exportPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm"
              >
                <FileDown size={16} />
                Exportar PDF
              </button>
            </div>
          </div>

          {kind === 'ventas' ? (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Ventas completadas registradas
                  </p>
                  <p className="text-2xl font-bold">
                    {ventasTotales}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Ingresos del mes
                  </p>
                  <p className="text-2xl font-bold">
                    {money(totalSales)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Ventas este mes
                  </p>
                  <p className="text-2xl font-bold">
                    {ventasMensuales.length}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3">N.º venta</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Productos vendidos</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ventasMensuales.map((venta) => (
                      <tr
                        key={venta.idVenta}
                        className="border-b"
                      >
                        <td className="p-3">
                          {venta.codigoVenta}
                        </td>

                        <td className="p-3">
                          {formatearFecha(venta.fechaVenta)}
                        </td>

                        <td className="p-3">
                          {(detalles[venta.idVenta] || []).map((detalle) =>
                            `${products.find((p) => p.idProducto === detalle.idProducto)?.nombre ?? `Producto ${detalle.idProducto}`} × ${detalle.cantidad}`
                          ).join(', ') || 'Sin detalle'}
                        </td>

                        <td className="p-3">
                          {venta.estadoVenta ?? 'Sin estado'}
                        </td>

                        <td className="p-3 font-bold">
                          {money(venta.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {ventasMensuales.length === 0 && (
                  <p className="py-8 text-center text-slate-500">
                    No hay ventas completadas registradas durante este mes.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Productos registrados
                  </p>
                  <p className="text-2xl font-bold">
                    {products.length}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Productos bajo stock
                  </p>
                  <p className="text-2xl font-bold">
                    {stockCritico}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Valor total del inventario
                  </p>
                  <p className="text-2xl font-bold">
                    {money(valorInventario)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3">Código</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Stock actual</th>
                      <th className="p-3">Stock mínimo</th>
                      <th className="p-3">Precio</th>
                      <th className="p-3">Valor stock</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((producto) => (
                      <tr
                        key={producto.idProducto}
                        className="border-b"
                      >
                        <td className="p-3">
                          {producto.codigo}
                        </td>

                        <td className="p-3">
                          {producto.nombre}
                        </td>

                        <td className="p-3">
                          
{categories.find(
  (categoria) => categoria.idCategoria === producto.idCategoria
)?.nombreCategoria ?? 'Sin categoría'}

                        </td>

                        <td className="p-3">
                          {producto.stock}
                        </td>

                        <td className="p-3">
                          {producto.stockMinimo ?? 'No definido'}
                        </td>

                        <td className="p-3">
                          {money(producto.precio)}
                        </td>

                        <td className="p-3 font-bold">
                          {money(producto.stock * producto.precio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {products.length === 0 && (
                  <p className="py-8 text-center text-slate-500">
                    No hay productos registrados en el inventario.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <style>
        {`@media print {
          body * {
            visibility: hidden;
          }
          section, section * {
            visibility: visible;
          }
          section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
        }`}
      </style>
    </div>
  );
}
