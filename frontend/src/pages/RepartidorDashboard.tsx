import { crearIncidencia } from '../services/incidenciasApi';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Truck,
  Package,
  ClipboardList,
  Headset,
  LogOut,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Send,
  RefreshCw
} from 'lucide-react';

import { authService } from '../services/authService';
import { shippingService } from '../services/shippingService';
import type { Envio } from '../services/shippingService';

interface RepartidorDashboardProps {
  onLogout: () => void;
}

type Seccion = 'pendientes' | 'entregas' | 'ayuda';

const motivosAyuda = [
  'El cliente no responde',
  'El cliente no recibe el pedido',
  'Dirección incorrecta o incompleta',
  'Problema con el producto o paquete',
  'No puedo ingresar a mi cuenta',
  'Problema al confirmar una entrega',
  'Otro inconveniente'
];

export default function RepartidorDashboard({
  onLogout
}: RepartidorDashboardProps) {
  const usuario = authService.getCurrentUser();

  const [seccion, setSeccion] = useState<Seccion>('pendientes');
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [mensaje, setMensaje] = useState('');

  const [telefono, setTelefono] = useState('');
  const [motivo, setMotivo] = useState(motivosAyuda[0]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensajeAyuda, setMensajeAyuda] = useState('');

  const actualizarEnvios = () => {
    setEnvios(shippingService.listar());
  };

  useEffect(() => {
    shippingService.actualizar().catch((error) => setMensaje(error instanceof Error ? error.message : 'No se pudieron consultar los envíos.'));

    window.addEventListener(
      'aisell-envios-actualizados',
      actualizarEnvios
    );

    window.addEventListener('storage', actualizarEnvios);

    return () => {
      window.removeEventListener(
        'aisell-envios-actualizados',
        actualizarEnvios
      );

      window.removeEventListener('storage', actualizarEnvios);
    };
  }, []);

  const pendientes = envios.filter(
    (envio) => envio.estado === 'Pendiente'
  );

  const misEntregas = envios.filter(
    (envio) => envio.repartidorId === usuario?.id
  );

  const enRuta = misEntregas.filter(
    (envio) => envio.estado === 'En ruta'
  );

  const entregados = misEntregas.filter(
    (envio) => envio.estado === 'Entregado'
  );

  const aceptarPedido = async (id: string) => {
    if (!usuario) return;
    try {
      await shippingService.aceptar(id, usuario.id, usuario.nombre);
      setMensaje('Pedido aceptado correctamente.');
      setSeccion('entregas');
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo aceptar el pedido.');
      await shippingService.actualizar().catch(() => {});
    }
  };

  const entregarPedido = async (id: string) => {
    if (!usuario) return;
    try {
      await shippingService.entregar(id, usuario.id);
      setMensaje('Entrega confirmada correctamente.');
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo confirmar la entrega.');
      await shippingService.actualizar().catch(() => {});
    }
  };

  const verRuta = (direccion: string) => {
    const url =
      'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(direccion) +
      '&travelmode=driving';

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const enviarConsulta = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensajeAyuda('');

    if (!usuario) return;

    if (!/^\d{9}$/.test(telefono.trim())) {
      setMensajeAyuda('Ingresa un teléfono válido de 9 dígitos.');
      return;
    }

    if (descripcion.trim().length < 10) {
      setMensajeAyuda('Describe el problema con más detalle.');
      return;
    }

    try {
      const ticket = await crearIncidencia({
        telefono: telefono.trim(),
        motivo,
        pedidoId: pedidoSeleccionado || null,
        descripcion: descripcion.trim()
      });
      setDescripcion('');
      setPedidoSeleccionado('');
      setMensajeAyuda(
        `Reporte ${ticket.id} registrado correctamente.`
      );
    } catch {
      setMensajeAyuda('No se pudo guardar el reporte.');
    }
  };

  const estiloMenu = (activo: boolean) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      activo
        ? 'bg-blue-50 text-blue-600'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 text-white font-bold rounded-xl w-10 h-10 flex items-center justify-center shadow-md">
            AI
          </div>
          <span className="text-xl font-bold text-slate-900">
            Aisell
          </span>
        </div>

        <div className="px-5 mt-5">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3">
            Panel del repartidor
          </p>

          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setSeccion('pendientes');
                setMensaje('');
                actualizarEnvios();
              }}
              className={estiloMenu(seccion === 'pendientes')}
            >
              <ClipboardList className="w-5 h-5" />
              Pedidos pendientes
            </button>

            <button
              type="button"
              onClick={() => {
                setSeccion('entregas');
                setMensaje('');
                actualizarEnvios();
              }}
              className={estiloMenu(seccion === 'entregas')}
            >
              <Truck className="w-5 h-5" />
              Mis entregas
            </button>

            <button
              type="button"
              onClick={() => {
                setSeccion('ayuda');
                setMensaje('');
              }}
              className={estiloMenu(seccion === 'ayuda')}
            >
              <Headset className="w-5 h-5" />
              Centro de ayuda
            </button>
          </nav>
        </div>

        <div className="mt-auto p-5 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
              <User className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {usuario?.nombre || 'Repartidor'}
              </p>
              <p className="text-xs text-slate-500">
                Repartidor
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-700"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">
              AISELL / Repartidor
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              Panel de entregas
            </h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Truck className="w-5 h-5 text-blue-600" />
            {usuario?.nombre || 'Repartidor'}
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Bienvenido, {usuario?.nombre.split(' ')[0] || 'Repartidor'}
            </h2>

            <p className="text-slate-500 text-sm mt-1">
              Consulta los pedidos disponibles y administra tus entregas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <ClipboardList className="w-6 h-6 text-amber-500 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase">
                Disponibles
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {pendientes.length}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <Clock className="w-6 h-6 text-blue-500 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase">
                Mis pedidos en ruta
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {enRuta.length}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase">
                Mis entregas completadas
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {entregados.length}
              </p>
            </div>
          </div>

          {mensaje && seccion !== 'ayuda' && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl p-4 text-sm">
              {mensaje}
            </div>
          )}

          {seccion === 'pendientes' && (
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">
                  Pedidos pendientes
                </h3>

                <button
                  type="button"
                  onClick={() => { shippingService.actualizar().catch((error) => setMensaje(error instanceof Error ? error.message : 'Error al actualizar')); }}
                  className="flex items-center gap-2 text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-100"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar lista
                </button>
              </div>

              {pendientes.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    No hay pedidos pendientes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pendientes.map((envio) => (
                    <div
                      key={envio.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-600">
                          {envio.id}
                        </span>

                        <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                          Pendiente
                        </span>
                      </div>

                      <p className="font-semibold text-slate-900">
                        {envio.cliente}
                      </p>

                      <p className="text-sm text-slate-500 flex gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {envio.direccion}
                      </p>

                      <p className="text-sm text-slate-600">
                        Productos: {envio.productos || 'Sin detalle registrado'}
                      </p>

                      <button
                        type="button"
                        onClick={() => aceptarPedido(envio.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm"
                      >
                        Aceptar pedido
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {seccion === 'entregas' && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                Mis entregas
              </h3>

              {misEntregas.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                  <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    Todavía no has aceptado ningún pedido.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {misEntregas.map((envio) => (
                    <div
                      key={envio.id}
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-600">
                          {envio.id}
                        </span>

                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            envio.estado === 'Entregado'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {envio.estado}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-900">
                        {envio.cliente}
                      </p>

                      <p className="text-sm text-slate-500 flex gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {envio.direccion}
                      </p>

                      <p className="text-sm text-slate-600">
                        Productos: {envio.productos || 'Sin detalle registrado'}
                      </p>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => verRuta(envio.direccion)}
                          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold"
                        >
                          <Navigation className="w-4 h-4" />
                          Ver ruta
                        </button>

                        {envio.estado === 'En ruta' && (
                          <button
                            type="button"
                            onClick={() => entregarPedido(envio.id)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Marcar como entregado
                          </button>
                        )}
                      </div>

                      {envio.fechaEntrega && (
                        <p className="text-xs text-slate-500">
                          Entregado el{' '}
                          {new Date(envio.fechaEntrega).toLocaleString('es-PE')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {seccion === 'ayuda' && (
            <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm max-w-3xl">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Centro de ayuda
              </h3>

              <p className="text-sm text-slate-500 mb-6">
                Reporta cualquier inconveniente relacionado con tus entregas.
              </p>

              <form onSubmit={enviarConsulta} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Trabajador
                  </label>

                  <input
                    value={usuario?.nombre || ''}
                    readOnly
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Número de teléfono *
                  </label>

                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={9}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="987654321"
                      required
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Motivo de consulta *
                  </label>

                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                  >
                    {motivosAyuda.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Pedido relacionado
                  </label>

                  <select
                    value={pedidoSeleccionado}
                    onChange={(e) => setPedidoSeleccionado(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="">Ninguno</option>

                    {misEntregas.map((envio) => (
                      <option key={envio.id} value={envio.id}>
                        {envio.id} - {envio.cliente}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Descripción del problema *
                  </label>

                  <textarea
                    rows={5}
                    maxLength={1000}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe detalladamente lo ocurrido..."
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-y"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-3 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                  Enviar reporte
                </button>
              </form>

              {mensajeAyuda && (
                <p className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm">
                  {mensajeAyuda}
                </p>
              )}

              <p className="text-xs text-slate-400 mt-5">
                Los reportes se guardan localmente durante esta fase de pruebas.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
