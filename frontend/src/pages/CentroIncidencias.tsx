import { listarIncidencias, actualizarEstadoIncidencia } from '../services/incidenciasApi';

import { useEffect, useState } from 'react';
import {
  Headset,
  Clock,
  CheckCircle2,
  Search,
  Phone,
  MessageCircle,
  ClipboardList,
  UserRound,
  RefreshCw
} from 'lucide-react';

type EstadoTicket = 'Pendiente' | 'En revisión' | 'Resuelto';

interface Ticket {
  id: string;
  usuarioId: number;
  nombre: string;
  rol: string;
  telefono: string;
  motivo: string;
  pedidoId?: string | null;
  descripcion: string;
  estado: EstadoTicket;
  fecha: string;
}

type FiltroTicket = 'Todos' | EstadoTicket;


export default function CentroIncidencias() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filtro, setFiltro] = useState<FiltroTicket>('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');

  const cargarTickets = async () => {
    try {
      setTickets(await listarIncidencias());
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudieron cargar las incidencias.');
    }
  };

  useEffect(() => {
    cargarTickets();
  }, []);

  const pendientes = tickets.filter(
    (ticket) => ticket.estado === 'Pendiente'
  ).length;

  const enRevision = tickets.filter(
    (ticket) => ticket.estado === 'En revisión'
  ).length;

  const resueltos = tickets.filter(
    (ticket) => ticket.estado === 'Resuelto'
  ).length;

  const ticketsFiltrados = tickets.filter((ticket) => {
    const coincideEstado =
      filtro === 'Todos' || ticket.estado === filtro;

    const texto = busqueda.trim().toLowerCase();

    const coincideBusqueda =
      ticket.id.toLowerCase().includes(texto) ||
      ticket.nombre.toLowerCase().includes(texto) ||
      ticket.motivo.toLowerCase().includes(texto) ||
      (ticket.pedidoId || '').toLowerCase().includes(texto);

    return coincideEstado && coincideBusqueda;
  });

  const ticketSeleccionado =
    tickets.find((ticket) => ticket.id === seleccionado) || null;

  const actualizarEstado = async (id: string, nuevoEstado: EstadoTicket) => {
    try {
      await actualizarEstadoIncidencia(id, nuevoEstado);
      await cargarTickets();
      setMensaje('Estado del ticket actualizado correctamente.');
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo actualizar el ticket.');
    }
  };

  const obtenerTelefono = (telefono: string) =>
    telefono.replace(/\D/g, '');

  const abrirWhatsApp = (telefono: string) => {
    const numero = obtenerTelefono(telefono);

    if (!numero) return;

    window.open(
      `https://wa.me/51${numero}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const llamar = (telefono: string) => {
    const numero = obtenerTelefono(telefono);

    if (!numero) return;

    window.location.href = `tel:+51${numero}`;
  };

  const colorEstado = (estado: EstadoTicket) => {
    if (estado === 'Pendiente') {
      return 'bg-amber-100 text-amber-700';
    }

    if (estado === 'En revisión') {
      return 'bg-blue-100 text-blue-700';
    }

    return 'bg-emerald-100 text-emerald-700';
  };

  const formatearFecha = (fecha: string) => {
    const valor = new Date(fecha);

    return Number.isNaN(valor.getTime())
      ? fecha
      : valor.toLocaleString('es-PE');
  };

  const opciones: FiltroTicket[] = [
    'Todos',
    'Pendiente',
    'En revisión',
    'Resuelto'
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
            Soporte
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Centro de incidencias
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Consulta y gestiona los problemas reportados por los trabajadores.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarTickets}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar lista
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <ClipboardList className="w-6 h-6 text-slate-500 mb-3" />
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Total de tickets
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {tickets.length}
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
          <Headset className="w-6 h-6 text-blue-600 mb-3" />
          <p className="text-xs font-semibold text-slate-400 uppercase">
            En revisión
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {enRevision}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-3" />
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Resueltos
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {resueltos}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Tickets registrados
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />

              <input
                type="text"
                placeholder="Buscar ticket..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {opciones.map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => {
                  setFiltro(opcion);
                  setSeleccionado(null);
                  setMensaje('');
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  filtro === opcion
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opcion === 'Pendiente'
                  ? 'Pendientes'
                  : opcion === 'Resuelto'
                  ? 'Resueltos'
                  : opcion}
              </button>
            ))}
          </div>

          {ticketsFiltrados.length === 0 ? (
            <div className="py-12 text-center">
              <Headset className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                No hay tickets registrados en esta categoría.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ticketsFiltrados.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`py-4 px-3 rounded-xl ${
                    seleccionado === ticket.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-blue-600">
                          {ticket.id}
                        </span>

                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorEstado(ticket.estado)}`}>
                          {ticket.estado}
                        </span>
                      </div>

                      <p className="font-bold text-sm text-slate-900">
                        {ticket.motivo}
                      </p>

                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <UserRound className="w-4 h-4" />
                        {ticket.nombre} · {ticket.rol}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatearFecha(ticket.fecha)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSeleccionado(ticket.id);
                        setMensaje('');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
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
          {ticketSeleccionado ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400">
                  Detalle de incidencia
                </p>

                <h3 className="text-lg font-bold text-blue-600">
                  {ticketSeleccionado.id}
                </h3>
              </div>

              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colorEstado(ticketSeleccionado.estado)}`}>
                {ticketSeleccionado.estado}
              </span>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">
                    Trabajador
                  </p>
                  <p className="font-semibold">
                    {ticketSeleccionado.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ticketSeleccionado.rol}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Número de teléfono
                  </p>
                  <p className="font-semibold">
                    {ticketSeleccionado.telefono}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Motivo
                  </p>
                  <p>{ticketSeleccionado.motivo}</p>
                </div>

                {ticketSeleccionado.pedidoId && (
                  <div>
                    <p className="text-xs text-slate-400">
                      Pedido relacionado
                    </p>
                    <p>{ticketSeleccionado.pedidoId}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-400">
                    Descripción
                  </p>
                  <p className="whitespace-pre-wrap">
                    {ticketSeleccionado.descripcion}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Fecha del reporte
                  </p>
                  <p>{formatearFecha(ticketSeleccionado.fecha)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => abrirWhatsApp(ticketSeleccionado.telefono)}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-3 text-xs font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => llamar(ticketSeleccionado.telefono)}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-3 text-xs font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  Llamar
                </button>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-800">
                  Actualizar estado
                </p>

                <select
                  value={ticketSeleccionado.estado}
                  onChange={(e) =>
                    actualizarEstado(
                      ticketSeleccionado.id,
                      e.target.value as EstadoTicket
                    )
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Resuelto">Resuelto</option>
                </select>
              </div>

              {mensaje && (
                <p className="text-sm bg-blue-50 text-blue-700 rounded-xl p-3">
                  {mensaje}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <Headset className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <h3 className="font-bold text-slate-800">
                Detalle de incidencia
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Selecciona un ticket para consultar su información.
              </p>
            </div>
          )}
        </aside>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        Las incidencias se registran y actualizan en SQL Server mediante Spring Boot.
      </div>
    </div>
  );
}
