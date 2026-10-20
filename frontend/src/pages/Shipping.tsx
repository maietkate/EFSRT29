
import { useEffect, useState } from 'react';
import {
  Truck,
  Clock,
  CheckCircle2,
  Search,
  MapPin,
  Navigation,
  Package,
  UserRound,
  RefreshCw,
  ClipboardList
} from 'lucide-react';

import { shippingService } from '../services/shippingService';
import type { Envio, EstadoEnvio } from '../services/shippingService';

type Filtro = 'Todos' | EstadoEnvio;

export default function Shipping() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const cargarEnvios = () => {
    setEnvios(shippingService.listar());
  };

  useEffect(() => {
    shippingService.actualizar().catch((error) => window.alert(error instanceof Error ? error.message : 'Error al consultar envíos'));

    window.addEventListener('aisell-envios-actualizados', cargarEnvios);
    window.addEventListener('storage', cargarEnvios);

    return () => {
      window.removeEventListener('aisell-envios-actualizados', cargarEnvios);
      window.removeEventListener('storage', cargarEnvios);
    };
  }, []);

  const pendientes = envios.filter(
    (e) => e.estado === 'Pendiente'
  ).length;

  const enRuta = envios.filter(
    (e) => e.estado === 'En ruta'
  ).length;

  const entregados = envios.filter(
    (e) => e.estado === 'Entregado'
  ).length;

  const enviosFiltrados = envios.filter((envio) => {
    const coincideEstado =
      filtro === 'Todos' || envio.estado === filtro;

    const texto = busqueda.toLowerCase().trim();

    const coincideBusqueda =
      envio.id.toLowerCase().includes(texto) ||
      envio.cliente.toLowerCase().includes(texto) ||
      envio.direccion.toLowerCase().includes(texto) ||
      (envio.repartidorNombre || '').toLowerCase().includes(texto);

    return coincideEstado && coincideBusqueda;
  });

  const pedidoSeleccionado =
    envios.find((envio) => envio.id === seleccionado) || null;

  const abrirRuta = (direccion: string) => {
    const url =
      'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(direccion) +
      '&travelmode=driving';

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatoFecha = (fecha?: string) => {
    if (!fecha) return 'No registrada';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return 'Fecha no disponible';
    }

    return valor.toLocaleString('es-PE');
  };

  const estadoClase = (estado: EstadoEnvio) => {
    if (estado === 'Pendiente') {
      return 'bg-amber-100 text-amber-700';
    }

    if (estado === 'En ruta') {
      return 'bg-blue-100 text-blue-700';
    }

    return 'bg-emerald-100 text-emerald-700';
  };

  const filtros: Filtro[] = [
    'Todos',
    'Pendiente',
    'En ruta',
    'Entregado'
  ];

  const nombresFiltro: Record<Filtro, string> = {
    Todos: 'Todos',
    Pendiente: 'Pendientes',
    'En ruta': 'En ruta',
    Entregado: 'Entregados'
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            Logística
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Envíos y trazabilidad
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Supervisa los pedidos y las entregas de tus repartidores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { shippingService.actualizar().catch((error) => window.alert(error instanceof Error ? error.message : 'Error al consultar envíos')); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar lista
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Package className="w-6 h-6 text-slate-500 mb-3" />
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Total de pedidos
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {envios.length}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Clock className="w-6 h-6 text-amber-500 mb-3" />
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Pendientes
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {pendientes}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Truck className="w-6 h-6 text-blue-600 mb-3" />
          <p className="text-xs font-semibold text-slate-400 uppercase">
            En ruta
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {enRuta}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-3" />
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Entregados
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {entregados}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Gestión de pedidos
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {enviosFiltrados.length} pedidos encontrados
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar pedido o cliente..."
                className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {filtros.map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => {
                  setFiltro(opcion);
                  setSeleccionado(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  filtro === opcion
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {nombresFiltro[opcion]}
              </button>
            ))}
          </div>

          {enviosFiltrados.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">
                No se encontraron pedidos.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {enviosFiltrados.map((envio) => (
                <div
                  key={envio.id}
                  className={`py-4 px-3 rounded-xl ${
                    seleccionado === envio.id
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-blue-600 text-sm">
                          {envio.id}
                        </span>

                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoClase(envio.estado)}`}>
                          {envio.estado}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {envio.cliente}
                      </p>

                      <p className="text-xs text-slate-500 flex items-start gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {envio.direccion}
                      </p>

                      <p className="text-xs text-slate-500 flex items-start gap-2">
                        <UserRound className="w-4 h-4 shrink-0" />
                        Repartidor: {envio.repartidorNombre || 'Sin asignar'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSeleccionado(envio.id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shrink-0"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 self-start">
          {pedidoSeleccionado ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-xs text-slate-400">
                    Detalle de envío
                  </p>
                  <h3 className="font-bold text-lg text-blue-600">
                    {pedidoSeleccionado.id}
                  </h3>
                </div>

                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoClase(pedidoSeleccionado.estado)}`}>
                  {pedidoSeleccionado.estado}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Cliente</p>
                  <p className="font-semibold">
                    {pedidoSeleccionado.cliente}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Dirección de entrega
                  </p>
                  <p>{pedidoSeleccionado.direccion}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Productos
                  </p>
                  <p>
                    {pedidoSeleccionado.productos ||
                      'Sin detalle registrado'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Repartidor responsable
                  </p>
                  <p className="font-semibold">
                    {pedidoSeleccionado.repartidorNombre ||
                      'Sin asignar'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Fecha de aceptación
                  </p>
                  <p>
                    {formatoFecha(pedidoSeleccionado.fechaAceptacion)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Fecha de entrega
                  </p>
                  <p>
                    {formatoFecha(pedidoSeleccionado.fechaEntrega)}
                  </p>
                </div>

                {pedidoSeleccionado.idVenta && (
                  <div>
                    <p className="text-xs text-slate-400">
                      Venta relacionada
                    </p>
                    <p>{pedidoSeleccionado.idVenta}</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => abrirRuta(pedidoSeleccionado.direccion)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold"
              >
                <Navigation className="w-4 h-4" />
                Ver ruta en Google Maps
              </button>
            </div>
          ) : (
            <div className="text-center py-10">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800">
                Detalle del pedido
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Selecciona un pedido de la lista para consultar su información.
              </p>
            </div>
          )}
        </aside>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        Los repartidores aceptan y confirman sus entregas desde su propio panel.
        El administrador puede supervisar los cambios aquí.
      </div>
    </div>
  );
}
