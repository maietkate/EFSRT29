import { crearIncidencia } from '../services/incidenciasApi';

import { useState } from 'react';
import {
  Headset,
  Phone,
  Send,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';

import { authService } from '../services/authService';

const MOTIVOS = [
  'Problema al registrar una venta',
  'Problema con el stock de un producto',
  'Problema con un pedido',
  'Problema con un cliente',
  'Error en el precio de un producto',
  'No puedo ingresar a mi cuenta',
  'Problema técnico del sistema',
  'Otro inconveniente'
];

export default function CentroAyudaVendedor() {
  const usuario = authService.getCurrentUser();

  const [telefono, setTelefono] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [pedidoId, setPedidoId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);

  const enviarReporte = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setError(false);

    if (!usuario || usuario.rol !== 'VENDEDOR') {
      setMensaje('No se pudo identificar al vendedor.');
      setError(true);
      return;
    }

    const numero = telefono.trim();
    const detalle = descripcion.trim();

    if (!/^9\d{8}$/.test(numero)) {
      setMensaje('Ingresa un número de celular peruano válido de 9 dígitos.');
      setError(true);
      return;
    }

    if (detalle.length < 10 || detalle.length > 1000) {
      setMensaje('Describe el problema entre 10 y 1000 caracteres.');
      setError(true);
      return;
    }

    try {
      const ticket = await crearIncidencia({ telefono: numero, motivo, pedidoId: pedidoId.trim(), descripcion: detalle });
      setMotivo(MOTIVOS[0]);
      setPedidoId('');
      setDescripcion('');
      setMensaje(`Reporte ${ticket.id} registrado correctamente.`);
      setError(false);
    } catch {
      setMensaje('No se pudo guardar el reporte. Inténtalo nuevamente.');
      setError(true);
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-full">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
            Soporte al trabajador
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Centro de ayuda
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Reporta problemas relacionados con ventas, productos,
            pedidos o tu cuenta.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Headset className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Registrar una incidencia
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Completa el formulario para enviar un reporte al administrador.
              </p>
            </div>
          </div>

          <form onSubmit={enviarReporte} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trabajador
              </label>

              <input
                type="text"
                value={usuario?.nombre || ''}
                readOnly
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número de teléfono *
              </label>

              <div className="relative">
                <Phone className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />

                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={9}
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))
                  }
                  placeholder="987654321"
                  className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <p className="text-xs text-slate-400 mt-1">
                Ingresa un celular peruano de 9 dígitos.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivo de consulta *
              </label>

              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {MOTIVOS.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número de pedido o venta relacionada
              </label>

              <div className="relative">
                <ClipboardList className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />

                <input
                  type="text"
                  maxLength={60}
                  value={pedidoId}
                  onChange={(e) => setPedidoId(e.target.value)}
                  placeholder="Ejemplo: PED-1841 (opcional)"
                  className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Descripción del problema *
                </label>

                <span className="text-xs text-slate-400">
                  {descripcion.length}/1000
                </span>
              </div>

              <textarea
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe detalladamente lo ocurrido..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold"
            >
              <Send className="w-4 h-4" />
              Enviar reporte
            </button>
          </form>

          {mensaje && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-xl p-4 text-sm ${
                error
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {!error && (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              )}

              <p>{mensaje}</p>
            </div>
          )}

          <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
            Los reportes se guardan localmente durante esta etapa de pruebas.
            Posteriormente se integrarán con SQL Server.
          </p>
        </div>
      </div>
    </div>
  );
}
